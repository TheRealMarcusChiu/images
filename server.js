#!/usr/bin/env node
/**
 * server.js — zero-dependency admin server for the Mosaic Gallery.
 *
 *   node server.js            # then open http://127.0.0.1:3000
 *
 * Serves the static gallery and an admin UI at /admin. The admin can:
 *   - add a tile from an uploaded image/video/audio, an image URL to download,
 *     a YouTube link to embed, or a YouTube link whose audio is extracted via
 *     yt-dlp into an audio tile; the submission timestamp (ISO 8601, -05:00) is
 *     auto-generated and an uploaded/downloaded file is saved to content/media/
 *     named as <timestamp><ext>.
 *   - edit a tile's description, date (which renames its media files), and link.
 *   - hide / show a tile (hidden tiles stay in items.js but are skipped by the
 *     gallery).
 *   - delete a tile (removes its items.js entry and its media/poster files).
 *
 * The server is the source of truth for content/items.js: it parses the file,
 * mutates the array, and rewrites it in a normalized format.
 *
 * Intended for local use and has no auth. Binds to 127.0.0.1 by default; set
 * HOST=0.0.0.0 (and PORT to taste) to accept remote connections — do this only
 * on a trusted network, since the admin API is unauthenticated.
 */

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rename, unlink, readdir } from 'node:fs/promises';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname, normalize as normPath, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { get as httpsGet, request as httpsRequest } from 'node:https';
import { get as httpGet, request as httpRequest } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import vm from 'node:vm';

const pexecFile = promisify(execFile);

const ROOT       = dirname(fileURLToPath(import.meta.url));
const MEDIA_DIR  = join(ROOT, 'content', 'media');
const ITEMS_FILE = join(ROOT, 'content', 'items.js');
const HOST       = process.env.HOST || '127.0.0.1';
const PORT       = process.env.PORT || 3000;
const MAX_BODY   = 512 * 1024 * 1024; // 512 MB ceiling

const TAGGER_URL       = process.env.TAGGER_URL || 'https://media-tagger.lan/v1/tag';
const TAGGER_AUDIO_URL = process.env.TAGGER_AUDIO_URL || 'https://media-tagger.lan/v1/tag/audio';
const TAGGER_PROVIDER  = process.env.TAGGER_PROVIDER || 'ollama';
const TAGGER_MODEL     = process.env.TAGGER_MODEL || 'qwen3-vl:8b';
const TAGGER_TIMEOUT   = Number(process.env.TAGGER_TIMEOUT) || 120000; // vision/audio models are slow; generous per-file cap

const DEFAULT_HEADER =
`/* ──────────────────────────────────────────────────────────────────────────
   Gallery content — managed by server.js (the admin at /admin).
   Loaded directly by index.html via <script>; no build step.
   Entry fields: type (image|video|audio|youtube|quote), date, file|id,
                 quote?+author? (quote tiles), title? (audio: player/queue),
                 desc?, link?, poster? (video frame / audio cover art), hidden?
   ────────────────────────────────────────────────────────────────────────── */
`;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.ico': 'image/x-icon',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
  '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.mov': 'video/quicktime', '.ogv': 'video/ogg',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav',
  '.ogg': 'audio/ogg', '.oga': 'audio/ogg', '.opus': 'audio/opus',
  '.flac': 'audio/flac', '.aac': 'audio/aac', '.weba': 'audio/webm',
};
const EXT_BY_TYPE = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg',
  'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif',
  'image/svg+xml': '.svg', 'video/mp4': '.mp4', 'video/webm': '.webm',
  'video/quicktime': '.mov', 'video/ogg': '.ogv',
  'audio/mpeg': '.mp3', 'audio/mp3': '.mp3', 'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a', 'audio/aac': '.aac', 'audio/wav': '.wav',
  'audio/x-wav': '.wav', 'audio/ogg': '.ogg', 'audio/opus': '.opus',
  'audio/flac': '.flac', 'audio/x-flac': '.flac', 'audio/webm': '.weba',
};

/* ── Timestamp: ISO 8601 wall-clock at UTC-5, with milliseconds ── */
function nowMinus5ISO() {
  const s = new Date(Date.now() - 5 * 60 * 60 * 1000);
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${s.getUTCFullYear()}-${p(s.getUTCMonth() + 1)}-${p(s.getUTCDate())}` +
         `T${p(s.getUTCHours())}:${p(s.getUTCMinutes())}:${p(s.getUTCSeconds())}` +
         `.${p(s.getUTCMilliseconds(), 3)}-05:00`;
}

const extOfType = (ct) => EXT_BY_TYPE[(ct || '').toLowerCase()] || '';
function pickExt(filenameOrUrl, contentType) {
  const e = extname((filenameOrUrl || '').split('?')[0]).toLowerCase();
  return e || extOfType(contentType);
}

function youtubeId(input) {
  const s = (input || '').trim();
  const m = s.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  return null;
}

/* ── Extract a YouTube video's audio via yt-dlp (no ffmpeg needed) ──
   Downloads the best audio-only stream straight to content/media/ named
   <baseName>.<ext> — m4a/webm/opus, all browser-playable. Returns the saved
   filename plus the video title and thumbnail URL for caption/cover. Requires
   yt-dlp on PATH; throws a clear, actionable error if it is missing. */
async function extractYouTubeAudio(url, baseName) {
  await mkdir(MEDIA_DIR, { recursive: true });
  const outTpl = join(MEDIA_DIR, `${baseName}.%(ext)s`);
  let stdout = '';
  try {
    const r = await pexecFile('yt-dlp', [
      // Prefer m4a/AAC (the broadest <audio> support, incl. Safari/iOS, which
      // can't play webm/opus); fall back to any best audio, then any stream.
      // With ffmpeg present yt-dlp auto-remuxes DASH into a clean container.
      '-f', 'bestaudio[ext=m4a]/bestaudio/best',
      '--no-playlist',
      '--no-progress',
      '--max-filesize', '512M',
      '-o', outTpl,
      '--no-simulate',
      '--print', '%(title)s\n%(thumbnail)s',
      url,
    ], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
    stdout = r.stdout || '';
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new Error('yt-dlp is not installed on the server — install it to extract YouTube audio (e.g. brew install yt-dlp)');
    }
    const tail = (e.stderr || e.stdout || e.message || 'yt-dlp failed').toString().trim().split('\n').pop();
    throw new Error(`yt-dlp failed: ${tail}`);
  }

  const produced = (await readdir(MEDIA_DIR))
    .find((f) => f.startsWith(`${baseName}.`) && !f.includes('-poster'));
  if (!produced) throw new Error('yt-dlp produced no audio file');

  const [title, thumb] = stdout.split('\n').map((s) => (s || '').trim());
  return { file: produced, title: title || '', thumb: /^https?:\/\//.test(thumb || '') ? thumb : '' };
}

/* ── Grab a still from the YouTube video itself as cover art ──
   yt-dlp resolves a low-res video stream URL; ffmpeg reads only the opening
   frames and picks the most representative one (the literal first frame is
   usually a black fade-in). Saves <baseName>-poster.jpg; returns the filename,
   or null if anything goes wrong (the tile then falls back to its waveform). */
async function extractYouTubeFrame(url, baseName) {
  await mkdir(MEDIA_DIR, { recursive: true });
  let vurl = '';
  try {
    const { stdout } = await pexecFile('yt-dlp', [
      '-f', 'bestvideo[height<=480][ext=mp4]/bestvideo[height<=480]/worstvideo/worst',
      '--no-playlist', '--get-url', url,
    ], { cwd: ROOT, maxBuffer: 8 * 1024 * 1024, timeout: 60000 });
    vurl = (stdout || '').trim().split('\n')[0];
  } catch { return null; }
  if (!vurl) return null;

  const fname = `${baseName}-poster.jpg`;
  try {
    await pexecFile('ffmpeg', [
      '-y', '-loglevel', 'error', '-i', vurl,
      '-vf', 'thumbnail=n=100', '-frames:v', '1', '-q:v', '3',
      join(MEDIA_DIR, fname),
    ], { cwd: ROOT, maxBuffer: 8 * 1024 * 1024, timeout: 60000 });
  } catch { return null; }
  return fname;
}

/* ── content/items.js as data ── */
async function readItems() {
  let text = '';
  try { text = await readFile(ITEMS_FILE, 'utf8'); } catch { return []; }
  const sandbox = { window: {} };
  try { vm.runInNewContext(text, sandbox, { timeout: 2000 }); }
  catch (e) { console.error('items.js parse error:', e.message); }
  return Array.isArray(sandbox.window.GALLERY_ITEMS) ? sandbox.window.GALLERY_ITEMS : [];
}

/* What to send to the tagger for this entry, or null. Images and video posters
   go to the image endpoint; audio is tagged from the audio file itself. */
function taggableMedia(entry) {
  if (!entry) return null;
  if (entry.type === 'image') return entry.file ? { name: entry.file, kind: 'image' } : null;
  if (entry.type === 'video') return entry.poster ? { name: entry.poster, kind: 'image' } : null;
  if (entry.type === 'audio') return entry.file ? { name: entry.file, kind: 'audio' } : null;
  return null; // quote / youtube have no local media to tag
}

function serializeEntry(entry) {
  const q = (v) => JSON.stringify(v);
  const head = [`type: ${q(entry.type)}`, `date: ${q(entry.date)}`];
  if (entry.type === 'youtube') head.push(`id: ${q(entry.id)}`);
  else if (entry.type !== 'quote') head.push(`file: ${q(entry.file)}`); // quote is text-only
  const tail = [];
  if (entry.quote)  tail.push(`quote: ${q(entry.quote)}`);
  if (entry.author) tail.push(`author: ${q(entry.author)}`);
  if (entry.title)  tail.push(`title: ${q(entry.title)}`);
  if (entry.desc)   tail.push(`desc: ${q(entry.desc)}`);
  if (entry.link)   tail.push(`link: ${q(entry.link)}`);
  if (entry.poster) tail.push(`poster: ${q(entry.poster)}`);
  if (Array.isArray(entry.tags) && entry.tags.length) tail.push(`tags: ${q(entry.tags)}`);
  if (entry.tagProvider) tail.push(`tagProvider: ${q(entry.tagProvider)}`);
  if (entry.tagModel)    tail.push(`tagModel: ${q(entry.tagModel)}`);
  if (entry.hidden) tail.push(`hidden: true`);
  let s = `  { ${head.join(', ')}`;
  if (tail.length) s += `,\n    ${tail.join(', ')}`;
  return s + ' },';
}

async function writeItems(items) {
  let prefix = DEFAULT_HEADER;
  try {
    const t = await readFile(ITEMS_FILE, 'utf8');
    const i = t.indexOf('window.GALLERY_ITEMS');
    if (i > 0) prefix = t.slice(0, i);
  } catch { /* use default header */ }
  const body = items.map(serializeEntry).join('\n\n');
  await writeFile(ITEMS_FILE, `${prefix}window.GALLERY_ITEMS = [\n${body}\n];\n`);
}

/* ── Auto commit + push after each change (serialized; scoped to content) ── */
let gitQueue = Promise.resolve();
function gitCommitPush(message) {
  const run = () => doGitCommitPush(message);
  const result = gitQueue.then(run, run);
  gitQueue = result.catch(() => {});
  return result;
}
async function doGitCommitPush(message) {
  const opts = { cwd: ROOT };
  try {
    await pexecFile('git', ['add', '-A', '--', 'content/items.js', 'content/media'], opts);
    try {
      await pexecFile('git', ['commit', '-m', message], opts);
    } catch (e) {
      const out = `${e.stdout || ''}${e.stderr || ''}`;
      if (/nothing to commit|no changes added/i.test(out)) return { committed: false, reason: 'nothing to commit' };
      throw e;
    }
    await pexecFile('git', ['push'], opts);
    return { committed: true, pushed: true };
  } catch (e) {
    const msg = (e.stderr || e.stdout || e.message || String(e)).toString().trim();
    console.error('git auto-push failed:', msg);
    return { committed: false, error: msg };
  }
}

/* ── Serialized, fire-and-forget image tagging ──
   One job at a time so the tagger isn't overloaded and items.js writes don't
   race. Re-reads items after the (slow) network call so a concurrent add/edit/
   delete isn't clobbered. Failures are logged and skipped; the startup backfill
   retries them next boot. */
let tagQueue = Promise.resolve();
function enqueueTag(date, { force = false } = {}) {
  tagQueue = tagQueue.then(() => runTagJob(date, force)).catch((e) => {
    console.error('tag job error:', (e && e.message) || e);
  });
  return tagQueue;
}
/* Speech-to-text taggers hallucinate fillers ("thank you", "music", "you") for
   vocal-less / silent audio. Strip those; if too little real signal remains, the
   audio result is junk and the caller should fall back to the cover image. */
const TAG_JUNK = new Set(['you', 'bye', 'bye bye', 'hmm', 'uh', 'um', 'ah', 'oh', 'yeah', 'okay', 'ok',
  'silence', 'no speech', 'none', 'music', '[music]', '(music)', '♪', '♪♪', '...', '.', 'subscribe']);
function meaningfulTags(tags) {
  return (tags || []).map((t) => String(t).toLowerCase().trim()).filter((t) => {
    if (!t || TAG_JUNK.has(t)) return false;
    if (/\bthank(s| you)\b/.test(t)) return false;          // "thank you", "repeated thank you", "thanks for watching"
    if (/please subscrib|next video|next time/.test(t)) return false;
    return true;
  });
}
function audioTagsAreGarbage(tags) {
  return meaningfulTags(tags).length < 3; // real transcriptions yield many themed tags
}

async function runTagJob(date, force) {
  let items = await readItems();
  let entry = items.find((e) => e.date === date);
  if (!entry) return;
  const target = taggableMedia(entry);
  if (!target) return;
  if (Array.isArray(entry.tags) && entry.tags.length && !force) return;
  const posterName = entry.poster || null;

  let tags;
  try { tags = await tagFile(join(MEDIA_DIR, target.name), target.kind); }
  catch (e) { console.error(`tagging ${target.name} failed:`, e.message); return; }

  // vocal-less / hallucinated audio → fall back to tagging the cover image
  if (target.kind === 'audio' && audioTagsAreGarbage(tags) && posterName) {
    try {
      const coverTags = await tagFile(join(MEDIA_DIR, posterName), 'image');
      if (coverTags.length) { console.log(`audio ${target.name}: weak transcription — used cover ${posterName}`); tags = coverTags; }
    } catch (e) { console.error(`cover fallback ${posterName} failed:`, e.message); }
  }
  if (!tags.length) return; // nothing usable from audio or cover — leave untagged for the next backfill

  // re-read after the slow request(s) so concurrent edits aren't overwritten
  items = await readItems();
  entry = items.find((e) => e.date === date);
  if (!entry) return;                                  // deleted while tagging
  const after = taggableMedia(entry);
  if (!after || after.name !== target.name) return;    // media changed; a newer job will cover it
  entry.tags = tags;
  entry.tagProvider = TAGGER_PROVIDER;
  entry.tagModel = TAGGER_MODEL;
  await writeItems(items);
  await gitCommitPush(`admin: tag ${entry.type} tile ${entry.date}`);
}

/* ── Download a remote file (follows redirects, size-capped) ── */
function download(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    let lib;
    try { lib = new URL(url).protocol === 'http:' ? httpGet : httpsGet; }
    catch { return reject(new Error('Invalid URL')); }
    lib(url, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        return resolve(download(new URL(res.headers.location, url).href, redirects + 1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
      const chunks = []; let size = 0;
      res.on('data', (c) => {
        size += c.length;
        if (size > MAX_BODY) { res.destroy(); reject(new Error('Remote file too large')); return; }
        chunks.push(c);
      });
      res.on('end', () => resolve({
        data: Buffer.concat(chunks),
        contentType: (res.headers['content-type'] || '').split(';')[0].trim(),
        url,
      }));
    }).on('error', reject);
  });
}

/* ── AI media tagger client (zero-dep multipart POST; protocol-aware) ──
   POSTs one file to the tagger and returns its tag list. kind 'audio' hits the
   audio endpoint with a `files` part; anything else hits the image endpoint
   with an `images` part. The .lan host is self-signed, so HTTPS verification is
   disabled. Throws on any failure so callers can skip-and-retry-later. */
async function tagFile(absPath, kind) {
  const audio = kind === 'audio';
  const data = await readFile(absPath);
  const name = basename(absPath);
  const ctype = MIME[extname(name).toLowerCase()] || 'application/octet-stream';
  const fileField = audio ? 'files' : 'images';
  const boundary = '----tagger' + Date.now().toString(16) + Math.random().toString(16).slice(2);
  const CRLF = '\r\n';
  const field = (n, v) => `--${boundary}${CRLF}Content-Disposition: form-data; name="${n}"${CRLF}${CRLF}${v}${CRLF}`;
  const head = Buffer.from(
    field('provider', TAGGER_PROVIDER) +
    field('model', TAGGER_MODEL) +
    `--${boundary}${CRLF}Content-Disposition: form-data; name="${fileField}"; filename="${name}"${CRLF}Content-Type: ${ctype}${CRLF}${CRLF}`,
    'utf8');
  const tail = Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf8');
  const payload = Buffer.concat([head, data, tail]);

  const u = new URL(audio ? TAGGER_AUDIO_URL : TAGGER_URL);
  const lib = u.protocol === 'http:' ? httpRequest : httpsRequest;
  const opts = {
    hostname: u.hostname,
    port: u.port || (u.protocol === 'http:' ? 80 : 443),
    path: u.pathname + u.search,
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': payload.length },
  };
  if (u.protocol === 'https:') opts.rejectUnauthorized = false;

  return new Promise((resolve, reject) => {
    const req = lib(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`tagger HTTP ${res.statusCode}`));
        let json;
        try { json = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
        catch { return reject(new Error('tagger returned non-JSON')); }
        const tags = json && json.results && json.results[0] && json.results[0].tags;
        if (!Array.isArray(tags)) return reject(new Error('tagger response had no tags'));
        resolve(tags.map(String));
      });
    });
    req.on('error', reject);
    req.setTimeout(TAGGER_TIMEOUT, () => req.destroy(new Error('tagger timeout')));
    req.end(payload);
  });
}

/* ── Minimal multipart/form-data parser (Buffer; binary-safe) ── */
function parseMultipart(body, boundary) {
  const fields = {}, files = {};
  const delim = Buffer.from('--' + boundary);
  const CRLF2 = Buffer.from('\r\n\r\n');
  let start = body.indexOf(delim);
  while (start !== -1) {
    const next = body.indexOf(delim, start + delim.length);
    if (next === -1) break;
    let part = body.slice(start + delim.length, next);
    start = next;
    if (part.length >= 2 && part[0] === 0x0d && part[1] === 0x0a) part = part.slice(2);
    const hEnd = part.indexOf(CRLF2);
    if (hEnd === -1) continue;
    const header = part.slice(0, hEnd).toString('utf8');
    let content = part.slice(hEnd + 4);
    if (content.length >= 2 && content[content.length - 2] === 0x0d && content[content.length - 1] === 0x0a) {
      content = content.slice(0, content.length - 2);
    }
    const name = /name="([^"]*)"/.exec(header)?.[1];
    if (!name) continue;
    const filename = /filename="([^"]*)"/.exec(header)?.[1];
    const ctype = /Content-Type:\s*([^\r\n]+)/i.exec(header)?.[1]?.trim();
    if (filename) {
      if (filename.length) files[name] = { filename, contentType: ctype || 'application/octet-stream', data: content };
    } else {
      fields[name] = content.toString('utf8');
    }
  }
  return { fields, files };
}

async function saveMediaFromBuffer(buf, ext, baseName) {
  await mkdir(MEDIA_DIR, { recursive: true });
  const fname = `${baseName}${ext}`;
  await writeFile(join(MEDIA_DIR, fname), buf);
  return fname;
}
async function tryUnlink(name) {
  if (!name) return;
  try { await unlink(join(MEDIA_DIR, name)); } catch { /* already gone */ }
}
async function tryRename(oldName, newName) {
  if (!oldName || oldName === newName) return newName || oldName;
  try { await rename(join(MEDIA_DIR, oldName), join(MEDIA_DIR, newName)); return newName; }
  catch { return oldName; } // source missing — keep old reference
}

/* ── POST /api/tiles : add a tile ── */
async function handleAdd(req, res, body) {
  const ct = req.headers['content-type'] || '';
  const boundary = /boundary=(.+)$/.exec(ct)?.[1];
  if (!boundary) return sendJSON(res, 400, { error: 'Expected multipart/form-data' });

  const { fields, files } = parseMultipart(body, boundary.replace(/^"|"$/g, ''));
  const type = fields.type;
  if (!['image', 'video', 'youtube', 'audio', 'quote'].includes(type)) {
    return sendJSON(res, 400, { error: 'type must be image, video, audio, youtube, or quote' });
  }

  const date = nowMinus5ISO();
  const entry = { type, date };
  if (fields.title?.trim()) entry.title = fields.title.trim();
  if (fields.desc?.trim()) entry.desc = fields.desc.trim();
  if (fields.link?.trim()) entry.link = fields.link.trim();
  if (fields.hidden === 'true') entry.hidden = true;

  if (type === 'quote') {
    const quote = (fields.quote || '').trim();
    if (!quote) return sendJSON(res, 400, { error: 'A quote needs text' });
    entry.quote = quote;
    if (fields.author?.trim()) entry.author = fields.author.trim();
  } else if (type === 'youtube') {
    const id = youtubeId(fields.youtube);
    if (!id) return sendJSON(res, 400, { error: 'Could not parse a YouTube video ID' });
    entry.id = id;
  } else if (type === 'image' && fields.imageUrl?.trim()) {
    let dl;
    try { dl = await download(fields.imageUrl.trim()); }
    catch (e) { return sendJSON(res, 400, { error: `Download failed: ${e.message}` }); }
    const ext = pickExt(dl.url, dl.contentType);
    if (!ext) return sendJSON(res, 400, { error: 'Could not determine image type from URL' });
    entry.file = await saveMediaFromBuffer(dl.data, ext, date);
  } else if (type === 'audio' && fields.audioUrl?.trim()) {
    const id = youtubeId(fields.audioUrl);
    if (!id) return sendJSON(res, 400, { error: 'Could not parse a YouTube video ID' });
    const canon = `https://www.youtube.com/watch?v=${id}`;
    let ex;
    try { ex = await extractYouTubeAudio(canon, date); }
    catch (e) { return sendJSON(res, 400, { error: e.message }); }
    entry.file = ex.file;
    if (!entry.title && ex.title) entry.title = ex.title; // video title → track title
    if (!entry.link) entry.link = canon;                  // YouTube link as default external link
    // Cover art: an uploaded image wins; otherwise a still from the video itself.
    if (files.poster) {
      const pext = pickExt(files.poster.filename, files.poster.contentType);
      entry.poster = await saveMediaFromBuffer(files.poster.data, pext, `${date}-poster`);
    } else {
      const frame = await extractYouTubeFrame(canon, date);
      if (frame) entry.poster = frame;
    }
  } else {
    const up = files.media;
    if (!up) return sendJSON(res, 400, { error: `No ${type} file (or image URL) provided` });
    const ext = pickExt(up.filename, up.contentType);
    if (!ext) return sendJSON(res, 400, { error: 'Could not determine file extension' });
    entry.file = await saveMediaFromBuffer(up.data, ext, date);
    // video: poster frame; audio: optional cover art — both stored as <date>-poster
    if ((type === 'video' || type === 'audio') && files.poster) {
      const pext = pickExt(files.poster.filename, files.poster.contentType);
      entry.poster = await saveMediaFromBuffer(files.poster.data, pext, `${date}-poster`);
    }
  }

  const items = await readItems();
  items.unshift(entry);
  await writeItems(items);
  const git = await gitCommitPush(`admin: add ${entry.type} tile ${entry.date}`);
  if (taggableMedia(entry)) enqueueTag(entry.date);
  return sendJSON(res, 200, { ok: true, entry, git });
}

/* ── POST /api/tiles/update : edit desc/date/link/hidden ── */
async function handleUpdate(res, body) {
  let req;
  try { req = JSON.parse(body.toString('utf8')); } catch { return sendJSON(res, 400, { error: 'Invalid JSON' }); }
  const { date } = req;
  if (!date) return sendJSON(res, 400, { error: 'Missing tile date (id)' });

  const items = await readItems();
  const entry = items.find((e) => e.date === date);
  if (!entry) return sendJSON(res, 404, { error: 'Tile not found' });

  if ('quote' in req) { const v = (req.quote || '').trim(); if (v) entry.quote = v; } // mandatory; keep prior if blank
  if ('author' in req) { const v = (req.author || '').trim(); if (v) entry.author = v; else delete entry.author; }
  if ('title' in req) { const v = (req.title || '').trim(); if (v) entry.title = v; else delete entry.title; }
  if ('desc' in req) { const v = (req.desc || '').trim(); if (v) entry.desc = v; else delete entry.desc; }
  if ('link' in req) { const v = (req.link || '').trim(); if (v) entry.link = v; else delete entry.link; }
  if ('hidden' in req) { if (req.hidden) entry.hidden = true; else delete entry.hidden; }
  if ('tags' in req) {
    const clean = Array.isArray(req.tags) ? req.tags.map((t) => String(t).trim()).filter(Boolean) : [];
    const seen = new Set();
    const uniq = clean.filter((t) => { const k = t.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
    if (uniq.length) entry.tags = uniq;
    else { delete entry.tags; delete entry.tagProvider; delete entry.tagModel; } // cleared → let backfill re-tag
  }

  if (req.newDate && req.newDate !== entry.date) {
    if (Number.isNaN(Date.parse(req.newDate))) return sendJSON(res, 400, { error: 'Invalid new date' });
    if (entry.type !== 'youtube' && entry.file) {
      entry.file = await tryRename(entry.file, `${req.newDate}${extname(entry.file)}`);
      if (entry.poster) entry.poster = await tryRename(entry.poster, `${req.newDate}-poster${extname(entry.poster)}`);
    }
    entry.date = req.newDate;
  }

  await writeItems(items);
  const git = await gitCommitPush(`admin: update tile ${entry.date}`);
  return sendJSON(res, 200, { ok: true, entry, git });
}

/* ── POST /api/tiles/media : replace/add an image on an existing tile ──
   multipart: date, slot ("file" | "poster"), media (the image). */
async function handleMedia(req, res, body) {
  const ct = req.headers['content-type'] || '';
  const boundary = /boundary=(.+)$/.exec(ct)?.[1];
  if (!boundary) return sendJSON(res, 400, { error: 'Expected multipart/form-data' });

  const { fields, files } = parseMultipart(body, boundary.replace(/^"|"$/g, ''));
  const date = fields.date;
  const slot = fields.slot === 'poster' ? 'poster' : 'file';
  if (!date) return sendJSON(res, 400, { error: 'Missing tile date (id)' });
  const up = files.media;
  if (!up) return sendJSON(res, 400, { error: 'No image provided' });
  const ext = pickExt(up.filename, up.contentType);
  if (!ext) return sendJSON(res, 400, { error: 'Could not determine image type' });

  const items = await readItems();
  const entry = items.find((e) => e.date === date);
  if (!entry) return sendJSON(res, 404, { error: 'Tile not found' });
  if (slot === 'file' && entry.type === 'youtube') {
    return sendJSON(res, 400, { error: 'A YouTube tile has no image file to replace' });
  }

  const baseName = slot === 'poster' ? `${entry.date}-poster` : entry.date;
  const newName = await saveMediaFromBuffer(up.data, ext, baseName);
  const old = entry[slot];
  if (old && old !== newName) await tryUnlink(old); // drop the previous file if renamed
  entry[slot] = newName;

  await writeItems(items);
  const git = await gitCommitPush(`admin: update ${slot} for tile ${entry.date}`);
  const tm = taggableMedia(entry);
  if (tm && tm.name === entry[slot]) enqueueTag(entry.date, { force: true });
  return sendJSON(res, 200, { ok: true, entry, git });
}

/* ── POST /api/tiles/delete : remove entry + media files ── */
async function handleDelete(res, body) {
  let req;
  try { req = JSON.parse(body.toString('utf8')); } catch { return sendJSON(res, 400, { error: 'Invalid JSON' }); }
  const { date } = req;
  if (!date) return sendJSON(res, 400, { error: 'Missing tile date (id)' });

  const items = await readItems();
  const idx = items.findIndex((e) => e.date === date);
  if (idx === -1) return sendJSON(res, 404, { error: 'Tile not found' });

  const [entry] = items.splice(idx, 1);
  await tryUnlink(entry.file);
  await tryUnlink(entry.poster);
  await writeItems(items);
  const git = await gitCommitPush(`admin: delete tile ${entry.date}`);
  return sendJSON(res, 200, { ok: true, removed: entry, git });
}

async function handleList(res) {
  return sendJSON(res, 200, { items: await readItems() });
}

/* ── Static file serving (path-traversal safe) ── */
function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/')      urlPath = '/index.html';   // admin UI is merged into index.html (⌘/Ctrl+E)
  if (urlPath === '/admin') urlPath = '/index.html';
  if (urlPath === '/index') urlPath = '/index.html';
  const filePath = normPath(join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden');
  if (!existsSync(filePath) || !statSync(filePath).isFile()) return send(res, 404, 'Not found');

  const total = statSync(filePath).size;
  const headers = {
    'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
    'Accept-Ranges': 'bytes', // advertise seekability so media can be scrubbed
  };
  const isHead = req.method === 'HEAD';

  // Honor a single byte range so <audio>/<video> can seek (else the browser
  // refetches from 0 and playback restarts from the beginning).
  const m = /^bytes=(\d*)-(\d*)$/.exec((req.headers.range || '').trim());
  if (m && (m[1] || m[2])) {
    let start, end;
    if (m[1] === '') { start = Math.max(0, total - parseInt(m[2], 10)); end = total - 1; } // suffix
    else { start = parseInt(m[1], 10); end = m[2] === '' ? total - 1 : parseInt(m[2], 10); }
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= total) {
      res.writeHead(416, { 'Content-Range': `bytes */${total}`, 'Accept-Ranges': 'bytes' });
      return res.end();
    }
    end = Math.min(end, total - 1);
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${total}`, 'Content-Length': end - start + 1 });
    if (isHead) return res.end();
    return createReadStream(filePath, { start, end }).pipe(res);
  }

  res.writeHead(200, { ...headers, 'Content-Length': total });
  if (isHead) return res.end();
  createReadStream(filePath).pipe(res);
}

function sendJSON(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(Buffer.from(JSON.stringify(obj)));
}
function send(res, code, msg) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(msg);
}

function collectBody(req, res, done) {
  const chunks = []; let size = 0;
  req.on('data', (c) => {
    size += c.length;
    if (size > MAX_BODY) { sendJSON(res, 413, { error: 'Upload too large' }); req.destroy(); return; }
    chunks.push(c);
  });
  req.on('end', () => done(Buffer.concat(chunks)));
}

const ROUTES = {
  'POST /api/tiles':        (req, res, body) => handleAdd(req, res, body),
  'POST /api/tiles/update': (req, res, body) => handleUpdate(res, body),
  'POST /api/tiles/media':  (req, res, body) => handleMedia(req, res, body),
  'POST /api/tiles/delete': (req, res, body) => handleDelete(res, body),
};

const server = createServer((req, res) => {
  // CORS — lets the Chrome extension (and other local tools) call the API.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }

  const key = `${req.method} ${req.url.split('?')[0]}`;
  if (req.method === 'GET' && req.url.split('?')[0] === '/api/tiles') return handleList(res);
  if (ROUTES[key]) {
    return collectBody(req, res, (body) =>
      ROUTES[key](req, res, body).catch((err) => {
        console.error(err); sendJSON(res, 500, { error: String(err.message || err) });
      }));
  }
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res);
  send(res, 405, 'Method not allowed');
});

/* ── Required external tools (audio extraction) — fail fast if absent ──
   yt-dlp downloads YouTube audio; ffmpeg remuxes it into a clean, broadly
   playable container. A command exists unless spawning it raises ENOENT. */
async function hasCommand(cmd) {
  try { await pexecFile(cmd, ['--version']); return true; }
  catch (e) { return e.code !== 'ENOENT'; }
}
async function requireCommands(cmds) {
  const checks = await Promise.all(cmds.map(async (c) => [c, await hasCommand(c)]));
  const missing = checks.filter(([, ok]) => !ok).map(([c]) => c);
  if (missing.length) {
    for (const c of missing) console.error(`Error: required command not found: ${c}`);
    console.error(`Install the missing command(s) and retry (e.g. brew install ${missing.join(' ')}).`);
    process.exit(1);
  }
}

await requireCommands(['yt-dlp', 'ffmpeg']);

async function backfillTags() {
  let items;
  try { items = await readItems(); } catch { return; }
  let n = 0;
  for (const e of items) {
    if (taggableMedia(e) && !(Array.isArray(e.tags) && e.tags.length)) { enqueueTag(e.date); n++; }
  }
  if (n) console.log(`  tagging: queued ${n} untagged image(s) for backfill`);
}

server.listen(PORT, HOST, () => {
  console.log('Mosaic Gallery admin server');
  console.log(`  gallery + admin:  http://${HOST}:${PORT}/   (press \u2318/Ctrl+E in the page for admin)`);
  backfillTags();
});

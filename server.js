#!/usr/bin/env node
/**
 * server.js — zero-dependency admin server for the Mosaic Gallery.
 *
 *   node server.js            # then open http://127.0.0.1:3000
 *
 * Serves the static gallery and an admin UI at /admin. The admin can:
 *   - add a tile from an uploaded image/video, an image URL to download, or a
 *     YouTube link; the submission timestamp (ISO 8601, fixed -05:00 offset) is
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
import { readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname, normalize as normPath, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { get as httpsGet } from 'node:https';
import { get as httpGet } from 'node:http';
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

const DEFAULT_HEADER =
`/* ──────────────────────────────────────────────────────────────────────────
   Gallery content — managed by server.js (the admin at /admin).
   Loaded directly by index.html via <script>; no build step.
   Entry fields: type, date, file|id, desc?, link?, poster?, hidden?
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
};
const EXT_BY_TYPE = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg',
  'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif',
  'image/svg+xml': '.svg', 'video/mp4': '.mp4', 'video/webm': '.webm',
  'video/quicktime': '.mov', 'video/ogg': '.ogv',
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

/* ── content/items.js as data ── */
async function readItems() {
  let text = '';
  try { text = await readFile(ITEMS_FILE, 'utf8'); } catch { return []; }
  const sandbox = { window: {} };
  try { vm.runInNewContext(text, sandbox, { timeout: 2000 }); }
  catch (e) { console.error('items.js parse error:', e.message); }
  return Array.isArray(sandbox.window.GALLERY_ITEMS) ? sandbox.window.GALLERY_ITEMS : [];
}

function serializeEntry(entry) {
  const q = (v) => JSON.stringify(v);
  const head = [`type: ${q(entry.type)}`, `date: ${q(entry.date)}`];
  head.push(entry.type === 'youtube' ? `id: ${q(entry.id)}` : `file: ${q(entry.file)}`);
  const tail = [];
  if (entry.desc)   tail.push(`desc: ${q(entry.desc)}`);
  if (entry.link)   tail.push(`link: ${q(entry.link)}`);
  if (entry.poster) tail.push(`poster: ${q(entry.poster)}`);
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
  if (!['image', 'video', 'youtube'].includes(type)) {
    return sendJSON(res, 400, { error: 'type must be image, video, or youtube' });
  }

  const date = nowMinus5ISO();
  const entry = { type, date };
  if (fields.desc?.trim()) entry.desc = fields.desc.trim();
  if (fields.link?.trim()) entry.link = fields.link.trim();
  if (fields.hidden === 'true') entry.hidden = true;

  if (type === 'youtube') {
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
  } else {
    const up = files.media;
    if (!up) return sendJSON(res, 400, { error: `No ${type} file (or image URL) provided` });
    const ext = pickExt(up.filename, up.contentType);
    if (!ext) return sendJSON(res, 400, { error: 'Could not determine file extension' });
    entry.file = await saveMediaFromBuffer(up.data, ext, date);
    if (type === 'video' && files.poster) {
      const pext = pickExt(files.poster.filename, files.poster.contentType);
      entry.poster = await saveMediaFromBuffer(files.poster.data, pext, `${date}-poster`);
    }
  }

  const items = await readItems();
  items.unshift(entry);
  await writeItems(items);
  const git = await gitCommitPush(`admin: add ${entry.type} tile ${entry.date}`);
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

  if ('desc' in req) { const v = (req.desc || '').trim(); if (v) entry.desc = v; else delete entry.desc; }
  if ('link' in req) { const v = (req.link || '').trim(); if (v) entry.link = v; else delete entry.link; }
  if ('hidden' in req) { if (req.hidden) entry.hidden = true; else delete entry.hidden; }

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
  if (urlPath === '/')      urlPath = '/admin.html';
  if (urlPath === '/admin') urlPath = '/admin.html';
  if (urlPath === '/index') urlPath = '/index.html';
  const filePath = normPath(join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden');
  if (!existsSync(filePath) || !statSync(filePath).isFile()) return send(res, 404, 'Not found');
  res.writeHead(200, {
    'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
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
  'POST /api/tiles/delete': (req, res, body) => handleDelete(res, body),
};

const server = createServer((req, res) => {
  // CORS — lets the Chrome extension (and other local tools) call the API.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
  if (req.method === 'GET') return serveStatic(req, res);
  send(res, 405, 'Method not allowed');
});

server.listen(PORT, HOST, () => {
  console.log('Mosaic Gallery admin server');
  console.log(`  admin:    http://${HOST}:${PORT}/`);
  console.log(`  gallery:  http://${HOST}:${PORT}/index`);
});

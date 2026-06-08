#!/usr/bin/env node
/**
 * build-manifest.mjs — turns the single content/items.json into
 * content/manifest.js (window.GALLERY_ITEMS = [...]), sorted newest-first.
 *
 * Zero dependencies (Node built-ins only). Run after editing items.json:
 *   node tools/build-manifest.mjs
 *
 * Time model:
 *   - Every entry carries an explicit ISO 8601 "date", e.g.
 *     "2024-03-14T18:35:00.000-05:00". Items are sorted newest-first.
 *   - image/video entries also have a "file" in content/media/ (conventionally
 *     named with the same timestamp, though the "date" field is authoritative).
 *
 * Why a generated .js (not the .json fetched at runtime): the page must work
 * over file:// where fetch() of separate files is blocked. A <script> works in
 * both file:// and GitHub Pages.
 */

import { readFile, writeFile, access } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT        = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(ROOT, 'content');
const MEDIA_DIR   = join(CONTENT_DIR, 'media');
const ITEMS_FILE  = join(CONTENT_DIR, 'items.json');
const OUT_FILE    = join(CONTENT_DIR, 'manifest.js');
const VALID_TYPES = new Set(['image', 'video', 'youtube']);

let warnings = 0;
function warn(msg) { console.warn(`  ⚠ ${msg}`); warnings++; }

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

/** Build the display timestamp "YYYY.MM.DD HH:MM" from an ISO 8601 string. */
function displayTimestamp(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d, h, mi] = m;
  return `${y}.${mo}.${d} ${h}:${mi}`;
}

/** Sortable epoch ms; NaN-safe. */
function sortKey(iso) {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/** Web path for a media file: content/media/<url-encoded filename>. */
function mediaSrc(file) {
  return `content/media/${encodeURIComponent(file)}`;
}

const VIDEO_AR = 0.5625; // 16:9 height/width, for youtube + posterless video

/** Read intrinsic pixel size from a JPEG/PNG/GIF/WebP buffer. Returns {w,h} or null. */
function imageSize(buf) {
  // PNG
  if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  // GIF
  if (buf.length >= 10 && buf.toString('ascii', 0, 3) === 'GIF') {
    return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) };
  }
  // WebP (RIFF....WEBP)
  if (buf.length >= 30 && buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP') {
    const fmt = buf.toString('ascii', 12, 16);
    if (fmt === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    if (fmt === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
    }
    if (fmt === 'VP8X') {
      return {
        w: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
        h: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
      };
    }
  }
  // JPEG: scan for a Start-Of-Frame marker
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) {
    let off = 2;
    while (off + 9 < buf.length) {
      if (buf[off] !== 0xff) { off++; continue; }
      const marker = buf[off + 1];
      if (marker >= 0xc0 && marker <= 0xcf &&
          marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: buf.readUInt16BE(off + 5), w: buf.readUInt16BE(off + 7) };
      }
      off += 2 + buf.readUInt16BE(off + 2);
    }
  }
  return null;
}

/** Aspect ratio (height/width) of a media file on disk, or null if unreadable. */
async function measureAR(absPath) {
  try {
    const size = imageSize(await readFile(absPath));
    if (size && size.w > 0 && size.h > 0) {
      return Math.round((size.h / size.w) * 10000) / 10000;
    }
  } catch { /* fall through */ }
  return null;
}

async function build() {
  let raw;
  try {
    raw = JSON.parse(await readFile(ITEMS_FILE, 'utf8'));
  } catch (err) {
    console.error(`✗ Cannot read content/items.json: ${err.message}`);
    process.exit(1);
  }
  if (!Array.isArray(raw)) {
    console.error('✗ content/items.json must be an array');
    process.exit(1);
  }

  const rows = [];

  for (let index = 0; index < raw.length; index++) {
    const entry = raw[index];
    const where = `items.json[${index}]`;

    if (!VALID_TYPES.has(entry.type)) {
      warn(`${where} — unknown type "${entry.type}", skipped`);
      continue;
    }

    if (!entry.date) { warn(`${where} — entry missing "date", skipped`); continue; }
    const iso = entry.date;
    const item = { type: entry.type };

    if (entry.type === 'youtube') {
      if (!entry.id) { warn(`${where} — youtube entry missing "id", skipped`); continue; }
      item.id = entry.id;
      item.ar = VIDEO_AR;
    } else {
      if (!entry.file) { warn(`${where} — ${entry.type} entry missing "file", skipped`); continue; }
      item.src = mediaSrc(entry.file);
      const filePath = join(MEDIA_DIR, entry.file);
      const fileThere = await exists(filePath);
      if (!fileThere) warn(`${where} — file not found: content/media/${entry.file}`);

      if (entry.type === 'image') {
        const ar = fileThere ? await measureAR(filePath) : null;
        if (ar == null && fileThere) warn(`${where} — could not read image size, defaulting ar=1`);
        item.ar = ar ?? 1;
      } else { // video
        let posterThere = false;
        if (entry.poster) {
          item.poster = mediaSrc(entry.poster);
          posterThere = await exists(join(MEDIA_DIR, entry.poster));
          if (!posterThere) warn(`${where} — poster not found: content/media/${entry.poster}`);
        }
        const ar = posterThere ? await measureAR(join(MEDIA_DIR, entry.poster)) : null;
        item.ar = ar ?? VIDEO_AR;
      }
    }

    if (Number.isNaN(Date.parse(iso))) {
      warn(`${where} — unparseable date/timestamp "${iso}", skipped`);
      continue;
    }

    item.ts = displayTimestamp(iso);
    if (entry.title) item.title = entry.title;
    if (entry.desc)  item.desc  = entry.desc;
    if (entry.link)  item.link  = entry.link;

    rows.push({ _key: sortKey(iso), item });
  }

  rows.sort((a, b) => b._key - a._key); // newest first
  const ordered = rows.map((r) => r.item);

  const banner =
    '// GENERATED by tools/build-manifest.mjs — do not edit by hand.\n' +
    `// ${ordered.length} item(s). Rebuild: node tools/build-manifest.mjs\n`;
  const body = 'window.GALLERY_ITEMS = ' + JSON.stringify(ordered, null, 2) + ';\n';

  await writeFile(OUT_FILE, banner + body, 'utf8');
  console.log(`✓ Wrote content/manifest.js — ${ordered.length} item(s)` +
    (warnings ? `, ${warnings} warning(s)` : ''));
}

build().catch((err) => { console.error(err); process.exit(1); });

# Mosaic Gallery — Real Content Directory Design

**Date:** 2026-06-08
**Status:** Approved (design), pending implementation plan

## Goal

Replace the randomly-generated sample data with real media stored in a
`content/` directory. Structure must be:

- Easy to add new items over time (drop a file, edit one small JSON).
- Easy to explore by time (organized by year, then month).
- Compatible with **both** `file://` (double-click `index.html`) and **GitHub Pages**.

## Key constraint

Under `file://`, browsers block `fetch()` of separate files (CORS for the
`file:` scheme). Therefore the page cannot fetch a `.json` data file at runtime.
Instead, a **generated JavaScript file** (`content/manifest.js`) is loaded via
`<script>`, which works identically on `file://` and GitHub Pages. Local media
files load fine via `<img>`/`<video>`/iframe in both environments.

## Architecture

Generated-manifest pattern:

1. Author drops media files into `content/YYYY/MM/` and edits that month's
   `items.json`.
2. A zero-dependency Node script (`tools/build-manifest.mjs`) merges every
   `items.json` into a single sorted `content/manifest.js`.
3. The page loads `content/manifest.js`, then `script.js` renders tiles from
   `window.GALLERY_ITEMS`.

`content/manifest.js` is **committed to git** (required for GitHub Pages, which
serves static files only and cannot run the generator).

### Directory structure

```
content/
  manifest.js              ← GENERATED, do not edit by hand (committed)
  2024/
    03/
      sunset.jpg
      ferry-crossing.mp4
      items.json           ← authored by hand
    01/
      items.json
  2023/
    11/
      items.json
tools/
  build-manifest.mjs       ← run after adding content
package.json               ← adds a "build" convenience script
```

## Data format: `items.json` (one array per month)

```json
[
  { "type": "image",   "file": "sunset.jpg", "day": 14, "time": "18:30",
    "title": "Golden hour", "desc": "Dust suspended mid-air.",
    "link": "https://unsplash.com" },

  { "type": "video",   "file": "ferry-crossing.mp4", "day": 9,
    "poster": "ferry-thumb.jpg", "desc": "The water became silk." },

  { "type": "youtube", "id": "aqz-KE-bpKQ", "day": 2,
    "title": "Big Buck Bunny", "desc": "..." }
]
```

### Fields

| Field    | Required               | Applies to        | Notes |
|----------|------------------------|-------------------|-------|
| `type`   | yes                    | all               | `image` \| `video` \| `youtube` |
| `file`   | yes (image/video)      | image, video      | filename relative to the month folder |
| `id`     | yes (youtube)          | youtube           | YouTube video ID |
| `day`    | no                     | all               | 1–31, for ordering + display |
| `time`   | no                     | all               | `HH:MM`, for ordering + display |
| `title`  | no                     | all               | used as `alt` / iframe / video title |
| `desc`   | no                     | all               | hover overlay description |
| `link`   | no                     | image, video      | external link; tile becomes clickable, shows link badge |
| `poster` | no                     | video             | local thumbnail; falls back to dark placeholder + play badge |

### Timestamp

- Display string: `YYYY.MM.DD HH:MM` (e.g. `2024.03.14 18:30`), derived from the
  folder year/month plus `day`/`time`. Missing `day`/`time` render a partial
  string (e.g. `2024.03`).
- Sort key (newest first): year → month → day → time → original array order.

## Generator: `tools/build-manifest.mjs`

- Node built-ins only — no `npm install` required.
- Walks `content/*/*/items.json` (two-level: year/month).
- For each entry:
  - Resolves `file` to a web path like `content/2024/03/sunset.jpg`.
  - Computes sortable timestamp + display timestamp from folder + `day`/`time`.
  - Resolves `poster` to a path the same way.
- Sorts all entries newest-first.
- Writes `content/manifest.js` as:
  `window.GALLERY_ITEMS = [ /* ...entries... */ ];`
- **Validation:** warns (does not crash) on a missing media/poster file or an
  unknown `type`; skips invalid entries.
- Run with `node tools/build-manifest.mjs`. `package.json` adds
  `"scripts": { "build": "node tools/build-manifest.mjs" }`.

## Page changes

### `index.html`
- Add `<script src="content/manifest.js"></script>` **before** `<script src="script.js"></script>`.

### `script.js`
- Remove all sample data + random generators: `DESCRIPTIONS`, `SAMPLE_LINKS`,
  `YOUTUBE_IDS`, `IMG_SIZES`, `pick`, random `makeTS`, year-countdown loader.
- Read items from `window.GALLERY_ITEMS` (sorted newest-first).
- Render three tile types:
  - **image** — `<img>` with `width:100%; height:auto` (no dimension reading;
    minor reflow accepted). Optional link badge + click-to-open behavior.
  - **video (local)** — cover + play-badge mirroring the youtube pattern; on
    click swap in `<video controls autoplay>` pointing at the local file. Uses
    `poster` if present, else a dark placeholder. Optional link badge.
  - **youtube** — unchanged iframe lazy-load behavior.
- Infinite scroll: group items by year; each scroll trigger appends the next
  present year's items, preceded by a year divider. Show "— end of archive —"
  when exhausted and disconnect the observer.
- Keep `sessionStorage` scroll persistence and the `IntersectionObserver`
  sentinel mechanism.

### `styles.css`
- Add a `.year-divider` style for the year separators.
- Local-video tile reuses existing `.video-wrap` / `.play-badge` /
  `.video-cover` styles.

## Seed data

Seed `content/2024/03/items.json` with a couple of `youtube` entries (no local
files needed) so the gallery renders immediately after generation, before the
author adds any local media.

## Resolved decisions

1. **Image dimensions:** use `height:auto`, no dependency, accept minor reflow.
2. **manifest.js committed** to git (required for GitHub Pages).

## Non-goals

- No build tooling beyond the single Node script (no bundler).
- No runtime fetching of JSON.
- No timeline sidebar / filter UI (chronological infinite scroll only).
- No automatic image-dimension reading.

# Mosaic Gallery

A dark, editorial-style masonry gallery of images, local videos, and YouTube
embeds. The site is fully static (works on `file://` and GitHub Pages) and has
no build step. An optional zero-dependency admin server lets you add and manage
tiles through a web form.

## Layout

```
index.html          Gallery page + built-in admin (press ⌘/Ctrl+E)
server.js           Optional admin server (Node, no dependencies)
support.js          Design-component runtime
update-local.sh     Pull + restart the admin service on the host
content/
  items.js          Single source of truth — the list of tiles
  media/            Image, video, and audio files
```

## Viewing the gallery

Open `index.html` directly, or serve the folder and visit it (e.g. on GitHub
Pages). Tiles are shown newest-first, packed into the shortest column. Clicking
an image opens it enlarged in a lightbox.

## Content

All tiles are defined in `content/items.js` as `window.GALLERY_ITEMS`. Each
entry:

| Field    | Required          | Notes |
|----------|-------------------|-------|
| `type`   | yes               | `image` \| `video` \| `audio` \| `youtube` \| `quote` |
| `date`   | yes               | ISO 8601, e.g. `2025-04-02T09:15:00.000-05:00`; drives order + timestamp, and is the tile's id |
| `file`   | image / video / audio | filename in `content/media/` |
| `id`     | youtube           | YouTube video ID |
| `quote` / `author` | quote   | quote text and optional attribution |
| `title`  | no (audio)        | shown in the player & queue |
| `desc`   | no                | hover / lightbox caption |
| `link`   | no                | external URL; tile becomes clickable |
| `poster` | no (video / audio) | local thumbnail / cover filename |
| `tags`   | no                | search keywords (auto-filled by the tagger) |
| `hidden` | no                | if `true`, the tile is skipped by the gallery |

You can edit `content/items.js` by hand, or use the admin server below.

## Admin

The admin UI is built into the gallery itself — there is no separate page.
Press **⌘/Ctrl + E** anywhere in the gallery to toggle admin mode: a floating
**+** button (create a tile) and a **gear** (server settings) appear, and each
tile gains an edit pencil.

```sh
node server.js          # then open http://127.0.0.1:3000/
```

The server serves the gallery at `/` and exposes the admin API. By default the
admin talks to its own origin; to drive a remote server instead, open the gear
→ **Settings** and set the server endpoint (it pings `GET /api/tiles` and shows
a live connected / unreachable status).

- **Add** a tile from an image upload, an image URL (downloaded and saved
  locally), a video file (+ optional poster — if none is given, the video's
  first frame is captured in the browser and used), an audio file or YouTube
  link (audio extracted via `yt-dlp`), or a quote. The date is auto-generated
  and uploaded files are saved as `<date><ext>`.
- **Manage** existing tiles: edit date / description / link / tags, hide or
  show, replace the image, or delete (which also removes the media files).

Every successful change is automatically committed and pushed to GitHub. The
server binds to `127.0.0.1` only and has no authentication — it is meant for
local use (set `HOST=0.0.0.0` to expose it on a trusted network). Audio
extraction requires `yt-dlp` and `ffmpeg` on the host.

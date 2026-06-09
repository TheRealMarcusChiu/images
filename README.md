# Mosaic Gallery

A dark, editorial-style masonry gallery of images, local videos, and YouTube
embeds. The site is fully static (works on `file://` and GitHub Pages) and has
no build step. An optional zero-dependency admin server lets you add and manage
tiles through a web form.

## Layout

```
index.html          Gallery page
styles.css          Gallery styles
script.js           Masonry layout, infinite scroll, lightbox
server.js           Optional admin server (Node, no dependencies)
admin.html          Admin UI (Add / Manage tiles)
content/
  items.js          Single source of truth — the list of tiles
  media/            Image and video files
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
| `type`   | yes               | `image` \| `video` \| `youtube` |
| `date`   | yes               | ISO 8601, e.g. `2025-04-02T09:15:00.000-05:00`; drives order + timestamp |
| `file`   | image / video     | filename in `content/media/` |
| `id`     | youtube           | YouTube video ID |
| `desc`   | no                | hover / lightbox caption |
| `link`   | no                | external URL; tile becomes clickable |
| `poster` | no (video)        | local thumbnail filename |
| `hidden` | no                | if `true`, the tile is skipped by the gallery |

You can edit `content/items.js` by hand, or use the admin server below.

## Admin server

```sh
node server.js          # then open http://127.0.0.1:3000/admin
```

- **Add** a tile from an image upload, an image URL (downloaded and saved
  locally), a video file (+ optional poster), or a YouTube link. The date is
  auto-generated and uploaded files are saved as `<date><ext>`.
- **Manage** existing tiles: edit date / description / link, hide or show, or
  delete (which also removes the media files).

Every successful change is automatically committed and pushed to GitHub. The
server binds to `127.0.0.1` only and has no authentication — it is meant for
local use.

# Content

All gallery data lives in two places:

- **`content/items.json`** — a single array describing every item.
- **`content/media/`** — the actual image/video files.

## Time model

The timestamp for an image/video comes from its **filename**, which is an
ISO 8601 instant, e.g.:

```
content/media/2024-03-14T18:35:00.000-05:00.jpg
content/media/2024-03-14T18:35:00.000-05:00.mp4
```

YouTube items have no file, so they carry an explicit `date` field in the same
ISO 8601 format. Items are shown newest-first.

## Add new content

1. Drop the media file into `content/media/`, named as the ISO timestamp of
   when it was taken, e.g. `2025-04-02T09:15:00.000-05:00.jpg`.
2. Add an entry to `content/items.json`:

   ```json
   { "type": "image", "file": "2025-04-02T09:15:00.000-05:00.jpg",
     "title": "Golden hour", "desc": "Dust suspended mid-air.",
     "link": "https://example.com" }
   ```

   YouTube entry (no file, explicit date):

   ```json
   { "type": "youtube", "id": "aqz-KE-bpKQ", "date": "2025-04-02T09:15:00-05:00",
     "title": "Big Buck Bunny", "desc": "..." }
   ```

3. Regenerate the manifest:

   ```sh
   npm run build      # or: node tools/build-manifest.mjs
   ```

4. Commit the media file, `items.json`, **and** the regenerated
   `content/manifest.js` (it must be committed for GitHub Pages to work).

## Fields

| Field    | Required          | Applies to     | Notes |
|----------|-------------------|----------------|-------|
| `type`   | yes               | all            | `image` \| `video` \| `youtube` |
| `file`   | yes (image/video) | image, video   | filename in `content/media/`; encodes the timestamp |
| `id`     | yes (youtube)     | youtube        | YouTube video ID |
| `date`   | yes (youtube)     | youtube        | ISO 8601, e.g. `2025-04-02T09:15:00-05:00` |
| `title`  | no                | all            | used as alt / video / iframe title |
| `desc`   | no                | all            | hover overlay text |
| `link`   | no                | image, video   | external link; tile becomes clickable |
| `poster` | no                | video          | a filename in `content/media/`; falls back to a dark placeholder |

`manifest.js` is generated — never edit it by hand.

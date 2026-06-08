# Content

All gallery data lives in two places:

- **`content/items.json`** — a single array describing every item.
- **`content/media/`** — the actual image/video files.

## Time model

Every entry carries an explicit ISO 8601 `date`, e.g.
`2024-03-14T18:35:00.000-05:00`. That field drives ordering (newest-first) and
the timestamp shown on each tile. For images/videos the media file in
`content/media/` is conventionally named with the same timestamp, but the
`date` field is what counts.

## Add new content

1. Drop the media file into `content/media/`, named as the ISO timestamp of
   when it was taken, e.g. `2025-04-02T09:15:00.000-05:00.jpg`.
2. Add an entry to `content/items.json`:

   ```json
   { "type": "image", "date": "2025-04-02T09:15:00.000-05:00",
     "file": "2025-04-02T09:15:00.000-05:00.jpg",
     "desc": "Dust suspended mid-air.", "link": "https://example.com" }
   ```

   YouTube entry (no file):

   ```json
   { "type": "youtube", "date": "2025-04-02T09:15:00.000-05:00",
     "id": "aqz-KE-bpKQ", "desc": "..." }
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
| `date`   | yes               | all            | ISO 8601, e.g. `2025-04-02T09:15:00.000-05:00`; drives order + timestamp |
| `file`   | yes (image/video) | image, video   | filename in `content/media/` |
| `id`     | yes (youtube)     | youtube        | YouTube video ID |
| `desc`   | no                | all            | hover overlay text |
| `link`   | no                | image, video   | external link; tile becomes clickable |
| `poster` | no                | video          | a filename in `content/media/`; falls back to a dark placeholder |

`manifest.js` is generated — never edit it by hand.

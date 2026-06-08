# Content

Real gallery data lives here, organized by time: `content/<year>/<month>/`.

## Add new content

1. Create the month folder if needed, e.g. `content/2025/04/`.
2. Drop your media files there (images / videos). YouTube items need no file.
3. Edit (or create) that folder's `items.json` — an array of entries:

   ```json
   [
     { "type": "image",   "file": "sunset.jpg", "day": 14, "time": "18:30",
       "title": "Golden hour", "desc": "Dust suspended mid-air.",
       "link": "https://example.com" },

     { "type": "video",   "file": "ferry.mp4", "day": 9,
       "poster": "ferry-thumb.jpg", "desc": "The water became silk." },

     { "type": "youtube", "id": "aqz-KE-bpKQ", "day": 2,
       "title": "Big Buck Bunny", "desc": "..." }
   ]
   ```

4. Regenerate the manifest:

   ```sh
   npm run build      # or: node tools/build-manifest.mjs
   ```

5. Commit your media, `items.json`, **and** the regenerated `content/manifest.js`
   (it must be committed for GitHub Pages to work).

## Fields

| Field    | Required          | Applies to     | Notes |
|----------|-------------------|----------------|-------|
| `type`   | yes               | all            | `image` \| `video` \| `youtube` |
| `file`   | yes (image/video) | image, video   | filename, relative to the month folder |
| `id`     | yes (youtube)     | youtube        | YouTube video ID |
| `day`    | no                | all            | 1–31, for ordering + display |
| `time`   | no                | all            | `HH:MM`, for ordering + display |
| `title`  | no                | all            | used as alt / video / iframe title |
| `desc`   | no                | all            | hover overlay text |
| `link`   | no                | image, video   | external link; tile becomes clickable |
| `poster` | no                | video          | local thumbnail; falls back to a dark placeholder |

Items are shown newest-first, ordered by year → month → day → time.

`manifest.js` is generated — never edit it by hand.

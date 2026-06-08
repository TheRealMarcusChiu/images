# Content

All gallery data lives in **`content/items.js`** — a single JavaScript file
that the page loads directly. The media files live in **`content/media/`**.

There is **no build step**. `index.html` loads `content/items.js`, and
`script.js` does everything at runtime: it sorts by `date` (newest first),
formats the displayed timestamp, builds each media URL from `file`, and
measures image aspect ratios for the masonry layout. This works on both
`file://` (double-click `index.html`) and GitHub Pages.

## Add new content

1. Drop the media file into `content/media/`, named as the ISO timestamp of
   when it was taken, e.g. `2025-04-02T09:15:00.000-05:00.jpg`.
2. Append an object to the `window.GALLERY_ITEMS` array in `content/items.js`:

   ```js
   { type: "image", date: "2025-04-02T09:15:00.000-05:00",
     file: "2025-04-02T09:15:00.000-05:00.jpg",
     desc: "Dust suspended mid-air.", link: "https://example.com" },
   ```

   YouTube entry (no file):

   ```js
   { type: "youtube", date: "2025-04-02T09:15:00.000-05:00",
     id: "aqz-KE-bpKQ", desc: "..." },
   ```

3. Reload the page. (Commit the media file and `content/items.js` — that's it.)

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

The displayed order and timestamps come entirely from `date`. Ordering is
newest-first.

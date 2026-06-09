/* ──────────────────────────────────────────────────────────────────────────
   Gallery content — the single source of truth.

   Loaded directly by index.html via <script>, so it works on both file:// and
   GitHub Pages with NO build step. script.js derives everything else at
   runtime: it sorts by `date` (newest first), formats the displayed timestamp,
   builds the media URL from `file`, and measures each image's aspect ratio.

   To add an item, append an object below. Fields:
     type   "image" | "video" | "youtube"           (required)
     date   ISO 8601, e.g. "2025-04-02T09:15:00.000-05:00"   (required)
     file   filename in content/media/   (required for image/video)
     id     YouTube video id             (required for youtube)
     desc   hover caption                (optional)
     link   external URL; tile becomes clickable   (optional; image/video)
     poster filename in content/media/ for a local video thumbnail (optional)
   ────────────────────────────────────────────────────────────────────────── */
window.GALLERY_ITEMS = [
  { type: "image", date: "2026-06-08T23:25:28.249-05:00", file: "2026-06-08T23:25:28.249-05:00.jpg" },

  { type: "image", date: "2026-06-08T23:25:21.316-05:00", file: "2026-06-08T23:25:21.316-05:00.webp",
    hidden: true },

  { type: "image", date: "2026-06-08T23:21:10.009-05:00", file: "2026-06-08T23:21:10.009-05:00.webp",
    hidden: true },

  { type: "image", date: "2026-06-08T23:13:59.023-05:00", file: "2026-06-08T23:13:59.023-05:00.jpg" },

  { type: "image", date: "2026-06-08T23:11:03.873-05:00", file: "2026-06-08T23:11:03.873-05:00.webp" },

  { type: "youtube", date: "2026-06-08T23:01:12.757-05:00", id: "PP9BjKnDaFk" },

  { type: "video", date: "2026-06-08T22:59:41.513-05:00", file: "2026-06-08T22:59:41.513-05:00.mov",
    desc: "jellyfish", poster: "2026-06-08T22:59:41.513-05:00-poster.jpg", hidden: true },

  { type: "image", date: "2026-06-08T19:58:33.441-05:00", file: "2026-06-08T19:58:33.441-05:00.jpg" },

  { type: "image", date: "2026-06-08T19:58:17.091-05:00", file: "2026-06-08T19:58:17.091-05:00.jpeg" },

  { type: "image", date: "2026-06-08T19:57:48.626-05:00", file: "2026-06-08T19:57:48.626-05:00.jpeg",
    desc: "mich star boba" },

  { type: "image", date: "2026-06-08T19:57:20.077-05:00", file: "2026-06-08T19:57:20.077-05:00.jpeg",
    desc: "a butt" },

  { type: "image", date: "2026-06-08T12:03:00.000-05:00", file: "2026-06-08T12:03:00.000-05:00.webp" },

  { type: "image", date: "2026-06-08T12:02:00.000-05:00", file: "2026-06-08T12:02:00.000-05:00.webp",
    desc: "Geodude Hanger" },

  { type: "image", date: "2026-06-08T12:01:00.000-05:00", file: "2026-06-08T12:01:00.000-05:00.webp" },

  { type: "image", date: "2026-06-08T12:00:00.000-05:00", file: "2026-06-08T12:00:00.000-05:00.webp" },
];

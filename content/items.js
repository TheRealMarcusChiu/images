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
  { type: "image", date: "2026-06-08T12:03:00.000-05:00", file: "2026-06-08T12:03:00.000-05:00.webp" },

  { type: "image", date: "2026-06-08T12:02:00.000-05:00", file: "2026-06-08T12:02:00.000-05:00.webp",
    desc: "Geodude Hanger" },

  { type: "image", date: "2026-06-08T12:01:00.000-05:00", file: "2026-06-08T12:01:00.000-05:00.webp" },

  { type: "image", date: "2026-06-08T12:00:00.000-05:00", file: "2026-06-08T12:00:00.000-05:00.webp" },
];

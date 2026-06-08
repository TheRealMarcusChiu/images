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
  { type: "image", date: "2025-05-28T10:20:00.000-05:00", file: "2025-05-28T10:20:00.000-05:00.jpg",
    desc: "Market day, the usual chaos, an unusual calm at its center.",
    link: "https://en.wikipedia.org/wiki/Marketplace" },

  { type: "image", date: "2025-05-19T07:45:00.000-05:00", file: "2025-05-19T07:45:00.000-05:00.jpg",
    desc: "Scaffolding came down that morning. The building blinked in the sun." },

  { type: "image", date: "2025-05-04T12:00:00.000-05:00", file: "2025-05-04T12:00:00.000-05:00.jpg",
    desc: "The cat had claimed the entire kitchen as sovereign territory.",
    link: "https://en.wikipedia.org/wiki/Cat_behavior" },

  { type: "image", date: "2024-03-14T18:35:00.000-05:00", file: "2024-03-14T18:35:00.000-05:00.jpg",
    desc: "Golden hour catches the dust suspended mid-air in the empty warehouse.",
    link: "https://en.wikipedia.org/wiki/Golden_hour_(photography)" },

  { type: "image", date: "2024-03-05T12:00:00.000-05:00", file: "2024-03-05T12:00:00.000-05:00.jpg",
    desc: "She had been sitting there for hours before I noticed." },

  { type: "image", date: "2024-01-18T06:50:00.000-05:00", file: "2024-01-18T06:50:00.000-05:00.jpg",
    desc: "First frost of the season traced along the windowpane.",
    link: "https://en.wikipedia.org/wiki/Frost" },

  { type: "image", date: "2024-01-11T17:25:00.000-05:00", file: "2024-01-11T17:25:00.000-05:00.jpg",
    desc: "Long exposure of the ferry crossing — the water became silk.",
    link: "https://en.wikipedia.org/wiki/Long-exposure_photography" },

  { type: "image", date: "2023-11-12T15:30:00.000-05:00", file: "2023-11-12T15:30:00.000-05:00.jpg",
    desc: "Nobody told the sunflowers summer was nearly over.",
    link: "https://en.wikipedia.org/wiki/Helianthus" },

  { type: "image", date: "2023-11-07T16:05:00.000-05:00", file: "2023-11-07T16:05:00.000-05:00.jpg",
    desc: "Storm light over the reservoir just before the rain arrived." },

  { type: "image", date: "2023-07-21T21:10:00.000-05:00", file: "2023-07-21T21:10:00.000-05:00.jpg",
    desc: "Rain-slicked cobblestones, a single red umbrella.",
    link: "https://en.wikipedia.org/wiki/Street_photography" },

  { type: "image", date: "2023-07-08T12:00:00.000-05:00", file: "2023-07-08T12:00:00.000-05:00.jpg",
    desc: "Three dogs, zero humans, one very suspicious tennis ball." },

  { type: "youtube", date: "2024-03-14T18:30:00.000-05:00", id: "aqz-KE-bpKQ",
    desc: "Golden hour catches the dust suspended mid-air in the empty warehouse." },

  { type: "youtube", date: "2024-03-09T08:15:00.000-05:00", id: "YE7VzlLtp-4",
    desc: "The light changed and everyone looked up at once." },

  { type: "youtube", date: "2024-03-02T12:00:00.000-05:00", id: "TKNjNatvOuA",
    desc: "Storm light over the reservoir just before the rain arrived.",
    link: "https://www.magnumphotos.com" },

  { type: "youtube", date: "2024-01-22T16:40:00.000-05:00", id: "eRsGyueVLvQ",
    desc: "First frost of the season traced along the windowpane." },

  { type: "youtube", date: "2024-01-06T12:00:00.000-05:00", id: "WhWc3b3KhnY",
    desc: "Rain-slicked cobblestones, a single red umbrella." },

  { type: "youtube", date: "2023-11-18T11:05:00.000-05:00", id: "RR36BkHqAbo",
    desc: "Nobody told the sunflowers summer was nearly over." },

  { type: "youtube", date: "2023-11-03T12:00:00.000-05:00", id: "otiHE9D3dAI",
    desc: "Three dogs, zero humans, one very suspicious tennis ball.",
    link: "https://www.lensculture.com" }
];

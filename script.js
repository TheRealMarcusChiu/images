/* ──────────────────────────────────────────────────────────────────────────
   Mosaic Gallery — renders content authored in content/items.js
   (window.GALLERY_ITEMS). No build step: this file derives everything at
   runtime — sorts by date (newest first), formats the timestamp, builds the
   media URL, and measures each image's aspect ratio — then lays the tiles out
   as a shortest-column masonry. More are revealed as the sentinel scrolls in.
   ────────────────────────────────────────────────────────────────────────── */

const VIDEO_AR = 0.5625; // 16:9 height/width, for youtube + posterless video

/** "YYYY.MM.DD HH:MM" from an ISO 8601 string. */
function displayTS(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || '');
  return m ? `${m[1]}.${m[2]}.${m[3]} ${m[4]}:${m[5]}` : (iso || '');
}

/** Web path for a media file: content/media/<url-encoded filename>. */
function mediaSrc(file) {
  return `content/media/${encodeURIComponent(file)}`;
}

/** Normalize authored entries into render-ready items, newest first. */
function normalize(raw) {
  return raw
    .filter((e) => e && e.type && e.date && !e.hidden && !Number.isNaN(Date.parse(e.date)))
    .map((e) => {
      const it = { type: e.type, date: e.date, ts: displayTS(e.date) };
      if (e.desc) it.desc = e.desc;
      if (e.link) it.link = e.link;
      if (e.type === 'youtube') {
        it.id = e.id;
        it.ar = VIDEO_AR;
      } else {
        it.src = mediaSrc(e.file);
        if (e.type === 'video') {
          if (e.poster) it.poster = mediaSrc(e.poster); // ar measured from poster
          else it.ar = VIDEO_AR;
        }
        // image (and video-with-poster) ar is measured lazily before placement
      }
      return it;
    })
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

const ITEMS = normalize(Array.isArray(window.GALLERY_ITEMS) ? window.GALLERY_ITEMS : []);

const mosaic   = document.getElementById('mosaic');
const sentinel = document.getElementById('sentinel');
const galWrap  = document.getElementById('gallery-wrap');

let loading = false;
let cursor  = 0;     // index into ITEMS of the next item to place

/** Measure aspect ratio (height/width) by decoding the image; resilient. */
function measureAR(url) {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    img.onload  = () => done(img.naturalWidth && img.naturalHeight
                            ? img.naturalHeight / img.naturalWidth : 1);
    img.onerror = () => done(1);
    img.src = url;
    setTimeout(() => done(1), 5000); // fallback if a load stalls
  });
}

/** Ensure item.ar is set (no-op for youtube / posterless video). */
async function ensureAR(it) {
  if (it.ar != null) return;
  it.ar = await measureAR(it.type === 'video' ? it.poster : it.src);
}

// External-link SVG icon (arrow-up-right style)
const LINK_ICON_SVG = `
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>`;

const PLAY_ICON_SVG = `<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>`;

/* ── Scroll position persistence via sessionStorage ── */
galWrap.addEventListener('scroll', () => {
  sessionStorage.setItem('gallery-scroll', galWrap.scrollTop);
}, { passive: true });

/* ── Small helpers ── */
function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
                  .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeHTML(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function overlayHTML(item, withMediaBadge) {
  const badge = withMediaBadge ? `<div class="media-type">${withMediaBadge}</div>` : '';
  const desc  = item.desc ? `<div class="desc">${escapeHTML(item.desc)}</div>` : '';
  return `<div class="overlay"><div class="ts">${escapeHTML(item.ts)}</div>${badge}${desc}</div>`;
}
function applyLink(tile, item) {
  if (!item.link) return;
  tile.classList.add('has-link');
  tile.insertAdjacentHTML('afterbegin', `<div class="link-badge">${LINK_ICON_SVG}</div>`);
  tile.addEventListener('click', () => window.open(item.link, '_blank'));
}

/* ──────────────────────────────────────────────────────────────────────────
   Lightbox — clicking an image enlarges it over a darkened backdrop.
   Dismiss by clicking the backdrop, the ✕ button, or pressing Escape.
   ────────────────────────────────────────────────────────────────────────── */
const lightbox = (() => {
  const el = document.createElement('div');
  el.className = 'lightbox';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <button class="lightbox-close" aria-label="Close">&times;</button>
    <figure class="lightbox-figure">
      <img class="lightbox-img" alt="">
      <figcaption class="lightbox-cap">
        <span class="lb-ts"></span>
        <span class="lb-desc"></span>
        <a class="lb-link" target="_blank" rel="noopener">Source &nearr;</a>
      </figcaption>
    </figure>`;
  document.body.appendChild(el);

  const imgEl  = el.querySelector('.lightbox-img');
  const tsEl   = el.querySelector('.lb-ts');
  const descEl = el.querySelector('.lb-desc');
  const linkEl = el.querySelector('.lb-link');

  function open(item) {
    imgEl.src = item.src;
    imgEl.alt = item.desc || 'photo';
    tsEl.textContent   = item.ts || '';
    descEl.textContent = item.desc || '';
    if (item.link) { linkEl.href = item.link; linkEl.style.display = ''; }
    else           { linkEl.removeAttribute('href'); linkEl.style.display = 'none'; }
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
  }
  function close() {
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    imgEl.removeAttribute('src'); // stop holding the decoded bitmap
  }

  el.addEventListener('click', (e) => { if (e.target === el) close(); });
  el.querySelector('.lightbox-close').addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && el.classList.contains('open')) close();
  });

  return { open, close };
})();

function openLightbox(item) { lightbox.open(item); }

/* ── Image tile (click to open in the lightbox) ── */
function makeImageTile(item, i) {
  const alt = item.title || item.desc || 'photo';
  const ar  = item.ar || 1;                 // height / width
  const tile = document.createElement('div');
  tile.className = 'tile image-tile';
  tile.style.animationDelay = `${(i % 5) * 55}ms`;

  // A linked image keeps its external link reachable through a clickable
  // corner badge; the image body itself opens the lightbox.
  const badge = item.link
    ? `<a class="link-badge link-badge-active" href="${escapeAttr(item.link)}"
          target="_blank" rel="noopener" aria-label="Open source">${LINK_ICON_SVG}</a>`
    : '';
  if (item.link) tile.classList.add('has-link');

  tile.innerHTML = `
    <img src="${escapeAttr(item.src)}" alt="${escapeAttr(alt)}" loading="lazy"
         style="aspect-ratio:${1 / ar}">
    ${badge}
    ${overlayHTML(item, null)}`;

  const badgeEl = tile.querySelector('.link-badge-active');
  if (badgeEl) badgeEl.addEventListener('click', (e) => e.stopPropagation());

  tile.addEventListener('click', () => openLightbox(item));
  return tile;
}

/* ── Local video tile (cover + play badge, swaps to <video> on click) ── */
function makeVideoTile(item, i) {
  const title = item.title || 'video';
  const cover = item.poster
    ? `<img src="${escapeAttr(item.poster)}" alt="${escapeAttr(title)}">`
    : `<div class="video-placeholder"></div>`;

  const tile = document.createElement('div');
  tile.className = 'tile video-tile';
  tile.style.animationDelay = `${(i % 5) * 55}ms`;
  tile.innerHTML = `
    <div class="video-wrap">
      <div class="video-cover">${cover}</div>
      <div class="play-badge">${PLAY_ICON_SVG}</div>
    </div>
    ${overlayHTML(item, 'video')}`;

  const wrap  = tile.querySelector('.video-wrap');
  const cv    = tile.querySelector('.video-cover');
  const badge = tile.querySelector('.play-badge');
  cv.addEventListener('click', (e) => {
    e.stopPropagation();              // don't trigger tile link
    const v = document.createElement('video');
    v.src = item.src;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    wrap.appendChild(v);
    cv.style.opacity = '0';
    cv.style.pointerEvents = 'none';
    badge.style.display = 'none';
  });

  applyLink(tile, item);
  return tile;
}

/* ── YouTube tile (lazy iframe) ── */
function makeYouTubeTile(item, i) {
  const title    = item.title || 'video';
  const thumbUrl = `https://img.youtube.com/vi/${item.id}/mqdefault.jpg`;

  const tile = document.createElement('div');
  tile.className = 'tile video-tile';
  tile.style.animationDelay = `${(i % 5) * 55}ms`;
  tile.innerHTML = `
    <div class="video-wrap">
      <iframe
        data-src="https://www.youtube.com/embed/${escapeAttr(item.id)}?autoplay=1&rel=0"
        title="${escapeAttr(title)}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
      <div class="video-cover">
        <img src="${thumbUrl}" alt="${escapeAttr(title)}">
      </div>
      <div class="play-badge">${PLAY_ICON_SVG}</div>
    </div>
    ${overlayHTML(item, 'video')}`;

  const cover  = tile.querySelector('.video-cover');
  const badge  = tile.querySelector('.play-badge');
  const iframe = tile.querySelector('iframe');
  cover.addEventListener('click', (e) => {
    e.stopPropagation();
    iframe.src = iframe.dataset.src;
    cover.style.opacity = '0';
    cover.style.pointerEvents = 'none';
    badge.style.display = 'none';
  });

  applyLink(tile, item);
  return tile;
}

function makeTile(item, i) {
  if (item.type === 'image')   return makeImageTile(item, i);
  if (item.type === 'video')   return makeVideoTile(item, i);
  if (item.type === 'youtube') return makeYouTubeTile(item, i);
  return null;
}

/* ──────────────────────────────────────────────────────────────────────────
   Masonry engine

   Tiles are placed in date order (newest first). Each next tile goes into the
   column that is currently shortest — i.e. whose stacked content reaches
   closest to the top — with ties broken toward the left. Because every item
   carries its aspect ratio (item.ar = height/width), we can track column
   heights exactly without waiting for images to load, so there is no reflow.
   ────────────────────────────────────────────────────────────────────────── */
const GAP = parseInt(getComputedStyle(document.documentElement)
              .getPropertyValue('--gap'), 10) || 6;

let cols      = [];   // column <div> elements
let colHeights = [];  // running pixel height of each column
let colCount  = 0;
let colWidth  = 0;

function targetColumnCount() {
  const w = window.innerWidth;
  if (w <= 720)  return 2;
  if (w <= 1100) return 3;
  return 4;
}

function setupColumns() {
  colCount = targetColumnCount();
  mosaic.innerHTML = '';
  cols = [];
  colHeights = [];
  for (let i = 0; i < colCount; i++) {
    const c = document.createElement('div');
    c.className = 'mcol';
    mosaic.appendChild(c);
    cols.push(c);
    colHeights.push(0);
  }
  colWidth = cols[0].clientWidth || (mosaic.clientWidth / colCount);
}

/** Index of the shortest column (leftmost on a tie). */
function shortestColumn() {
  let min = 0;
  for (let i = 1; i < colCount; i++) {
    if (colHeights[i] < colHeights[min]) min = i;
  }
  return min;
}

function placeItem(item, i) {
  const tile = makeTile(item, i);
  if (!tile) return;
  const c = shortestColumn();
  cols[c].appendChild(tile);
  colHeights[c] += colWidth * (item.ar || 1) + GAP;
}

/** Rebuild all currently-revealed tiles from scratch (e.g. on column change). */
function relayout() {
  const revealed = cursor;
  setupColumns();
  for (let i = 0; i < revealed; i++) placeItem(ITEMS[i], i);
}

/* ── Reveal the next batch of items ── */
const BATCH_SIZE = 12;
async function loadMore() {
  if (loading) return;
  if (cursor >= ITEMS.length) { finish(); return; }

  loading = true;
  sentinel.textContent = 'Loading…';

  // Measure aspect ratios up front so placement is exact and reflow-free.
  const end = Math.min(cursor + BATCH_SIZE, ITEMS.length);
  await Promise.all(ITEMS.slice(cursor, end).map(ensureAR));

  while (cursor < end) {
    placeItem(ITEMS[cursor], cursor);
    cursor++;
  }
  loading = false;

  if (cursor >= ITEMS.length) finish();
  else sentinel.textContent = 'Loading…';

  restoreScroll();
}

/* Re-flow only when the column count actually changes. */
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (targetColumnCount() !== colCount) relayout();
  }, 150);
});

function finish() {
  sentinel.textContent = ITEMS.length ? '— end of archive —' : '— no content yet —';
  sentinel.style.opacity = '0.3';
  observer.disconnect();
}

/* ── Restore scroll position on page load (back navigation) ── */
let scrollRestored = false;
function restoreScroll() {
  if (scrollRestored) return;
  const saved = sessionStorage.getItem('gallery-scroll');
  if (!saved) return;
  const target = parseInt(saved, 10);
  if (galWrap.scrollHeight >= target + galWrap.clientHeight) {
    galWrap.scrollTop = target;
    scrollRestored = true;
  }
}

const observer = new IntersectionObserver(
  e => { if (e[0].isIntersecting) loadMore(); },
  { root: galWrap, threshold: 0.1 }
);
observer.observe(sentinel);

setupColumns();
loadMore();
setTimeout(loadMore, 250);

/* ──────────────────────────────────────────────────────────────────────────
   Mosaic Gallery — renders real content from window.GALLERY_ITEMS
   (generated into content/manifest.js by tools/build-manifest.mjs).
   Items arrive sorted newest-first. We reveal them one year-group at a time
   as the sentinel scrolls into view.
   ────────────────────────────────────────────────────────────────────────── */

const ITEMS = Array.isArray(window.GALLERY_ITEMS) ? window.GALLERY_ITEMS : [];

const mosaic   = document.getElementById('mosaic');
const sentinel = document.getElementById('sentinel');
const galWrap  = document.getElementById('gallery-wrap');

let loading      = false;
let cursor       = 0;     // index into ITEMS of the next item to render
let revealAnimIx = 0;     // for staggered fade-in within a batch

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

/* ── Image tile ── */
function makeImageTile(item, i) {
  const alt  = item.title || item.desc || 'photo';
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.style.animationDelay = `${(i % 5) * 55}ms`;
  tile.innerHTML = `
    <img src="${escapeAttr(item.src)}" alt="${escapeAttr(alt)}" loading="lazy">
    ${overlayHTML(item, null)}`;
  applyLink(tile, item);
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

/* ── Reveal the next batch of items ── */
const BATCH_SIZE = 12;
function loadMore() {
  if (loading) return;
  if (cursor >= ITEMS.length) { finish(); return; }

  loading = true;
  sentinel.textContent = 'Loading…';

  setTimeout(() => {
    const end = Math.min(cursor + BATCH_SIZE, ITEMS.length);
    let i = 0;
    while (cursor < end) {
      const tile = makeTile(ITEMS[cursor], i++);
      if (tile) mosaic.appendChild(tile);
      cursor++;
    }
    loading = false;

    if (cursor >= ITEMS.length) finish();
    else sentinel.textContent = 'Loading…';

    restoreScroll();
  }, 80);
}

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

loadMore();
setTimeout(loadMore, 250);

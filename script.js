/* ──────────────────────────────────────────────────────────────────────────
   Mosaic Gallery — renders content authored in content/items.js
   (window.GALLERY_ITEMS). No build step: this file derives everything at
   runtime — sorts by date (newest first), formats the timestamp, builds the
   media URL, and measures each image's aspect ratio — then lays the tiles out
   as a shortest-column masonry. More are revealed as the sentinel scrolls in.
   ────────────────────────────────────────────────────────────────────────── */

const VIDEO_AR = 0.5625; // 16:9 height/width, for youtube + posterless video
const AUDIO_AR = 0.80;   // height/width for a coverless audio card (a squat artifact)

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
    // A quote tile is text-only; it must carry quote text to be worth rendering.
    .filter((e) => e.type !== 'quote' || (e.quote && String(e.quote).trim()))
    .map((e) => {
      const it = { type: e.type, date: e.date, ts: displayTS(e.date) };
      if (e.title) it.title = e.title;
      if (e.desc) it.desc = e.desc;
      if (e.link) it.link = e.link;
      if (e.type === 'quote') {
        it.quote = String(e.quote).trim();
        if (e.author) it.author = e.author;
        // no media; tile height is measured at placement (see placeItem)
      } else if (e.type === 'youtube') {
        it.id = e.id;
        it.ar = VIDEO_AR;
      } else {
        it.src = mediaSrc(e.file);
        if (e.type === 'video') {
          if (e.poster) it.poster = mediaSrc(e.poster); // ar measured from poster
          else it.ar = VIDEO_AR;
        } else if (e.type === 'audio') {
          if (e.poster) it.poster = mediaSrc(e.poster); // cover art; ar from cover
          else it.ar = AUDIO_AR;
        }
        // image (and video/audio-with-poster) ar is measured lazily before placement
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

/** Ensure item.ar is set (no-op for youtube / posterless video / quote). */
async function ensureAR(it) {
  if (it.ar != null || it.type === 'quote') return; // quote height measured at placement
  const fromPoster = it.type === 'video' || it.type === 'audio';
  it.ar = await measureAR(fromPoster ? it.poster : it.src);
}

// External-link SVG icon (arrow-up-right style)
const LINK_ICON_SVG = `
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>`;

const PLAY_ICON_SVG  = `<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>`;
const PAUSE_ICON_SVG = `<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
const NEXT_ICON_SVG  = `<svg viewBox="0 0 24 24"><polygon points="5,4 15,12 5,20"/><rect x="16" y="4" width="3" height="16"/></svg>`;
const PREV_ICON_SVG  = `<svg viewBox="0 0 24 24"><rect x="5" y="4" width="3" height="16"/><polygon points="19,4 9,12 19,20"/></svg>`;
const QUEUE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
  stroke-linecap="round"><line x1="12" y1="6" x2="12" y2="18"/><line x1="6" y1="12" x2="18" y2="12"/></svg>`;
const TRASH_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
  stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>`;
// Viewfinder reticle — "find the playing tile on the page".
const LOCATE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
  stroke-linecap="round"><circle cx="12" cy="12" r="6"/><line x1="12" y1="2" x2="12" y2="5"/>
  <line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/>
  <line x1="19" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>`;
const VOL_ICON_SVG = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9z"/>
  <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
  d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/></svg>`;
const MUTE_ICON_SVG = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9z"/>
  <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
  d="M16 9.5l5 5M21 9.5l-5 5"/></svg>`;

/* ── Deterministic waveform: stable per recording, drawn from its filename ──
   A tiny FNV-style hash seeds a repeatable PRNG so a given audio file always
   prints the same gold waveform — its visual signature in the archive.       */
function seedHash(s) {
  let h = 2166136261;
  for (let i = 0; i < String(s).length; i++) {
    h ^= String(s).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function waveformSVG(seed, n = 44) {
  let h = seedHash(seed);
  const W = 100, H = 40, slot = W / n;
  let rects = '';
  for (let i = 0; i < n; i++) {
    h = (Math.imul(h, 1103515245) + 12345) & 0x7fffffff;
    const r = (h % 1000) / 1000;                       // 0..1 repeatable
    const env = 0.30 + 0.70 * Math.sin(((i + 0.5) / n) * Math.PI); // taller mid
    const bh = Math.max(0.10, r * env) * H;
    const x = i * slot + slot * 0.20;
    const y = (H - bh) / 2;
    const w = slot * 0.60;
    rects += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}"`
           + ` height="${bh.toFixed(2)}" rx="${(w / 2).toFixed(2)}"/>`;
  }
  return `<svg class="wave" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${rects}</svg>`;
}

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

/* A quick "added" bounce + ring on the queue badge when it's clicked. */
function popQueueBadge(btn) {
  if (!btn) return;
  btn.classList.remove('queue-pop');
  void btn.offsetWidth;        // restart the animation if clicked rapidly
  btn.classList.add('queue-pop');
  setTimeout(() => btn.classList.remove('queue-pop'), 450);
}

/* ──────────────────────────────────────────────────────────────────────────
   Lightbox — clicking a tile expands it over a darkened backdrop. Images,
   video posters and YouTube thumbnails enlarge as stills; an audio tile shows
   its cover (or its gold waveform); a quote becomes a framed inscription.
   Dismiss by clicking the backdrop, the ✕ button, or pressing Escape.
   ────────────────────────────────────────────────────────────────────────── */
const lightbox = (() => {
  const el = document.createElement('div');
  el.className = 'lightbox';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <button class="lightbox-close" aria-label="Close">&times;</button>
    <button class="lightbox-nav lightbox-prev" aria-label="Newer (←)">&#8249;</button>
    <button class="lightbox-nav lightbox-next" aria-label="Older (→)">&#8250;</button>
    <figure class="lightbox-figure"></figure>`;
  document.body.appendChild(el);
  const figure = el.querySelector('.lightbox-figure');

  const ytThumb = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  const PLAYABLE = new Set(['audio', 'video', 'youtube']);

  let item = null;       // the item currently expanded
  let lbHosted = false;  // did we start video/youtube playback inside this view?

  // The visual: a quote becomes an inscription; playable types become a
  // tile-like stage (cover/waveform + a centred play badge) that hosts
  // playback in place; images just enlarge.
  function stageHTML(it) {
    if (it.type === 'quote') {
      const len = it.quote.length;
      const size = len <= 70 ? 'q-lg' : len <= 160 ? 'q-md' : 'q-sm';
      const by = it.author
        ? `<div class="quote-by"><span class="quote-dash">—</span>${escapeHTML(it.author)}</div>` : '';
      return `<div class="lb-quote ${size}"><p class="lb-quote-text">${escapeHTML(it.quote)}</p>${by}</div>`;
    }
    if (it.type === 'video' || it.type === 'youtube') {
      const src = it.type === 'youtube' ? ytThumb(it.id) : it.poster;
      const cover = src
        ? `<img src="${escapeAttr(src)}" alt="${escapeAttr(it.title || it.desc || '')}">`
        : `<div class="video-placeholder"></div>`;
      return `<div class="lb-stage video-wrap">
        <div class="video-cover">${cover}</div>
        <button class="play-badge" type="button" aria-label="Play">${PLAY_ICON_SVG}</button>
      </div>`;
    }
    if (it.type === 'audio') {
      const cover = it.poster
        ? `<div class="audio-cover"><img src="${escapeAttr(it.poster)}" alt=""></div>` : '';
      return `<div class="lb-stage lb-audio${it.poster ? ' has-cover' : ''}">
        ${cover}${waveformSVG(it.src || it.date)}
        <button class="play-badge" type="button" aria-label="Play">${PLAY_ICON_SVG}</button>
      </div>`;
    }
    return `<img class="lightbox-img" src="${escapeAttr(it.src)}" alt="${escapeAttr(it.desc || '')}">`;
  }

  function capHTML(it) {
    const eyebrow = (it.type !== 'image' && it.type !== 'quote')
      ? `<span class="lb-type">${it.type}</span>` : '';
    const title = it.title && it.type !== 'quote'
      ? `<span class="lb-title">${escapeHTML(it.title)}</span>` : '';
    const desc = it.desc ? `<span class="lb-desc">${escapeHTML(it.desc)}</span>` : '';
    const link = it.link
      ? `<a class="lb-link" href="${escapeAttr(it.link)}" target="_blank" rel="noopener">Source &nearr;</a>` : '';
    return `<figcaption class="lightbox-cap">${eyebrow}${title}` +
           `<span class="lb-ts">${escapeHTML(it.ts || '')}</span>${desc}${link}</figcaption>`;
  }

  // Reflect the player's state onto the expanded view's play badge/stage.
  function syncPlayState() {
    if (!el.classList.contains('open') || !item || !PLAYABLE.has(item.type)) return;
    const stage = figure.querySelector('.lb-stage');
    if (stage) stage.classList.toggle('is-playing', player.isActive(item));
    const badge = figure.querySelector('.play-badge');
    if (badge) badge.innerHTML = player.isActive(item) ? PAUSE_ICON_SVG : PLAY_ICON_SVG;
  }

  const prevBtn = el.querySelector('.lightbox-prev');
  const nextBtn = el.querySelector('.lightbox-next');

  function open(it) {
    item = it;
    lbHosted = false;
    // Position within the gallery (newest-first) drives left/right navigation.
    const idx = ITEMS.indexOf(it);
    prevBtn.disabled = idx <= 0;                 // ← newer
    nextBtn.disabled = idx < 0 || idx >= ITEMS.length - 1; // → older
    figure.innerHTML = stageHTML(it) +
      (PLAYABLE.has(it.type)
        ? `<button class="lb-queue-badge audio-queue-badge" type="button" aria-label="Add to queue">${QUEUE_ICON_SVG}</button>`
        : '') +
      capHTML(it);

    if (PLAYABLE.has(it.type)) {
      const stage = figure.querySelector('.lb-stage');
      // If a video/youtube is already loaded, move the live player into the
      // expanded view so it keeps playing in place (no restart).
      if (it.type !== 'audio' && player.isLoaded(it)) {
        player.rehost(stage);
        lbHosted = true;
      }
      figure.querySelector('.play-badge').addEventListener('click', (e) => {
        e.stopPropagation();
        // Video/youtube render right here; audio plays through the bar.
        const host = (it.type === 'audio') ? null : stage;
        if (it.type !== 'audio') lbHosted = true;
        player.toggleTile(it, host);
      });
      figure.querySelector('.lb-queue-badge').addEventListener('click', (e) => {
        e.stopPropagation();
        popQueueBadge(e.currentTarget);
        const n = player.enqueue(it);
        toast(n ? `Queued · ${n} up next` : 'Now playing');
      });
    }
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    syncPlayState();
  }
  // Hand any video/youtube we hosted back to its tile so it keeps playing there;
  // audio was never moved (it plays through the now-playing bar).
  function releaseHosted() {
    if (lbHosted && item && player.isLoaded(item)) {
      const tile = mediaTile(item);
      const wrap = tile && tile.querySelector('.video-wrap');
      if (wrap) player.rehost(wrap); else player.stop();
    }
    lbHosted = false;
  }
  function close() {
    releaseHosted();
    item = null;
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    figure.innerHTML = ''; // release any decoded bitmap / players
  }
  // Step to an adjacent gallery tile: dir −1 = newer (left), +1 = older (right).
  function navigate(dir) {
    if (!item) return;
    const ni = ITEMS.indexOf(item) + dir;
    if (ni < 0 || ni >= ITEMS.length) return;
    releaseHosted();
    open(ITEMS[ni]);
  }

  el.addEventListener('click', (e) => { if (e.target === el) close(); });
  el.querySelector('.lightbox-close').addEventListener('click', close);
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(-1); });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(1); });
  document.addEventListener('keydown', (e) => {
    if (!el.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); navigate(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1); }
  });

  return { open, close, syncPlayState };
})();

function openLightbox(item) { lightbox.open(item); }

/* ── Transient toast (queue confirmations) ── */
const toast = (() => {
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('aria-live', 'polite');
  document.body.appendChild(t);
  let timer = null;
  return (msg) => {
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => t.classList.remove('show'), 1900);
  };
})();

/* The tile in the DOM for a given media item (audio / video / youtube). */
function mediaTile(item) {
  return document.querySelector(`.tile[data-media-date="${item.date}"]`);
}

/* ── YouTube IFrame API — loaded once, on first use ── */
let ytApiPromise = null;
function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });
  return ytApiPromise;
}

/* ──────────────────────────────────────────────────────────────────────────
   Now-playing bar — a persistent transport for any time-based tile: local
   audio, local video, or a YouTube embed. Each is wrapped in a small controller
   with one shared interface (play/pause/seek/time/volume), so the bar, the
   up-next queue, and the click-to-toggle tiles work the same across all three.
   Starting anything stops whatever was playing before.
   ────────────────────────────────────────────────────────────────────────── */
const player = (() => {
  const el = document.createElement('div');
  el.className = 'player';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <div class="player-eq" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
    <div class="player-meta">
      <button class="player-locate" data-act="locate" aria-label="Scroll to the playing tile"
              title="Scroll to the playing tile">${LOCATE_ICON_SVG}</button>
      <div class="player-meta-text">
        <div class="player-title"></div>
        <div class="player-sub"></div>
      </div>
    </div>
    <div class="player-seek">
      <span class="player-time player-cur">0:00</span>
      <div class="player-track" tabindex="0" role="slider" aria-label="Seek"><div class="player-prog"></div></div>
      <span class="player-time player-dur">0:00</span>
    </div>
    <div class="player-controls">
      <button class="player-btn" data-act="prev" aria-label="Previous track">${PREV_ICON_SVG}</button>
      <button class="player-btn player-toggle" data-act="toggle" aria-label="Play or pause">${PLAY_ICON_SVG}</button>
      <button class="player-btn" data-act="next" aria-label="Next track">${NEXT_ICON_SVG}</button>
      <div class="player-vol">
        <button class="player-vol-btn" data-act="mute" aria-label="Mute">${VOL_ICON_SVG}</button>
        <input class="player-vol-slider" type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume">
      </div>
    </div>
    <button class="player-queue" data-act="queue" aria-label="Show queue">
      <span class="player-queue-label">Up next</span><span class="player-qcount">0</span>
    </button>
    <button class="player-close" data-act="close" aria-label="Close player">&times;</button>
    <div class="player-pop" hidden></div>`;
  document.body.appendChild(el);

  const titleEl  = el.querySelector('.player-title');
  const subEl    = el.querySelector('.player-sub');
  const curEl    = el.querySelector('.player-cur');
  const durEl    = el.querySelector('.player-dur');
  const progEl   = el.querySelector('.player-prog');
  const trackEl  = el.querySelector('.player-track');
  const toggleBt = el.querySelector('.player-toggle');
  const qCountEl = el.querySelector('.player-qcount');
  const pop      = el.querySelector('.player-pop');
  const volBtn   = el.querySelector('.player-vol-btn');
  const volSld   = el.querySelector('.player-vol-slider');

  let current = null;   // the loaded item (kept while paused, for resume)
  let media   = null;   // its controller, or null
  let mediaHost = null; // where the current video/youtube renders (tile or expanded view)
  const queue = [];
  const history = [];   // tracks already played, for the previous button

  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

  const fmt = (t) => {
    if (!isFinite(t) || t < 0) t = 0;
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  };
  // A given title wins; otherwise the caption, then a cleaned-up filename / id.
  const label = (item) =>
    item.title || item.desc ||
    (item.src ? decodeURIComponent(item.src.split('/').pop().replace(/\.[^.]+$/, ''))
              : (item.id ? `YouTube ${item.id}` : 'Untitled'));

  /* Player volume — persisted; defaults to 50%. Applied to the live controller. */
  let volume = parseFloat(lsGet('player-vol'));
  if (!(volume >= 0 && volume <= 1)) volume = 0.5;
  let muted = lsGet('player-muted') === '1';
  let lastVol = volume > 0 ? volume : 0.5;

  function paintVol() {
    const v = muted ? 0 : volume;
    volSld.value = v;
    volSld.style.background = `linear-gradient(to right, var(--accent) ${v * 100}%, var(--border) ${v * 100}%)`;
    volBtn.innerHTML = (muted || v === 0) ? MUTE_ICON_SVG : VOL_ICON_SVG;
    volBtn.classList.toggle('is-muted', muted || v === 0);
    volBtn.setAttribute('aria-label', (muted || v === 0) ? 'Unmute' : 'Mute');
  }
  function applyVol() { if (media) { media.setVol(volume); media.setMuted(muted); } }
  volSld.addEventListener('input', () => {
    muted = false;
    volume = parseFloat(volSld.value);
    if (volume > 0) lastVol = volume;
    lsSet('player-vol', String(volume)); lsSet('player-muted', '0');
    applyVol(); paintVol();
  });
  volBtn.addEventListener('click', () => {
    if (muted || volume === 0) { muted = false; volume = lastVol > 0 ? lastVol : 1; }
    else muted = true;
    lsSet('player-vol', String(volume)); lsSet('player-muted', muted ? '1' : '0');
    applyVol(); paintVol();
  });
  paintVol();

  /* ── Shared hooks the controllers call back into ── */
  const hooks = {
    time: (t, d) => {
      progEl.style.width = d ? `${Math.min(100, (t / d) * 100)}%` : '0%';
      curEl.textContent = fmt(t);
      if (d) durEl.textContent = fmt(d);
    },
    ready: (d) => { if (d) durEl.textContent = fmt(d); },
    play:  syncToggle,
    pause: syncToggle,
    ended: () => { if (queue.length) playNext(); else syncToggle(); },
  };

  /* ── Controllers: one uniform interface over three very different players ── */
  function audioController(item) {
    const a = new Audio();
    a.preload = 'metadata';
    a.src = item.src;
    a.addEventListener('timeupdate', () => hooks.time(a.currentTime, a.duration || 0));
    a.addEventListener('loadedmetadata', () => hooks.ready(a.duration || 0));
    a.addEventListener('play', hooks.play);
    a.addEventListener('pause', hooks.pause);
    a.addEventListener('ended', hooks.ended);
    return {
      play: () => a.play().catch(() => {}),
      pause: () => a.pause(),
      seekFrac: (p) => { if (a.duration) a.currentTime = p * a.duration; },
      time: () => a.currentTime, dur: () => a.duration || 0,
      paused: () => a.paused, ended: () => a.ended,
      setVol: (v) => { a.volume = v; }, setMuted: (m) => { a.muted = m; },
      destroy: () => { a.pause(); a.removeAttribute('src'); a.load(); },
    };
  }

  function videoController(item, host) {
    let curHost = host;
    const v = document.createElement('video');
    v.className = 'inline-media';
    v.src = item.src; v.playsInline = true; v.preload = 'metadata';
    if (curHost) { curHost.appendChild(v); curHost.classList.add('media-live'); }
    v.addEventListener('timeupdate', () => hooks.time(v.currentTime, v.duration || 0));
    v.addEventListener('loadedmetadata', () => hooks.ready(v.duration || 0));
    v.addEventListener('play', hooks.play);
    v.addEventListener('pause', hooks.pause);
    v.addEventListener('ended', hooks.ended);
    return {
      play: () => v.play().catch(() => {}),
      pause: () => v.pause(),
      seekFrac: (p) => { if (v.duration) v.currentTime = p * v.duration; },
      time: () => v.currentTime, dur: () => v.duration || 0,
      paused: () => v.paused, ended: () => v.ended,
      setVol: (val) => { v.volume = val; }, setMuted: (m) => { v.muted = m; },
      // Moving the <video> element preserves playback — no reload.
      reparent: (newHost) => {
        if (curHost) curHost.classList.remove('media-live');
        curHost = newHost;
        if (curHost) { curHost.appendChild(v); curHost.classList.add('media-live'); }
      },
      destroy: () => { v.pause(); v.remove(); if (curHost) curHost.classList.remove('media-live'); },
    };
  }

  function youtubeController(item, host, startAt = 0) {
    const ytHost = document.createElement('div');
    ytHost.className = 'inline-media yt-host';
    if (host) { host.appendChild(ytHost); host.classList.add('media-live'); }
    let yt = null, ready = false, want = true, dur = 0, poll = null, dead = false;
    let pVol = volume, pMuted = muted;

    const startPoll = () => { stopPoll(); poll = setInterval(() => {
      if (yt && yt.getCurrentTime) { if (!dur) dur = yt.getDuration() || 0; hooks.time(yt.getCurrentTime() || 0, dur); }
    }, 250); };
    const stopPoll = () => { if (poll) { clearInterval(poll); poll = null; } };

    loadYouTubeAPI().then(() => {
      if (dead) return;
      yt = new YT.Player(ytHost, {
        videoId: item.id,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1, controls: 0 },
        events: {
          onReady: (e) => {
            ready = true; dur = e.target.getDuration() || 0;
            e.target.setVolume(pVol * 100); pMuted ? e.target.mute() : e.target.unMute();
            if (startAt > 0) e.target.seekTo(startAt, true); // resume where it left off
            hooks.ready(dur);
            want ? e.target.playVideo() : e.target.pauseVideo();
          },
          onStateChange: (e) => {
            const S = window.YT.PlayerState;
            if (!dur && yt) { dur = yt.getDuration() || 0; if (dur) hooks.ready(dur); }
            if (e.data === S.PLAYING) { startPoll(); hooks.play(); }
            else if (e.data === S.PAUSED) { stopPoll(); hooks.pause(); }
            else if (e.data === S.ENDED) { stopPoll(); hooks.ended(); }
          },
        },
      });
    });

    const stateIs = (...s) => ready && yt && yt.getPlayerState && s.includes(yt.getPlayerState());
    return {
      play: () => { want = true; if (ready && yt) yt.playVideo(); },
      pause: () => { want = false; if (ready && yt) yt.pauseVideo(); },
      seekFrac: (p) => { if (ready && yt && dur) yt.seekTo(p * dur, true); },
      time: () => (ready && yt && yt.getCurrentTime) ? (yt.getCurrentTime() || 0) : 0,
      dur: () => dur,
      paused: () => ready ? !stateIs(1, 3) : !want,   // 1 playing, 3 buffering
      ended: () => stateIs(0),
      setVol: (v) => { pVol = v; if (ready && yt) { yt.unMute(); yt.setVolume(v * 100); } },
      setMuted: (m) => { pMuted = m; if (ready && yt) { m ? yt.mute() : yt.unMute(); } },
      destroy: () => { dead = true; stopPoll(); try { yt && yt.destroy && yt.destroy(); } catch { /* gone */ } ytHost.remove(); if (host) host.classList.remove('media-live'); },
    };
  }

  function makeController(item, host, startAt = 0) {
    if (item.type === 'video')   return videoController(item, host);
    if (item.type === 'youtube') return youtubeController(item, host, startAt);
    return audioController(item);
  }
  // Where a video/youtube renders: an explicit host (e.g. the expanded view),
  // else the tile's own frame. Audio has no visual surface.
  function resolveHost(item, host) {
    if (item.type === 'audio') return null;
    if (host) return host;
    const tile = mediaTile(item);
    return (tile && tile.querySelector('.video-wrap')) || null;
  }

  function render() {
    if (current) { titleEl.textContent = label(current); subEl.textContent = current.ts || ''; }
    qCountEl.textContent = String(queue.length);
    el.classList.toggle('has-queue', queue.length > 0);
    if (queue.length === 0) pop.hidden = true;
    renderPop();
  }
  function syncToggle() {
    const paused = !media || media.paused();
    toggleBt.innerHTML = paused ? PLAY_ICON_SVG : PAUSE_ICON_SVG;
    el.classList.toggle('is-playing', !paused);
    updateTileStates();
    lightbox.syncPlayState();      // keep the expanded view's play badge in step
  }
  function start(item, host, fromHistory) {
    // Remember the outgoing track so the previous button can return to it.
    if (!fromHistory && current && current.date !== item.date) {
      history.push(current);
      if (history.length > 50) history.shift();
    }
    if (media) media.destroy();        // stop whatever was playing (audio or video)
    progEl.style.width = '0%';
    curEl.textContent = '0:00'; durEl.textContent = '0:00';
    current = item;
    mediaHost = resolveHost(item, host);
    media = makeController(item, mediaHost);
    applyVol();
    media.play();
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('player-active');
    render(); syncToggle();
  }
  // Previous: restart if we're past the first few seconds; otherwise step back
  // through history (without re-recording it).
  function playPrev() {
    if (!current) return;
    if (media && media.time() > 3) { media.seekFrac(0); return; }
    const prev = history.pop();
    if (prev) start(prev, null, true);
    else if (media) media.seekFrac(0);
  }
  /* Move the live video/youtube to a new frame (tile ⇄ expanded view) while it
     keeps playing. A <video> re-parents seamlessly; a YouTube iframe can't be
     moved without reloading, so it's recreated at the same time + state. */
  function rehost(newHost) {
    const h = newHost || (mediaTile(current) && mediaTile(current).querySelector('.video-wrap'));
    if (!current || !media || !h || mediaHost === h) return;
    if (current.type === 'video' && media.reparent) {
      media.reparent(h);
      mediaHost = h;
    } else if (current.type === 'youtube') {
      const at = media.time(); const wasPlaying = !media.paused();
      media.destroy();
      mediaHost = h;
      media = makeController(current, h, at);
      applyVol();
      if (!wasPlaying) media.pause();
      syncToggle();
    }
  }
  // Toggle the loaded item when it's in the same surface; otherwise start fresh.
  // `host` lets the expanded view render video/youtube into itself.
  function toggleTile(item, host = null) {
    const h = resolveHost(item, host);
    if (current && media && current.date === item.date && mediaHost === h) {
      if (media.ended()) start(item, host);      // finished → play again
      else if (media.paused()) media.play();     // resume in place
      else media.pause();                        // pause → reverts
    } else {
      start(item, host);                         // different item or surface → play now
    }
  }
  function enqueue(item) {
    if (!current) { start(item); return 0; }     // nothing playing → start it
    queue.push(item);
    render(); updateTileStates();
    return queue.length;
  }
  function playNext() {
    const nx = queue.shift();
    if (nx) start(nx);
    else syncToggle();
    render(); updateTileStates();
  }
  function close() {
    if (media) media.destroy();
    media = null; current = null; queue.length = 0;
    el.classList.remove('open', 'is-playing', 'has-queue');
    el.setAttribute('aria-hidden', 'true');
    pop.hidden = true;
    document.body.classList.remove('player-active');
    updateTileStates();
  }
  function renderPop() {
    pop.replaceChildren();
    if (!queue.length) return;
    const head = document.createElement('div');
    head.className = 'pop-head';
    head.textContent = 'Up next';
    pop.appendChild(head);
    queue.forEach((it, idx) => {
      const row = document.createElement('div');
      row.className = 'pop-row';
      row.innerHTML = `
        <button class="pop-play" aria-label="Play now">
          <span class="pop-i">${String(idx + 1).padStart(2, '0')}</span>
          <span class="pop-t">${escapeHTML(label(it))}</span>
        </button>
        <button class="pop-del" aria-label="Remove from queue">${TRASH_ICON_SVG}</button>`;
      row.querySelector('.pop-play').addEventListener('click', () => { queue.splice(idx, 1); start(it); });
      row.querySelector('.pop-del').addEventListener('click', () => {
        queue.splice(idx, 1); render(); updateTileStates();
      });
      pop.appendChild(row);
    });
    const clear = document.createElement('button');
    clear.className = 'pop-clear';
    clear.textContent = 'Clear queue';
    clear.addEventListener('click', () => { queue.length = 0; render(); updateTileStates(); });
    pop.appendChild(clear);
  }

  toggleBt.addEventListener('click', () => {
    if (!media) return;
    if (media.paused()) { if (media.ended()) media.seekFrac(0); media.play(); }
    else media.pause();
  });
  el.querySelector('[data-act=prev]').addEventListener('click', playPrev);
  el.querySelector('[data-act=next]').addEventListener('click', playNext);
  el.querySelector('[data-act=close]').addEventListener('click', close);
  el.querySelector('[data-act=queue]').addEventListener('click', () => {
    if (!queue.length) return;
    pop.hidden = !pop.hidden;
  });
  // Scroll the gallery to the playing tile, then — once the scroll settles —
  // flash it so the eye lands on where the track lives.
  el.querySelector('[data-act=locate]').addEventListener('click', () => {
    if (!current) return;
    const tile = mediaTile(current);
    if (!tile) { toast('That tile isn’t on the page'); return; }
    const flash = () => {
      tile.classList.remove('is-located');
      void tile.offsetWidth;            // restart the flash if it's mid-animation
      tile.classList.add('is-located');
      setTimeout(() => tile.classList.remove('is-located'), 1500);
    };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gwRect = galWrap.getBoundingClientRect();
    const tRect  = tile.getBoundingClientRect();
    const inView = tRect.top >= gwRect.top && tRect.bottom <= gwRect.bottom;
    if (reduce || inView) { tile.scrollIntoView({ block: 'center' }); flash(); return; }
    // Wait for the smooth scroll to finish (scrollend), with a timeout fallback.
    let fired = false;
    const done = () => { if (fired) return; fired = true; galWrap.removeEventListener('scrollend', done); clearTimeout(t); flash(); };
    galWrap.addEventListener('scrollend', done);
    const t = setTimeout(done, 1200);
    tile.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* Scrub — click or drag anywhere on the track to seek; arrow keys nudge.
     A drag holds playback (pausing if it was playing) and resumes on release
     only if it had been playing; a paused item stays paused at the new spot. */
  let scrubbing = false;
  let resumeAfterScrub = false;
  function seekToX(clientX) {
    const d = media ? media.dur() : 0;
    if (!d) return;
    const r = trackEl.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    media.seekFrac(p);
    progEl.style.width = `${p * 100}%`;
    curEl.textContent = fmt(p * d);
  }
  trackEl.addEventListener('pointerdown', (e) => {
    if (!media || !media.dur()) return;
    scrubbing = true;
    resumeAfterScrub = !media.paused(); // was it playing when the drag began?
    if (resumeAfterScrub) media.pause(); // hold playback while scrubbing
    try { trackEl.setPointerCapture(e.pointerId); } catch { /* older browsers */ }
    seekToX(e.clientX);
  });
  trackEl.addEventListener('pointermove', (e) => { if (scrubbing) seekToX(e.clientX); });
  const endScrub = () => {
    if (!scrubbing) return;
    scrubbing = false;
    if (resumeAfterScrub && media) media.play(); // resume only if it had been playing
    resumeAfterScrub = false;
  };
  trackEl.addEventListener('pointerup', endScrub);
  trackEl.addEventListener('pointercancel', endScrub);
  trackEl.addEventListener('keydown', (e) => {
    const d = media ? media.dur() : 0;
    if (!d) return;
    let t = media.time();
    if (e.key === 'ArrowRight') t += 5;
    else if (e.key === 'ArrowLeft') t -= 5;
    else if (e.key === 'Home') t = 0;
    else if (e.key === 'End') t = d;
    else return;
    e.preventDefault();
    media.seekFrac(Math.min(1, Math.max(0, t / d)));
  });

  return {
    toggleTile, enqueue, stop: close, rehost,
    isActive:  (item) => !!current && !!media && !media.paused() && current.date === item.date,
    isLoaded:  (item) => !!current && current.date === item.date,
    isQueued:  (item) => queue.some((q) => q.date === item.date),
  };
})();

/* Reflect player state onto any media tiles (audio/video/youtube) in the DOM. */
function updateTileStates() {
  document.querySelectorAll('.tile[data-media-date]').forEach((t) => {
    const ref = { date: t.dataset.mediaDate };
    const active = player.isActive(ref); // current AND actually playing
    t.classList.toggle('is-current', active);
    t.classList.toggle('is-playing', active);
    t.classList.toggle('is-queued', player.isQueued(ref));
    // The badge becomes a pause control while the tile plays (audio + video).
    const badge = t.querySelector('.play-badge');
    if (badge) {
      badge.innerHTML = active ? PAUSE_ICON_SVG : PLAY_ICON_SVG;
      badge.setAttribute('aria-label', active ? 'Pause' : 'Play');
    }
  });
}

/* ── Audio tile (waveform card or cover; click to play, + to queue) ── */
function makeAudioTile(item, i) {
  const tile = document.createElement('div');
  tile.className = 'tile audio-tile media-tile';
  tile.dataset.mediaDate = item.date;
  tile.style.animationDelay = `${(i % 5) * 55}ms`;

  const cover = item.poster
    ? `<div class="audio-cover"><img src="${escapeAttr(item.poster)}" alt="" loading="lazy"></div>`
    : '';

  tile.innerHTML = `
    <div class="audio-card${item.poster ? ' has-cover' : ''}"
         style="aspect-ratio:${1 / (item.ar || AUDIO_AR)}">
      ${cover}
      ${waveformSVG(item.src || item.date)}
      <button class="play-badge" type="button" aria-label="Play">${PLAY_ICON_SVG}</button>
      <button class="audio-queue-badge" type="button" aria-label="Add to queue">${QUEUE_ICON_SVG}</button>
    </div>
    ${overlayHTML({ ...item, desc: item.title || item.desc }, 'audio')}`;

  // External link as a clickable corner badge (top-right), like image tiles.
  if (item.link) {
    tile.classList.add('has-link');
    const a = document.createElement('a');
    a.className = 'link-badge link-badge-active';
    a.href = item.link;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'Open source');
    a.innerHTML = LINK_ICON_SVG;
    a.addEventListener('click', (e) => e.stopPropagation());
    tile.appendChild(a);
  }

  const card  = tile.querySelector('.audio-card');
  const pBtn  = tile.querySelector('.play-badge');
  const qBtn  = tile.querySelector('.audio-queue-badge');
  // The play icon plays/pauses; clicking anywhere else expands the tile.
  pBtn.addEventListener('click', (e) => { e.stopPropagation(); player.toggleTile(item); });
  card.addEventListener('click', (e) => {
    if (e.target.closest('.play-badge, .audio-queue-badge, .link-badge')) return;
    openLightbox(item);
  });
  qBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    popQueueBadge(e.currentTarget);
    const n = player.enqueue(item);
    toast(n ? `Queued · ${n} up next` : 'Now playing');
  });
  return tile;
}

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

/* ── Video tile (local or YouTube): plays in place via the now-playing bar.
   The play icon plays/pauses; clicking the tile expands it; + queues it. ── */
function makeMediaVideoTile(item, i, coverHTML) {
  const tile = document.createElement('div');
  tile.className = 'tile video-tile media-tile';
  tile.dataset.mediaDate = item.date;
  tile.style.animationDelay = `${(i % 5) * 55}ms`;
  tile.innerHTML = `
    <div class="video-wrap">
      <div class="video-cover">${coverHTML}</div>
      <!-- While playing, catches clicks over the media (esp. a YouTube iframe,
           which would otherwise swallow them) so the tile can expand. -->
      <div class="media-shield"></div>
      <button class="play-badge" type="button" aria-label="Play">${PLAY_ICON_SVG}</button>
    </div>
    <button class="audio-queue-badge" type="button" aria-label="Add to queue">${QUEUE_ICON_SVG}</button>
    ${overlayHTML({ ...item, desc: item.title || item.desc }, 'video')}`;

  // External link as a clickable corner badge (top-right), like image/audio.
  if (item.link) {
    tile.classList.add('has-link');
    const a = document.createElement('a');
    a.className = 'link-badge link-badge-active';
    a.href = item.link; a.target = '_blank'; a.rel = 'noopener';
    a.setAttribute('aria-label', 'Open source');
    a.innerHTML = LINK_ICON_SVG;
    a.addEventListener('click', (e) => e.stopPropagation());
    tile.appendChild(a);
  }

  const wrap = tile.querySelector('.video-wrap');
  const pBtn = tile.querySelector('.play-badge');
  // The play/pause badge controls playback; clicking anywhere else expands the
  // tile — including while it plays in place.
  pBtn.addEventListener('click', (e) => { e.stopPropagation(); player.toggleTile(item); });
  wrap.addEventListener('click', (e) => {
    if (e.target.closest('.play-badge, .audio-queue-badge, .link-badge')) return;
    openLightbox(item);
  });
  tile.querySelector('.audio-queue-badge').addEventListener('click', (e) => {
    e.stopPropagation();
    popQueueBadge(e.currentTarget);
    const n = player.enqueue(item);
    toast(n ? `Queued · ${n} up next` : 'Now playing');
  });
  return tile;
}

function makeVideoTile(item, i) {
  const title = item.title || 'video';
  const cover = item.poster
    ? `<img src="${escapeAttr(item.poster)}" alt="${escapeAttr(title)}">`
    : `<div class="video-placeholder"></div>`;
  return makeMediaVideoTile(item, i, cover);
}

function makeYouTubeTile(item, i) {
  const title    = item.title || 'video';
  const thumbUrl = `https://img.youtube.com/vi/${item.id}/mqdefault.jpg`;
  return makeMediaVideoTile(item, i, `<img src="${thumbUrl}" alt="${escapeAttr(title)}">`);
}

/* ── Quote tile (text artifact; quote + author shown, meta on hover) ──
   Default: the quote in serif italic with a hanging gold mark, the author in
   gold mono caps, and a link badge if one exists. Hover reveals date + desc. ── */
function makeQuoteTile(item, i) {
  const tile = document.createElement('div');
  tile.className = 'tile quote-tile';
  tile.style.animationDelay = `${(i % 5) * 55}ms`;

  // Shorter lines carry more weight, so set them larger — a real pull-quote.
  const len = item.quote.length;
  const size = len <= 70 ? 'q-lg' : len <= 160 ? 'q-md' : 'q-sm';

  const author = item.author
    ? `<div class="quote-by"><span class="quote-dash">—</span>${escapeHTML(item.author)}</div>`
    : '';
  // Hover reveals date + description in the same bottom overlay as image tiles —
  // the quote itself stays fully readable underneath.
  tile.innerHTML = `
    <div class="quote-card ${size}">
      <div class="quote-body">
        <p class="quote-text">${escapeHTML(item.quote)}</p>
        ${author}
      </div>
      ${overlayHTML(item, null)}
    </div>`;

  // The link opens via its corner badge; clicking the tile body expands it.
  if (item.link) {
    tile.classList.add('has-link');
    const a = document.createElement('a');
    a.className = 'link-badge link-badge-active';
    a.href = item.link; a.target = '_blank'; a.rel = 'noopener';
    a.setAttribute('aria-label', 'Open source');
    a.innerHTML = LINK_ICON_SVG;
    a.addEventListener('click', (e) => e.stopPropagation());
    tile.appendChild(a);
  }
  tile.classList.add('expandable');
  tile.addEventListener('click', (e) => {
    if (e.target.closest('.link-badge')) return;
    openLightbox(item);
  });
  return tile;
}

function makeTile(item, i) {
  if (item.type === 'image')   return makeImageTile(item, i);
  if (item.type === 'video')   return makeVideoTile(item, i);
  if (item.type === 'youtube') return makeYouTubeTile(item, i);
  if (item.type === 'audio')   return makeAudioTile(item, i);
  if (item.type === 'quote')   return makeQuoteTile(item, i);
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
  // Media tiles know their aspect ratio up front; a quote's height depends on
  // its rendered text, so measure it once it's in the column.
  const h = item.type === 'quote'
    ? tile.getBoundingClientRect().height
    : colWidth * (item.ar || 1);
  colHeights[c] += h + GAP;
}

/** Rebuild all currently-revealed tiles from scratch (e.g. on column change). */
function relayout() {
  const revealed = cursor;
  setupColumns();
  for (let i = 0; i < revealed; i++) placeItem(ITEMS[i], i);
  updateTileStates(); // re-apply now-playing / queued marks to rebuilt tiles
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
  updateTileStates();
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

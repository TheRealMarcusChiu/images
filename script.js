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
    .map((e) => {
      const it = { type: e.type, date: e.date, ts: displayTS(e.date) };
      if (e.title) it.title = e.title;
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

/** Ensure item.ar is set (no-op for youtube / posterless video). */
async function ensureAR(it) {
  if (it.ar != null) return;
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
const QUEUE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
  stroke-linecap="round"><line x1="12" y1="6" x2="12" y2="18"/><line x1="6" y1="12" x2="18" y2="12"/></svg>`;
const TRASH_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
  stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>`;
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

/* ──────────────────────────────────────────────────────────────────────────
   Now-playing bar — a persistent dock for audio tiles. One <audio> drives a
   single track plus an up-next queue; finishing a track auto-advances. The
   gold equalizer mirrors the static waveform printed on each tile.
   ────────────────────────────────────────────────────────────────────────── */
const player = (() => {
  const el = document.createElement('div');
  el.className = 'player';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <div class="player-eq" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
    <div class="player-meta">
      <div class="player-title"></div>
      <div class="player-sub"></div>
    </div>
    <div class="player-seek">
      <span class="player-time player-cur">0:00</span>
      <div class="player-track"><div class="player-prog"></div></div>
      <span class="player-time player-dur">0:00</span>
    </div>
    <div class="player-controls">
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

  const audio = new Audio();
  audio.preload = 'metadata';

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

  let current = null;
  let stopped = false;   // track finished with nothing queued → tiles revert
  const queue = [];

  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

  const fmt = (t) => {
    if (!isFinite(t) || t < 0) t = 0;
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  };
  // A given title wins; otherwise the caption, then a cleaned-up filename.
  const label = (item) =>
    item.title || item.desc ||
    decodeURIComponent((item.src || '').split('/').pop().replace(/\.[^.]+$/, ''));

  /* Volume — persisted across sessions; the speaker glyph doubles as mute. */
  let lastVol = parseFloat(lsGet('player-vol'));
  if (!(lastVol >= 0 && lastVol <= 1)) lastVol = 1;
  audio.volume = lastVol;
  function paintVol() {
    const v = audio.muted ? 0 : audio.volume;
    volSld.value = v;
    volSld.style.background = `linear-gradient(to right, var(--accent) ${v * 100}%, var(--border) ${v * 100}%)`;
    const off = audio.muted || v === 0;
    volBtn.innerHTML = off ? MUTE_ICON_SVG : VOL_ICON_SVG;
    volBtn.classList.toggle('is-muted', off);
    volBtn.setAttribute('aria-label', off ? 'Unmute' : 'Mute');
  }
  volSld.addEventListener('input', () => {
    audio.muted = false;
    audio.volume = parseFloat(volSld.value);
    if (audio.volume > 0) lastVol = audio.volume;
    lsSet('player-vol', String(audio.volume));
  });
  volBtn.addEventListener('click', () => {
    if (audio.muted || audio.volume === 0) { audio.muted = false; audio.volume = lastVol > 0 ? lastVol : 1; }
    else audio.muted = true;
    lsSet('player-vol', String(audio.muted ? 0 : audio.volume));
  });
  audio.addEventListener('volumechange', paintVol);
  paintVol();

  function render() {
    if (current) { titleEl.textContent = label(current); subEl.textContent = current.ts || ''; }
    qCountEl.textContent = String(queue.length);
    el.classList.toggle('has-queue', queue.length > 0);
    if (queue.length === 0) pop.hidden = true;
    renderPop();
  }
  function syncToggle() {
    toggleBt.innerHTML = audio.paused ? PLAY_ICON_SVG : PAUSE_ICON_SVG;
    el.classList.toggle('is-playing', !audio.paused);
    updateTileStates();
  }
  function start(item) {
    current = item;
    stopped = false;
    audio.src = item.src;
    audio.play().catch(() => {});
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('player-active');
    render();
  }
  function playNow(item) { start(item); }     // interrupt current, keep queue
  function enqueue(item) {
    if (!current) { start(item); return 0; }  // nothing playing → start it
    queue.push(item);
    render();
    updateTileStates();
    return queue.length;
  }
  function playNext() {
    const nx = queue.shift();
    if (nx) start(nx);
    render();
    updateTileStates();
  }
  function close() {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    current = null;
    queue.length = 0;
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

  audio.addEventListener('timeupdate', () => {
    const d = audio.duration || 0;
    progEl.style.width = d ? `${(audio.currentTime / d) * 100}%` : '0%';
    curEl.textContent = fmt(audio.currentTime);
  });
  audio.addEventListener('loadedmetadata', () => { durEl.textContent = fmt(audio.duration); });
  audio.addEventListener('play',  () => { stopped = false; syncToggle(); });
  audio.addEventListener('pause', syncToggle);
  audio.addEventListener('ended', () => {
    if (queue.length) { playNext(); return; }
    stopped = true;           // nothing left to play → the tile returns to normal
    syncToggle();
  });

  toggleBt.addEventListener('click', () => {
    if (!current) return;
    if (audio.paused) { if (audio.ended) audio.currentTime = 0; audio.play().catch(() => {}); }
    else audio.pause();
  });
  el.querySelector('[data-act=next]').addEventListener('click', playNext);
  el.querySelector('[data-act=close]').addEventListener('click', close);
  el.querySelector('[data-act=queue]').addEventListener('click', () => {
    if (!queue.length) return;
    pop.hidden = !pop.hidden;
  });
  trackEl.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const r = trackEl.getBoundingClientRect();
    audio.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * audio.duration;
  });

  return {
    playNow, enqueue,
    isCurrent: (item) => !!current && !stopped && current.date === item.date,
    isQueued:  (item) => queue.some((q) => q.date === item.date),
    isPlaying: () => !audio.paused,
  };
})();

/* Reflect player state onto any audio tiles currently in the DOM. */
function updateTileStates() {
  document.querySelectorAll('.audio-tile').forEach((t) => {
    const ref = { date: t.dataset.audioDate };
    const cur = player.isCurrent(ref);
    t.classList.toggle('is-current', cur);
    t.classList.toggle('is-playing', cur && player.isPlaying());
    t.classList.toggle('is-queued', player.isQueued(ref));
  });
}

/* ── Audio tile (waveform card or cover; click to play, + to queue) ── */
function makeAudioTile(item, i) {
  const tile = document.createElement('div');
  tile.className = 'tile audio-tile';
  tile.dataset.audioDate = item.date;
  tile.style.animationDelay = `${(i % 5) * 55}ms`;

  const cover = item.poster
    ? `<div class="audio-cover"><img src="${escapeAttr(item.poster)}" alt="" loading="lazy"></div>`
    : '';

  tile.innerHTML = `
    <div class="audio-card${item.poster ? ' has-cover' : ''}"
         style="aspect-ratio:${1 / (item.ar || AUDIO_AR)}">
      ${cover}
      ${waveformSVG(item.src || item.date)}
      <div class="audio-eq" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
      <div class="play-badge">${PLAY_ICON_SVG}</div>
      <button class="audio-queue-badge" type="button" aria-label="Add to queue">${QUEUE_ICON_SVG}</button>
    </div>
    ${overlayHTML(item, 'audio')}`;

  // External link: a clickable corner badge (top-right), mirroring image tiles —
  // so the card body stays dedicated to playback.
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

  const card = tile.querySelector('.audio-card');
  const qBtn = tile.querySelector('.audio-queue-badge');
  card.addEventListener('click', (e) => {
    if (e.target.closest('.audio-queue-badge')) return;
    player.playNow(item);
  });
  qBtn.addEventListener('click', (e) => {
    e.stopPropagation();
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
  if (item.type === 'audio')   return makeAudioTile(item, i);
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

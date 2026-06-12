'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const fmtDate = (d) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(d || '');
  return m ? `${m[1]}.${m[2]}.${m[3]} ${m[4]}:${m[5]}` : (d || '');
};

const DEFAULT_SERVER = 'http://localhost:3000';
let SERVER = DEFAULT_SERVER;

async function loadServer() {
  const { serverUrl } = await chrome.storage.sync.get({ serverUrl: DEFAULT_SERVER });
  SERVER = (serverUrl || DEFAULT_SERVER).replace(/\/+$/, '');
  $('#server').textContent = SERVER;
}
const mediaUrl = (f) => `${SERVER}/content/media/${encodeURIComponent(f)}`;

/* ---------- API ---------- */
async function apiList() {
  const r = await fetch(`${SERVER}/api/tiles`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()).items;
}
async function apiAdd(formData) {
  const r = await fetch(`${SERVER}/api/tiles`, { method: 'POST', body: formData });
  return { ok: r.ok, data: await r.json() };
}
async function apiJSON(path, payload) {
  const r = await fetch(`${SERVER}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  return { ok: r.ok, data: await r.json() };
}

function gitNote(g) {
  if (!g) return '';
  if (g.pushed) return ' · pushed';
  if (g.reason) return ` · git: ${esc(g.reason)}`;
  if (g.error)  return ` · push failed`;
  return '';
}
function gitAlert(g) { if (g && g.error) alert('Saved, but git push failed:\n' + g.error); }

/* ---------- Tabs ---------- */
const tabs = $$('.tab'), panels = $$('.panel');
function activate(name) {
  tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.tab === name));
  panels.forEach((p) => (p.hidden = p.dataset.panel !== name));
  if (name === 'manage') refresh();
}
tabs.forEach((t) => t.addEventListener('click', () => activate(t.dataset.tab)));

/* ---------- Add form ---------- */
const form = $('#add-form');
const F = form.elements;
const notice = $('#notice');
const currentType = () => F.type.value;
// Per-type "source" toggle (upload vs. URL/YouTube); null for types without one.
const currentSrc  = () =>
  currentType() === 'image' ? F.imgsrc.value :
  currentType() === 'audio' ? F.audsrc.value : null;

function syncFields() {
  const type = currentType(), src = currentSrc();
  $$('[data-for]', form).forEach((el) => {
    let show = el.dataset.for === type;
    if (show && el.classList.contains('srcd')) show = el.dataset.src === src;
    el.hidden = !show;
  });
}
$$('input[name=type]', form).forEach((r) => r.addEventListener('change', syncFields));
$$('input[name=imgsrc]', form).forEach((r) => r.addEventListener('change', syncFields));
$$('input[name=audsrc]', form).forEach((r) => r.addEventListener('change', syncFields));

function showNotice(html, isError) {
  notice.innerHTML = html;
  notice.className = isError ? 'notice notice-error' : 'notice';
  notice.hidden = false;
}

/* Grab a video's first frame as a JPEG blob (browser-side decode). */
function extractFirstFrame(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true; video.playsInline = true; video.preload = 'auto';
    const url = URL.createObjectURL(file);
    let done = false;
    const finish = (b) => { if (!done) { done = true; URL.revokeObjectURL(url); resolve(b); } };
    const capture = () => {
      const w = video.videoWidth, h = video.videoHeight;
      if (!w || !h) return finish(null);
      try {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(video, 0, 0, w, h);
        c.toBlob((b) => finish(b), 'image/jpeg', 0.9);
      } catch { finish(null); }
    };
    video.onloadeddata = () => { try { video.currentTime = Math.min(0.1, (video.duration || 1) / 2); } catch { capture(); } };
    video.onseeked = capture;
    video.onerror = () => finish(null);
    video.src = url;
    setTimeout(() => finish(null), 8000);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const type = currentType();
  const submitBtn = form.querySelector('button[type=submit]');
  const fd = new FormData();
  fd.append('type', type);
  fd.append('desc', F.desc.value);
  fd.append('link', F.link.value);
  if (F.hidden.checked) fd.append('hidden', 'true');

  if (type === 'image') {
    if (currentSrc() === 'url') {
      if (!F.imageUrl.value.trim()) return showNotice('Paste an image URL.', true);
      fd.append('imageUrl', F.imageUrl.value.trim());
    } else {
      if (!F.media.files[0]) return showNotice('Choose an image file.', true);
      fd.append('media', F.media.files[0]);
    }
  } else if (type === 'video') {
    if (!F.media2.files[0]) return showNotice('Choose a video file.', true);
    fd.append('media', F.media2.files[0]);
    if (F.poster.files[0]) {
      fd.append('poster', F.poster.files[0]);
    } else {
      submitBtn.disabled = true; submitBtn.textContent = 'Reading first frame…';
      const frame = await extractFirstFrame(F.media2.files[0]);
      if (frame) fd.append('poster', frame, 'poster.jpg');
    }
  } else if (type === 'audio') {
    if (currentSrc() === 'youtube') {
      if (!F.audioUrl.value.trim()) return showNotice('Paste a YouTube URL or ID.', true);
      fd.append('audioUrl', F.audioUrl.value.trim());
    } else {
      if (!F.audio.files[0]) return showNotice('Choose an audio file.', true);
      fd.append('media', F.audio.files[0]);
    }
    if (F.audioCover.files[0]) fd.append('poster', F.audioCover.files[0]);
    if (F.title.value.trim()) fd.append('title', F.title.value.trim());
  } else {
    if (!F.youtube.value.trim()) return showNotice('Paste a YouTube URL or ID.', true);
    fd.append('youtube', F.youtube.value.trim());
  }

  const extracting = type === 'audio' && currentSrc() === 'youtube';
  submitBtn.disabled = true; submitBtn.textContent = extracting ? 'Extracting audio…' : 'Adding…';
  try {
    const { ok, data } = await apiAdd(fd);
    if (ok) {
      const what = data.entry.file ? `<code>${esc(data.entry.file)}</code>` : `id <code>${esc(data.entry.id)}</code>`;
      showNotice(`Added ${esc(data.entry.type)} ${what}` + (data.entry.hidden ? ' · hidden' : '') + gitNote(data.git) +
        ` · <a href="${SERVER}/index" target="_blank">view →</a>`, false);
      form.reset(); syncFields();
    } else showNotice(esc(data.error) || 'Something went wrong.', true);
  } catch (err) {
    showNotice(`Could not reach the server at ${esc(SERVER)}.`, true);
  } finally {
    submitBtn.disabled = false; submitBtn.textContent = 'Add tile';
  }
});

/* ---------- Manage ---------- */
const rowsEl = $('#rows'), countEl = $('#count'), emptyMsg = $('#empty');
let editingDate = null;
let cache = [];

async function refresh() {
  try { cache = await apiList(); }
  catch (e) {
    rowsEl.replaceChildren(); countEl.textContent = '';
    emptyMsg.textContent = `Could not reach ${SERVER}`; emptyMsg.hidden = false;
    return;
  }
  render();
}
function render() {
  countEl.textContent = `${cache.length} tile${cache.length === 1 ? '' : 's'}`;
  rowsEl.replaceChildren();
  cache.forEach((it) => rowsEl.appendChild(it.date === editingDate ? editRow(it) : viewRow(it)));
  emptyMsg.textContent = 'No tiles yet.';
  emptyMsg.hidden = cache.length > 0;
}
function thumbHTML(it) {
  if (it.type === 'youtube') return `<img src="https://img.youtube.com/vi/${esc(it.id)}/default.jpg" alt="">`;
  if (it.type === 'image')   return `<img src="${esc(mediaUrl(it.file))}" alt="">`;
  if (it.poster)             return `<img src="${esc(mediaUrl(it.poster))}" alt="">`;
  return it.type === 'audio' ? 'audio' : 'video';
}
function viewRow(it) {
  const el = document.createElement('div');
  el.className = 'row' + (it.hidden ? ' is-hidden' : '');
  const display = it.title || it.desc;
  const title = display ? esc(display) : `<span class="muted">${esc(it.file || it.id || '')}</span>`;
  const meta = [it.type + (it.hidden ? ' · hidden' : ''), fmtDate(it.date), it.link ? 'link' : '']
    .filter(Boolean).join(' · ');
  el.innerHTML = `
    <div class="thumb">${thumbHTML(it)}</div>
    <div class="body"><div class="t">${title}</div><div class="m">${esc(meta)}</div></div>
    <div class="row-actions">
      <button class="btn btn-ghost" data-act="edit">Edit</button>
      <button class="btn btn-ghost" data-act="toggle">${it.hidden ? 'Show' : 'Hide'}</button>
      <button class="btn btn-danger" data-act="delete">Del</button>
    </div>`;
  el.querySelector('[data-act=edit]').addEventListener('click', () => { editingDate = it.date; render(); });
  el.querySelector('[data-act=toggle]').addEventListener('click', () => toggleHidden(it));
  el.querySelector('[data-act=delete]').addEventListener('click', () => del(it));
  return el;
}
function editRow(it) {
  const el = document.createElement('form');
  el.className = 'row';
  el.innerHTML = `
    <div class="thumb">${thumbHTML(it)}</div>
    <div class="body edit-fields">
      <input type="text" name="date" value="${esc(it.date)}" spellcheck="false">
      ${it.type === 'audio' ? `<input type="text" name="title" value="${esc(it.title || '')}" placeholder="Title — shown in the player">` : ''}
      <textarea name="desc" rows="2" placeholder="Description">${esc(it.desc || '')}</textarea>
      <input type="url" name="link" value="${esc(it.link || '')}" placeholder="External link">
      <label class="edit-check"><input type="checkbox" name="hidden" ${it.hidden ? 'checked' : ''}> Hidden</label>
    </div>
    <div class="row-actions">
      <button type="submit" class="btn btn-primary">Save</button>
      <button type="button" class="btn btn-ghost" data-act="cancel">Cancel</button>
    </div>`;
  el.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      date: it.date,
      newDate: el.elements.date.value.trim(),
      desc: el.elements.desc.value,
      link: el.elements.link.value,
      hidden: el.elements.hidden.checked,
    };
    if (el.elements.title) payload.title = el.elements.title.value;
    const { ok, data } = await apiJSON('/api/tiles/update', payload);
    if (!ok) { alert(data.error || 'Update failed'); return; }
    gitAlert(data.git);
    editingDate = null; refresh();
  });
  el.querySelector('[data-act=cancel]').addEventListener('click', () => { editingDate = null; render(); });
  return el;
}
async function toggleHidden(it) {
  const { ok, data } = await apiJSON('/api/tiles/update', { date: it.date, hidden: !it.hidden });
  if (!ok) { alert(data.error || 'Update failed'); return; }
  gitAlert(data.git); refresh();
}
async function del(it) {
  const label = it.desc ? `“${it.desc.slice(0, 40)}”` : (it.file || it.id || it.date);
  if (!confirm(`Delete this ${it.type} tile (${label})?\nIts media files will also be removed.`)) return;
  const { ok, data } = await apiJSON('/api/tiles/delete', { date: it.date });
  if (!ok) { alert(data.error || 'Delete failed'); return; }
  gitAlert(data.git); refresh();
}

/* ---------- Options link ---------- */
$('#open-options').addEventListener('click', () => chrome.runtime.openOptionsPage());

/* ---------- Init (incl. right-click prefill) ---------- */
(async () => {
  await loadServer();
  const params = new URLSearchParams(location.search);
  const src = params.get('src');
  if (src) {
    // Prefilled from the right-click "Add image" context menu.
    F.type.value = 'image';
    F.imgsrc.value = 'url';
    F.imageUrl.value = src;
    const page = params.get('page');
    if (page) F.link.value = page;
    syncFields();
    showNotice('Image URL filled from the page — add details and submit.', false);
    F.desc.focus();
  } else {
    syncFields();
  }
})();

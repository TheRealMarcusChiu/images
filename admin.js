/* ──────────────────────────────────────────────────────────────────────────
   admin.js — modal-based CRUD for the gallery admin.

   The page itself is the public mosaic engine (script.js) running in admin mode
   (window.GALLERY_CONFIG.admin), which renders every tile — hidden ones dimmed —
   with a pencil button. This file owns the create / edit / delete modals and
   talks to the same /api/tiles endpoints the old admin used; after any write it
   calls window.GALLERY.reload() to refresh the grid in place.
   ────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const PROD_URL = 'http://git.marcuschiu.com/images/';
  const OFFLINE = 'is the server running?';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const mediaUrl = (f) => 'content/media/' + encodeURIComponent(f);
  const reloadGrid = () => window.GALLERY && window.GALLERY.reload && window.GALLERY.reload();

  function gitNote(g) {
    if (!g) return '';
    if (g.pushed) return ' · pushed to GitHub';
    if (g.reason) return ` · git: ${esc(g.reason)}`;
    if (g.error)  return ` · push failed: ${esc(g.error)}`;
    return '';
  }
  function gitAlert(g) { if (g && g.error) alert('Saved, but git push failed:\n' + g.error); }

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

  /* ---------- Modal host ---------- */
  const modal = $('#admin-modal');
  function openModal(title, bodyHTML) {
    modal.innerHTML = `
      <div class="admin-modal-card">
        <div class="admin-modal-head">
          <div class="admin-modal-title">${esc(title)}</div>
          <button class="admin-modal-close" type="button" data-act="close" aria-label="Close">×</button>
        </div>
        ${bodyHTML}
      </div>`;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('[data-act=close]').addEventListener('click', closeModal);
    return modal.querySelector('.admin-modal-card');
  }
  function closeModal() {
    modal.hidden = true;
    modal.innerHTML = '';
    document.body.style.overflow = '';
  }
  modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  function showNotice(card, html, isError) {
    const n = card.querySelector('[data-notice]');
    if (!n) return;
    n.innerHTML = html;
    n.className = isError ? 'notice notice-error' : 'notice';
    n.hidden = false;
  }

  /* ---------- Create ---------- */
  const ADD_FORM_HTML = `
    <form id="add-form" class="admin-form" autocomplete="off">
      <label>
        <span>Type <em>required</em></span>
        <div class="seg">
          <label class="seg-btn"><input type="radio" name="type" value="image" checked>Image</label>
          <label class="seg-btn"><input type="radio" name="type" value="youtube">YouTube</label>
          <label class="seg-btn"><input type="radio" name="type" value="video">Video</label>
          <label class="seg-btn"><input type="radio" name="type" value="audio">Audio</label>
          <label class="seg-btn"><input type="radio" name="type" value="quote">Quote</label>
        </div>
      </label>

      <label class="typed" data-for="quote" hidden>
        <span>Quote <em>required</em></span>
        <textarea name="quote" rows="3" placeholder="The line worth keeping."></textarea>
      </label>
      <label class="typed" data-for="quote" hidden>
        <span>Author <em>optional</em></span>
        <input type="text" name="author" placeholder="Who said it">
      </label>

      <label class="typed" data-for="image">
        <span>Image source</span>
        <div class="seg">
          <label class="seg-btn"><input type="radio" name="imgsrc" value="upload" checked>Upload file</label>
          <label class="seg-btn"><input type="radio" name="imgsrc" value="url">From URL</label>
        </div>
      </label>
      <label class="typed srcd" data-for="image" data-src="upload">
        <span>Image file</span>
        <input type="file" name="media" accept="image/*">
      </label>
      <label class="typed srcd" data-for="image" data-src="url" hidden>
        <span>Image URL <em>downloaded &amp; saved locally</em></span>
        <input type="url" name="imageUrl" placeholder="https://example.com/photo.jpg">
      </label>

      <label class="typed" data-for="youtube" hidden>
        <span>YouTube URL or ID</span>
        <input type="text" name="youtube" placeholder="https://youtu.be/aqz-KE-bpKQ  ·  or  ·  aqz-KE-bpKQ">
      </label>

      <label class="typed" data-for="video" hidden>
        <span>Video file</span>
        <input type="file" name="media2" accept="video/*">
      </label>
      <label class="typed" data-for="video" hidden>
        <span>Poster <em>optional · first frame used if blank</em></span>
        <input type="file" name="poster" accept="image/*">
      </label>

      <label class="typed" data-for="audio" hidden>
        <span>Audio source</span>
        <div class="seg">
          <label class="seg-btn"><input type="radio" name="audsrc" value="upload" checked>Upload file</label>
          <label class="seg-btn"><input type="radio" name="audsrc" value="youtube">From YouTube</label>
        </div>
      </label>
      <label class="typed srcd" data-for="audio" data-src="upload" hidden>
        <span>Audio file</span>
        <input type="file" name="audio" accept="audio/*">
      </label>
      <label class="typed srcd" data-for="audio" data-src="youtube" hidden>
        <span>YouTube URL <em>audio extracted &amp; saved locally</em></span>
        <input type="text" name="audioUrl" placeholder="https://youtu.be/aqz-KE-bpKQ  ·  or  ·  aqz-KE-bpKQ">
      </label>
      <label class="typed" data-for="audio" hidden>
        <span>Cover art <em>optional · a still from the video, or waveform, if blank</em></span>
        <input type="file" name="audioCover" accept="image/*">
      </label>
      <label class="typed" data-for="audio" hidden>
        <span>Title <em>optional · shown in the player &amp; queue</em></span>
        <input type="text" name="title" placeholder="Track name">
      </label>

      <label>
        <span>Description <em>optional</em></span>
        <textarea name="desc" rows="3" placeholder="Shown on hover and in the lightbox."></textarea>
      </label>
      <label>
        <span>External link <em>optional</em></span>
        <input type="url" name="link" placeholder="https://example.com">
      </label>
      <label class="check-row">
        <input type="checkbox" name="hidden">
        <span>Add as hidden</span>
      </label>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Add tile</button>
        <button type="reset" class="btn btn-ghost">Clear</button>
      </div>
      <p data-notice class="notice" hidden></p>
    </form>`;

  function openCreateModal() {
    const card = openModal('New tile', ADD_FORM_HTML);
    const form = $('#add-form', card);
    const F = form.elements;
    const currentType = () => F.type.value;
    const currentSrc = () =>
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
    form.addEventListener('reset', () => setTimeout(syncFields, 0));
    syncFields();

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
        if (currentSrc() === 'upload') {
          if (!F.media.files[0]) return showNotice(card, 'Choose an image file.', true);
          fd.append('media', F.media.files[0]);
        } else {
          if (!F.imageUrl.value.trim()) return showNotice(card, 'Paste an image URL.', true);
          fd.append('imageUrl', F.imageUrl.value.trim());
        }
      } else if (type === 'video') {
        if (!F.media2.files[0]) return showNotice(card, 'Choose a video file.', true);
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
          if (!F.audioUrl.value.trim()) return showNotice(card, 'Paste a YouTube URL or ID.', true);
          fd.append('audioUrl', F.audioUrl.value.trim());
        } else {
          if (!F.audio.files[0]) return showNotice(card, 'Choose an audio file.', true);
          fd.append('media', F.audio.files[0]);
        }
        if (F.audioCover.files[0]) fd.append('poster', F.audioCover.files[0]);
        if (F.title.value.trim()) fd.append('title', F.title.value.trim());
      } else if (type === 'quote') {
        if (!F.quote.value.trim()) return showNotice(card, 'Write the quote text.', true);
        fd.append('quote', F.quote.value.trim());
        if (F.author.value.trim()) fd.append('author', F.author.value.trim());
      } else {
        if (!F.youtube.value.trim()) return showNotice(card, 'Paste a YouTube URL or ID.', true);
        fd.append('youtube', F.youtube.value.trim());
      }

      const extracting = type === 'audio' && currentSrc() === 'youtube';
      submitBtn.disabled = true;
      submitBtn.textContent = extracting ? 'Extracting audio…' : 'Adding…';
      try {
        const res = await fetch('/api/tiles', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok) {
          const what = data.entry.file ? `<code>${esc(data.entry.file)}</code>`
            : data.entry.id ? `id <code>${esc(data.entry.id)}</code>`
            : data.entry.quote ? `<code>“${esc(data.entry.quote.slice(0, 40))}”</code>` : '';
          showNotice(card, `Added ${esc(data.entry.type)} ${what}` + (data.entry.hidden ? ' · hidden' : '') +
            gitNote(data.git) +
            ` · <a href="${PROD_URL}" target="_blank" rel="noopener">production →</a>`, false);
          form.reset(); syncFields();
          reloadGrid();
        } else showNotice(card, esc(data.error) || 'Something went wrong.', true);
      } catch (err) {
        showNotice(card, `Could not save — ${OFFLINE}`, true);
      } finally {
        submitBtn.disabled = false; submitBtn.textContent = 'Add tile';
      }
    });
  }
  $('#admin-create').addEventListener('click', openCreateModal);

  /* ---------- Edit ---------- */
  function editFormHTML(it) {
    const thumb =
      it.type === 'youtube' ? `<img class="edit-thumb" src="https://img.youtube.com/vi/${esc(it.id)}/default.jpg" alt="">`
      : it.type === 'image' ? `<img class="edit-thumb" src="${esc(mediaUrl(it.file))}" alt="">`
      : it.poster ? `<img class="edit-thumb" src="${esc(mediaUrl(it.poster))}" alt="">` : '';
    const fileField =
      it.type === 'image' ? `<label class="edit-file"><span>Replace photo</span><input type="file" name="image" accept="image/*"></label>`
      : (it.type === 'video' || it.type === 'audio')
        ? `<label class="edit-file"><span>${it.type === 'audio' ? 'Cover image' : 'Poster image'}</span><input type="file" name="image" accept="image/*"></label>`
        : '';
    return `
      <form id="edit-form" class="admin-form" autocomplete="off">
        ${thumb}
        <label><span>Date <em>id — changing it renames the media files</em></span>
          <input type="text" name="date" value="${esc(it.date)}" spellcheck="false"></label>
        ${it.type === 'audio' ? `<label><span>Title</span><input type="text" name="title" value="${esc(it.title || '')}" placeholder="Shown in the player"></label>` : ''}
        ${it.type === 'quote' ? `<label><span>Quote</span><textarea name="quote" rows="3" placeholder="Quote">${esc(it.quote || '')}</textarea></label>
        <label><span>Author</span><input type="text" name="author" value="${esc(it.author || '')}" placeholder="Author"></label>` : ''}
        <label><span>Description</span><textarea name="desc" rows="3" placeholder="Description">${esc(it.desc || '')}</textarea></label>
        <label><span>External link</span><input type="url" name="link" value="${esc(it.link || '')}" placeholder="https://example.com"></label>
        ${fileField}
        <label class="check-row"><input type="checkbox" name="hidden" ${it.hidden ? 'checked' : ''}><span>Hidden</span></label>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Save</button>
          <button type="button" class="btn btn-ghost" data-act="cancel">Cancel</button>
          <button type="button" class="btn btn-danger" data-act="delete">Delete</button>
        </div>
        <p data-notice class="notice" hidden></p>
      </form>`;
  }

  function openEditModal(it) {
    if (!it) return;
    const card = openModal('Edit tile', editFormHTML(it));
    const form = $('#edit-form', card);
    form.querySelector('[data-act=cancel]').addEventListener('click', closeModal);
    form.querySelector('[data-act=delete]').addEventListener('click', () => del(it, card));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = form.querySelector('button[type=submit]');
      // Replace the image first (keyed by the current date), then field edits.
      const imgInput = form.elements.image;
      if (imgInput && imgInput.files[0]) {
        saveBtn.disabled = true; saveBtn.textContent = 'Uploading…';
        const slot = it.type === 'image' ? 'file' : 'poster';
        const mfd = new FormData();
        mfd.append('date', it.date); mfd.append('slot', slot); mfd.append('media', imgInput.files[0]);
        const mr = await fetch('/api/tiles/media', { method: 'POST', body: mfd });
        const md = await mr.json();
        if (!mr.ok) { showNotice(card, esc(md.error) || 'Image update failed', true); saveBtn.disabled = false; saveBtn.textContent = 'Save'; return; }
      }
      const payload = {
        date: it.date,
        newDate: form.elements.date.value.trim(),
        desc: form.elements.desc.value,
        link: form.elements.link.value,
        hidden: form.elements.hidden.checked,
      };
      if (form.elements.title) payload.title = form.elements.title.value;
      if (form.elements.quote) payload.quote = form.elements.quote.value;
      if (form.elements.author) payload.author = form.elements.author.value;
      saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
      try {
        const res = await fetch('/api/tiles/update', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) { showNotice(card, esc(data.error) || 'Update failed', true); return; }
        gitAlert(data.git);
        closeModal(); reloadGrid();
      } catch (err) {
        showNotice(card, `Could not save — ${OFFLINE}`, true);
      } finally {
        saveBtn.disabled = false; saveBtn.textContent = 'Save';
      }
    });
  }

  async function del(it, card) {
    const label = it.desc ? `“${it.desc.slice(0, 40)}”` : (it.file || it.id || it.date);
    if (!confirm(`Delete this ${it.type} tile (${label})?\nIts media files will also be removed.`)) return;
    try {
      const res = await fetch('/api/tiles/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: it.date }),
      });
      const data = await res.json();
      if (!res.ok) { showNotice(card, esc(data.error) || 'Delete failed', true); return; }
      gitAlert(data.git);
      closeModal(); reloadGrid();
    } catch (err) {
      showNotice(card, `Could not delete — ${OFFLINE}`, true);
    }
  }

  // Let script.js's per-tile pencil button reach the edit modal.
  window.GALLERY_CONFIG.onEdit = openEditModal;
})();

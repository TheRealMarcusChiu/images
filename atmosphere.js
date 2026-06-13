/* ──────────────────────────────────────────────────────────────────────────
   Atmosphere — the framing around the gallery: an intro loader, a custom
   cursor, and a slowly-rotating 3D wall of the archive's own images behind the
   hero wordmark. Pure vanilla, no build step — a sibling to script.js, which
   still owns the gallery tiles, audio player and lightbox untouched.

   The page scrolls INSIDE #gallery-wrap (script.js roots its infinite-scroll
   observer there), so the hero, quote interlude and footer live inside that
   same scroller; everything here only reads the DOM script.js relies on.
   ────────────────────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia &&
    window.matchMedia('(pointer: coarse)').matches;

  const galWrap = document.getElementById('gallery-wrap');
  const hero    = document.getElementById('hero');

  /* Hero-wall image sources, drawn from the gallery's own content. */
  function heroImages() {
    const raw = Array.isArray(window.GALLERY_ITEMS) ? window.GALLERY_ITEMS : [];
    return raw
      .filter((e) => e && e.type === 'image' && e.file && !e.hidden)
      .map((e) => `content/media/${encodeURIComponent(e.file)}`);
  }

  /* ── Loader: the wordmark rises, a hairline bar fills, then it lifts away.
     Timer-driven so it keeps advancing in a throttled background tab, with a
     hard timeout so a stalled asset can never trap the page behind it. ── */
  let loaderDone = false;
  let ldTimer = null, ldHard = null;
  function runLoader() {
    const word = document.getElementById('ld-word');
    const bar  = document.getElementById('ld-bar');
    const num  = document.getElementById('ld-num');
    if (word) requestAnimationFrame(() => { word.style.transform = 'translateY(0)'; });
    const start = performance.now(), dur = 1700;
    ldTimer = setInterval(() => {
      const k = Math.min(1, (performance.now() - start) / dur);
      const p = Math.round((1 - Math.pow(1 - k, 2)) * 100);
      if (num) num.textContent = String(p).padStart(2, '0');
      if (bar) bar.style.right = (100 - p) + '%';
      if (k >= 1) { clearInterval(ldTimer); finishLoader(); }
    }, 40);
    ldHard = setTimeout(finishLoader, 2600);
  }
  function finishLoader() {
    if (loaderDone) return;
    loaderDone = true;
    clearInterval(ldTimer); clearTimeout(ldHard);
    const loader = document.getElementById('loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => { loader.style.display = 'none'; }, 820);
    }
    document.body.classList.add('ready'); // releases the hero entrance animation
    glEntered = true;                      // fades the 3D wall in
  }

  /* ── Custom cursor: a lagging ring + a crisp dot, the ring swelling over
     anything marked [data-hov]. Skipped entirely on touch devices. ── */
  function initCursor() {
    if (coarse) return;
    const ring = document.getElementById('cur-ring');
    const dot  = document.getElementById('cur-dot');
    if (!ring || !dot) return;
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px)`;
      const hov = e.target && e.target.closest && e.target.closest('[data-hov]');
      if (hov) {
        ring.style.width = '52px'; ring.style.height = '52px';
        ring.style.margin = '-26px 0 0 -26px';
        ring.style.background = 'rgba(200,169,110,.14)';
        ring.style.borderColor = 'rgba(200,169,110,.9)';
      } else {
        ring.style.width = '34px'; ring.style.height = '34px';
        ring.style.margin = '-17px 0 0 -17px';
        ring.style.background = 'transparent';
        ring.style.borderColor = 'rgba(200,169,110,.7)';
      }
    });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ── Index link fades once you've scrolled past the hero; back-to-top and
     the index link drive the inner #gallery-wrap scroller (not the window). ── */
  function initChrome() {
    const link   = document.getElementById('index-link');
    const toTop  = document.getElementById('to-top');
    const mosaic = document.getElementById('mosaic');
    if (galWrap) {
      const onScroll = () => {
        const past = galWrap.scrollTop > innerHeight * 0.5;
        if (link) {
          link.style.opacity = past ? '0' : '1';
          link.style.transform = past ? 'translateY(-10px)' : 'none';
          link.style.pointerEvents = past ? 'none' : 'auto';
        }
        // The custom cursor belongs to the hero; over the gallery/tiles hand
        // control back to the ordinary system pointer.
        const inHero = !coarse && galWrap.scrollTop < (hero ? hero.offsetHeight * 0.55 : innerHeight * 0.55);
        document.body.classList.toggle('atmo-cursor', inHero);
      };
      galWrap.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      // Hero snap: when scrolling stops part-way through the landing page, snap
      // to whichever end is nearer — past the halfway mark drops you into the
      // index, short of it bounces back to the top. Only acts inside the hero.
      let snapTimer = null, snapping = false;
      const snapTo = (top) => {
        snapping = true;
        galWrap.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
        let released = false;
        const release = () => {
          if (released) return; released = true;
          galWrap.removeEventListener('scrollend', release);
          snapping = false;
        };
        galWrap.addEventListener('scrollend', release);
        setTimeout(release, 700);
      };
      const maybeSnap = () => {
        if (snapping || !hero) return;
        const h = hero.offsetHeight, st = galWrap.scrollTop;
        if (st <= 0 || st >= h) return;             // only within the hero zone
        snapTo(st >= h / 2 ? h : 0);
      };
      galWrap.addEventListener('scroll', () => {
        if (snapping) return;
        clearTimeout(snapTimer);
        snapTimer = setTimeout(maybeSnap, 130);     // act once scrolling settles
      }, { passive: true });
    }
    if (link && galWrap && mosaic) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        galWrap.scrollTo({ top: hero ? hero.offsetHeight : mosaic.offsetTop, behavior: 'smooth' });
      });
    }
    if (toTop && galWrap) {
      toTop.addEventListener('click', (e) => {
        e.preventDefault();
        galWrap.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* ── 3D hero wall: a rotating ring of the archive's images, each card
     billboarded to face the camera so it never skews. It drifts on its own and
     is nudged by the cursor; a slow drag spins it, a click-without-drag opens
     that image in the gallery's lightbox via a synthetic tile hit. */
  let glEntered = false;
  let gl = null;
  function waitThree(n) {
    if (window.THREE) { initGL(); return; }
    if (n > 200) return;            // give up after ~8s; loader/gallery still fine
    setTimeout(() => waitThree(n + 1), 40);
  }
  function initGL() {
    const THREE = window.THREE;
    const canvas = document.getElementById('gl');
    if (!canvas || !hero) return;
    const imgs = heroImages();
    if (!imgs.length) return;

    const W = hero.clientWidth || innerWidth, H = hero.clientHeight || innerHeight;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(new THREE.Color('#0e0d0b'), 6.5, 21);
    const camera = new THREE.PerspectiveCamera(44, W / H, 0.1, 100);
    camera.position.set(0, 0, 16);

    const loader = new THREE.TextureLoader();
    const aniso = renderer.capabilities.getMaxAnisotropy
      ? renderer.capabilities.getMaxAnisotropy() : 1;
    const texCache = new Map();
    const loadTex = (url) => {
      if (texCache.has(url)) return texCache.get(url);
      const t = loader.load(url);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = aniso;
      texCache.set(url, t);
      return t;
    };

    const R = 9.2, rows = [-3.4, -1.13, 1.13, 3.4], N = 11;
    const ph = 1.92;             // plane height in world units; width follows aspect

    // Resolve each image's true aspect once, then size EVERY plane that shows it
    // to ph·(w/h) so the picture is never skewed (textures are shared, so the
    // scale must live on the mesh, not the texture).
    const meshes = [];
    const meshesByUrl = new Map();
    const arCache = new Map();
    const sizeMeshes = (url, ar) => {
      (meshesByUrl.get(url) || []).forEach((m) => { m.userData.baseScaleX = ph * ar; });
    };
    const resolveAspect = (url) => {
      if (arCache.has(url)) { sizeMeshes(url, arCache.get(url)); return; }
      const probe = new Image();
      probe.onload = () => {
        const ar = (probe.naturalWidth && probe.naturalHeight)
          ? probe.naturalWidth / probe.naturalHeight : 1;
        arCache.set(url, ar);
        sizeMeshes(url, ar);
      };
      probe.src = url;
    };

    let slot = 0;
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < N; c++) {
        const theta = (c / N) * Math.PI * 2 + (r % 2 ? Math.PI / N : 0);
        const url = imgs[slot % imgs.length]; slot++;
        const geo = new THREE.PlaneGeometry(1, ph); // unit width; scaled per image
        const mat = new THREE.MeshBasicMaterial({ map: loadTex(url), transparent: true, opacity: 0 });
        mat.color.setScalar(0.68);
        const m = new THREE.Mesh(geo, mat);
        // theta0 is the card's base angle on the ring; it's positioned and
        // billboarded toward the camera every frame (see animate) so the picture
        // always faces the viewer head-on — no perspective skew.
        m.position.set(R * Math.sin(theta), rows[r], R * Math.cos(theta));
        m.userData = { src: url, theta0: theta, baseY: rows[r], phase: Math.random() * 6.28,
                       curScale: 1, tColor: 0.68, cColor: 0.68, baseScaleX: ph };
        if (!meshesByUrl.has(url)) meshesByUrl.set(url, []);
        meshesByUrl.get(url).push(m);
        scene.add(m); meshes.push(m);
      }
    }
    meshesByUrl.forEach((_, url) => resolveAspect(url));

    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2(10, 10);
    let hover = null, tx = 0, ty = 0, drag = false, lastX = 0, dragVel = 0, moved = false;
    const IDLE = reduceMotion ? 0 : 0.0008, MAXSPIN = 0.0032, DRAG_GAIN = 0.00010;

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      tx = x - 0.5; ty = y - 0.5;
      ndc.x = x * 2 - 1; ndc.y = -(y * 2 - 1);
      if (drag) { dragVel += (e.clientX - lastX) * DRAG_GAIN; lastX = e.clientX; moved = true; }
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', (e) => { drag = true; lastX = e.clientX; moved = false; });
    canvas.addEventListener('pointerup', () => {
      drag = false;
      if (hover && !moved) openInLightbox(hover.userData.src);
    });
    canvas.addEventListener('pointerleave', () => { drag = false; ndc.set(10, 10); });

    let camZ = 16, spin = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      dragVel *= 0.96;
      let rot = IDLE + dragVel;
      rot = Math.max(-MAXSPIN, Math.min(MAXSPIN, rot));
      spin += rot;
      camZ += (13.6 - camZ) * 0.035;
      camera.position.x += (tx * 2.4 - camera.position.x) * 0.06;
      camera.position.y += (-ty * 1.4 - camera.position.y) * 0.06;
      camera.position.z = camZ;
      camera.lookAt(0, 0, 0);
      const op = glEntered ? 1 : 0;
      let pick = null;
      if (ndc.x < 1.5) {
        ray.setFromCamera(ndc, camera);
        const hits = ray.intersectObjects(meshes, false);
        if (hits.length) pick = hits[0].object;
      }
      if (pick !== hover) { hover = pick; }
      meshes.forEach((m) => {
        const u = m.userData;
        const a = u.theta0 + spin;
        const bob = reduceMotion ? 0 : Math.sin(t * 0.7 + u.phase) * 0.07;
        m.position.set(R * Math.sin(a), u.baseY + bob, R * Math.cos(a));
        // billboard: a Mesh's lookAt aims its textured +z face at the target, so
        // aim it straight at the camera — every card is a flat, unskewed rectangle.
        m.lookAt(camera.position);
        const target = (m === hover) ? 1.16 : 1;
        u.curScale += (target - u.curScale) * 0.12;
        m.scale.x = u.baseScaleX * u.curScale;
        m.scale.y = u.curScale;
        u.tColor = (m === hover) ? 1.0 : 0.68;
        u.cColor += (u.tColor - u.cColor) * 0.12;
        m.material.color.setScalar(u.cColor);
        m.material.opacity += (op - m.material.opacity) * 0.05;
      });
      renderer.render(scene, camera);
      gl.raf = requestAnimationFrame(animate);
    };
    gl = { renderer, scene, camera, meshes };
    animate();

    addEventListener('resize', () => {
      const w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    });
  }

  /* Bridge a hero-wall click to the gallery's existing lightbox: find the tile
     whose image matches and click it, so script.js owns the expanded view.
     Falls back to scrolling the image into view if its tile isn't placed yet. */
  function openInLightbox(src) {
    const file = decodeURIComponent(src.replace(/^content\/media\//, ''));
    const tiles = document.querySelectorAll('#mosaic .tile');
    for (const tile of tiles) {
      const img = tile.querySelector('img');
      if (img && decodeURIComponent(img.getAttribute('src') || '').indexOf(file) !== -1) {
        tile.click();
        return;
      }
    }
    if (galWrap) galWrap.scrollTo({ top: hero ? hero.offsetHeight : 0, behavior: 'smooth' });
  }

  /* ── boot ── */
  function boot() {
    initChrome();
    initCursor();
    runLoader();
    waitThree(0);
    // never strand the hero hidden if the loader callback is lost
    setTimeout(() => document.body.classList.add('ready'), 4200);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

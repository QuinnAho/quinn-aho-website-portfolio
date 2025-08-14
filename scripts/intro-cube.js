// scripts/intro-cube.js
(() => {
  const SNAP_DURATION_MS = 600;
  const EASE = t => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);

  const container = document.querySelector('.cube-wrap');
  const canvas = document.getElementById('intro-cube');
  if (!container || !canvas) return;

  function start() {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4);
    scene.add(camera);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 0.7);
    key.position.set(2, 3, 4);
    scene.add(key);

    // Helper: draw an emoji silhouette in white for use as an emissive map
    function makeEmojiTexture(emoji) {
      const size = 256;
      const cvs = document.createElement('canvas');
      cvs.width = cvs.height = size;
      const ctx = cvs.getContext('2d');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = size * 0.7 + 'px serif';
      // Draw emoji normally
      ctx.fillText(emoji, size / 2, size / 2);
      // Recolor to white while keeping transparency
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(cvs);
    }

    // Icons for each face of the cube (BoxGeometry order: right, left, top, bottom, front, back)
    const faceIcons = ['🎓', '📁', '💼', '✉️', '🏠', '🛠️'];
    const materials = faceIcons.map(icon => new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.4,
      metalness: 0.0,
      emissive: 0xffffff,
      emissiveMap: makeEmojiTexture(icon)
    }));

    const cube = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), materials);
    scene.add(cube);

    // --- Overall size + hover grow ---
    const BASE_SCALE = 0.85;            // smaller overall (tweak 0.8–0.9 if you want)
    let targetScale = BASE_SCALE;
    let currentScale = BASE_SCALE;

    canvas.addEventListener('pointerenter', () => { targetScale = BASE_SCALE * 1.07; });
    canvas.addEventListener('pointerleave', () => { targetScale = BASE_SCALE; });

    function resize() {
      const w = container.clientWidth;
      const h = container.clientHeight || Math.max(300, w);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    // Pointer drag rotate
    let dragging = false;
    let lastX = 0, lastY = 0;
    let snapping = false;
    let snapAbort = false;

    canvas.addEventListener('pointerdown', (e) => {
      if (snapping) snapAbort = true;
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      cube.rotation.y += dx * 0.01;
      cube.rotation.x += dy * 0.01;
    });
    function endPointer(e) {
      if (!dragging) return;
      dragging = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
      snapToGrid();
    }
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);
    canvas.addEventListener('lostpointercapture', () => { dragging = false; });

    // Snap helpers
    const faceCount = 6; // [front,right,back,left,top,bottom]
    function faceIndexToAngles(i) {
      switch (i % faceCount) {
        case 0: return { x: 0, y: 0 };
        case 1: return { x: 0, y: Math.PI / 2 };
        case 2: return { x: 0, y: Math.PI };
        case 3: return { x: 0, y: -Math.PI / 2 };
        case 4: return { x: -Math.PI / 2, y: 0 };
        case 5: return { x: Math.PI / 2,  y: 0 };
      }
    }
    function faceIndexFromAngles(x, y) {
      const px = Math.round(wrapPi(x) / (Math.PI / 2));
      const py = Math.round(wrapPi(y) / (Math.PI / 2));
      if (px === -1) return 4;
      if (px === 1)  return 5;
      const m = ((py % 4) + 4) % 4;
      return [0,1,2,3][m];
    }

    function snapToGrid() {
      const curX = wrapPi(cube.rotation.x);
      const curY = wrapPi(cube.rotation.y);
      const pitchCandidates = [-Math.PI/2, 0, Math.PI/2];
      const targetX = nearestAngle(curX, pitchCandidates);
      const quarter = Math.PI / 2;
      const k = Math.round(curY / quarter);
      const targetY = curY + shortAngleDelta(curY, k * quarter);
      animateSnap(curX, targetX, curY, targetY, () => {
        const idx = faceIndexFromAngles(cube.rotation.x, cube.rotation.y);
        if (typeof window.onIntroCubeSnap === 'function') {
          window.onIntroCubeSnap(idx);
        }
      });
    }

    function animateSnap(x0, x1, y0, y1, onDone) {
      const t0 = performance.now();
      snapping = true;
      snapAbort = false;
      function step(now) {
        if (snapAbort) { snapping = false; return; }
        const raw = (now - t0) / SNAP_DURATION_MS;
        const t = raw >= 1 ? 1 : EASE(raw);
        cube.rotation.x = x0 + shortAngleDelta(x0, x1) * t;
        cube.rotation.y = y0 + shortAngleDelta(y0, y1) * t;
        if (raw < 1) requestAnimationFrame(step);
        else { snapping = false; onDone && onDone(); }
      }
      requestAnimationFrame(step);
    }

    // Public API
    window.setIntroCubeFace = function(index) {
      const curX = wrapPi(cube.rotation.x);
      const curY = wrapPi(cube.rotation.y);
      const tgt = faceIndexToAngles(index);
      animateSnap(curX, tgt.x, curY, tgt.y);
    };

    // Utils
    function wrapPi(a) {
      a = (a + Math.PI) % (2 * Math.PI);
      if (a < 0) a += 2 * Math.PI;
      return a - Math.PI;
    }
    function shortAngleDelta(a, b) {
      let d = wrapPi(b) - wrapPi(a);
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      return d;
    }
    function nearestAngle(a, candidates) {
      let best = candidates[0], bestAbs = Infinity;
      for (const c of candidates) {
        const d = Math.abs(shortAngleDelta(a, c));
        if (d < bestAbs) { bestAbs = d; best = c; }
      }
      return best;
    }

    // Render loop
    (function tick() {
      // ease the scale toward target
      currentScale += (targetScale - currentScale) * 0.12;
      cube.scale.setScalar(currentScale);

      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    })();
  }

  if (window.THREE) start();
  else {
    const iv = setInterval(() => { if (window.THREE) { clearInterval(iv); start(); } }, 50);
  }
})();

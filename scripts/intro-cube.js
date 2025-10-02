// scripts/intro-cube.js
(() => {
  const SNAP_DURATION_MS = 600;
  const EASE = t => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);
  const HALF_PI = Math.PI / 2;

  const container = document.querySelector('.cube-wrap');
  const canvas = document.getElementById('intro-cube');
  if (!container || !canvas) return;

  // Face rotations (index maps to page icons)
  const FACE_ROTATIONS = [
    { x: 0, y: 0 },           // 0: front
    { x: 0, y: HALF_PI },     // 1: right
    { x: 0, y: Math.PI },     // 2: back
    { x: 0, y: -HALF_PI },    // 3: left
    { x: -HALF_PI, y: 0 },    // 4: top
    { x: HALF_PI, y: 0 }      // 5: bottom
  ];

  async function start() {
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

    // Load icon texture
    function loadIconTexture(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const size = 512;
          const cvs = document.createElement('canvas');
          cvs.width = cvs.height = size;
          const ctx = cvs.getContext('2d');
          const scale = 0.6 * size / Math.max(img.width, img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
          resolve(new THREE.CanvasTexture(cvs));
        };
        img.onerror = reject;
        img.src = url;
      });
    }

    // Icons for each face (BoxGeometry order: right, left, top, bottom, front, back)
    const iconPaths = [
      'media/icons/contact.svg',
      'media/icons/projects.svg',
      'media/icons/experience.svg',
      'media/icons/education.svg',
      'media/icons/home.svg',
      'media/icons/skills.svg'
    ];

    const textures = await Promise.all(iconPaths.map(loadIconTexture));
    const materials = textures.map(tex => new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.4,
      metalness: 0.0,
      emissive: 0xffffff,
      emissiveMap: tex,
      transparent: true
    }));

    const cube = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), materials);
    scene.add(cube);

    // Scale and hover
    const BASE_SCALE = 0.85;
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

    // Drag state
    let dragging = false;
    let lastX = 0, lastY = 0;
    let snapping = false;
    let snapAbort = false;

    canvas.addEventListener('pointerdown', (e) => {
      if (snapping) snapAbort = true;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
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

    // Angle utilities
    function normalizeAngle(a) {
      a = (a + Math.PI) % (2 * Math.PI);
      if (a < 0) a += 2 * Math.PI;
      return a - Math.PI;
    }

    function shortestDelta(from, to) {
      let d = normalizeAngle(to) - normalizeAngle(from);
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      return d;
    }

    function nearestAngle(current, candidates) {
      let best = candidates[0];
      let minDist = Infinity;
      for (const c of candidates) {
        const dist = Math.abs(shortestDelta(current, c));
        if (dist < minDist) {
          minDist = dist;
          best = c;
        }
      }
      return best;
    }

    function getFaceFromRotation(x, y) {
      const nx = normalizeAngle(x);
      const ny = normalizeAngle(y);
      const px = Math.round(nx / HALF_PI);
      const py = Math.round(ny / HALF_PI);

      if (px === -1) return 4;      // top
      if (px === 1) return 5;       // bottom

      const m = ((py % 4) + 4) % 4;
      return [0, 1, 2, 3][m];       // front, right, back, left
    }

    function snapToGrid() {
      const curX = normalizeAngle(cube.rotation.x);
      const curY = normalizeAngle(cube.rotation.y);

      const targetX = nearestAngle(curX, [-HALF_PI, 0, HALF_PI]);
      const targetY = curY + shortestDelta(curY, Math.round(curY / HALF_PI) * HALF_PI);

      animateSnap(curX, targetX, curY, targetY, () => {
        const faceIndex = getFaceFromRotation(cube.rotation.x, cube.rotation.y);
        window.onIntroCubeSnap?.(faceIndex);
      });
    }

    function animateSnap(x0, x1, y0, y1, onDone) {
      const t0 = performance.now();
      snapping = true;
      snapAbort = false;

      function step(now) {
        if (snapAbort) {
          snapping = false;
          return;
        }
        const raw = (now - t0) / SNAP_DURATION_MS;
        const t = raw >= 1 ? 1 : EASE(raw);
        cube.rotation.x = x0 + shortestDelta(x0, x1) * t;
        cube.rotation.y = y0 + shortestDelta(y0, y1) * t;
        if (raw < 1) {
          requestAnimationFrame(step);
        } else {
          snapping = false;
          onDone?.();
        }
      }
      requestAnimationFrame(step);
    }

    // Public API
    window.setIntroCubeFace = function(faceIndex) {
      const rotation = FACE_ROTATIONS[faceIndex];
      if (!rotation) return;

      const curX = normalizeAngle(cube.rotation.x);
      const curY = normalizeAngle(cube.rotation.y);
      animateSnap(curX, rotation.x, curY, rotation.y);
    };

    // Render loop
    (function tick() {
      currentScale += (targetScale - currentScale) * 0.12;
      cube.scale.setScalar(currentScale);
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    })();
  }

  if (window.THREE) {
    start();
  } else {
    const checkInterval = setInterval(() => {
      if (window.THREE) {
        clearInterval(checkInterval);
        start();
      }
    }, 50);
  }
})();

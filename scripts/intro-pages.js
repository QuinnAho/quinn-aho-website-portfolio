(() => {
  const scroller     = document.getElementById('intro-pages');
  const introBottom  = document.querySelector('.intro-bottom');
  if (!scroller || !introBottom) return;

  // --- Pages & helpers ---
  const pages = Array.from(scroller.querySelectorAll('.page'));
  const PAGE_COUNT   = pages.length;
  const PAGE_STEP_MS = 600;
  const UNDERLINE_MS = 520; // keep in sync with CSS transition

  function pageWidth()   { return scroller.clientWidth; }
  function currentIndex(){ return Math.round(scroller.scrollLeft / pageWidth()); }

  // --- Cube face mapping ---
  // DOM order: 0: Home, 1: Education, 2: Skills, 3: Projects, 4: Experience, 5: Contact
  const pageToFace = { 1:0, 2:1, 3:2, 4:3, 5:4 };
  const faceToPage = Object.fromEntries(Object.entries(pageToFace).map(([p,f]) => [f, Number(p)]));

  let syncing     = false; // programmatic scroll guard
  let paging      = false; // wheel debounce
  let lastActive  = 0;     // current active page index
  let lastScrollX = 0;     // for dir-left/dir-right

  function toggleDirClasses(dirRight){
    scroller.classList.toggle('dir-right', dirRight);
    scroller.classList.toggle('dir-left',  !dirRight);
  }

  function setActive(nextIdx, dirRight){
    if (nextIdx === lastActive) return;

    // LEAVING page: remove active, then add directional leaving class for fade-out
    const leaving = pages[lastActive];
    if (leaving) {
      leaving.classList.remove('active', 'pre-activate', 'leaving-left', 'leaving-right');
      leaving.classList.add(dirRight ? 'leaving-right' : 'leaving-left');
      // cleanup after animation finishes
      setTimeout(() => {
        leaving.classList.remove('leaving-left', 'leaving-right');
      }, UNDERLINE_MS + 60);
    }

    // ENTERING page: set direction, ensure it's in starting state, then activate next frame
    toggleDirClasses(dirRight);
    const entering = pages[nextIdx];
    if (entering) {
      entering.classList.remove('active', 'leaving-left', 'leaving-right');
      entering.classList.add('pre-activate');   // make sure it starts hidden
      // force a reflow so the browser registers pre-activate state
      void entering.offsetWidth;
      // next frame: flip to active -> triggers fade IN
      requestAnimationFrame(() => {
        entering.classList.remove('pre-activate');
        entering.classList.add('active');
      });
    }

    // Update cube (Home index 0 does not affect cube)
    if (nextIdx !== 0 && typeof window.setIntroCubeFace === 'function') {
      const face = pageToFace[nextIdx];
      if (typeof face === 'number') window.setIntroCubeFace(face);
    }

    lastActive = nextIdx;
  }

  function goToPage(index){
    const clamped = Math.max(0, Math.min(PAGE_COUNT - 1, index));
    const dirRight = clamped > lastActive;
    const x = clamped * pageWidth();

    syncing = true;
    scroller.scrollTo({ left: x, behavior: 'smooth' });
    setActive(clamped, dirRight);
    setTimeout(() => (syncing = false), PAGE_STEP_MS + 120);
  }

  window.goToIntroPage = goToPage;

  // --- Cube -> Pages (external hook from cube) ---
  window.onIntroCubeSnap = function(faceIndex){
    const pageIndex = faceToPage[faceIndex];
    if (typeof pageIndex === 'number') goToPage(pageIndex);
  };

  // --- Pages -> Cube & underline direction tracking ---
  let rafId = null;
  scroller.addEventListener('scroll', () => {
    const dirRight = scroller.scrollLeft > lastScrollX;
    toggleDirClasses(dirRight);
    lastScrollX = scroller.scrollLeft;

    if (syncing) return;

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const idx = currentIndex();
      if (idx !== lastActive) {
        setActive(idx, dirRight);
      }
      // Optional: keep cube aligned while dragging (except for Home)
      if (idx !== 0 && typeof window.setIntroCubeFace === 'function') {
        const face = pageToFace[idx];
        if (typeof face === 'number') window.setIntroCubeFace(face);
      }
    });
  });

  // --- Vertical wheel -> horizontal paging (bottom area only) ---
  introBottom.addEventListener('wheel', (e) => {
    const delta = e.deltaY;
    const idx   = currentIndex();

    if (paging) { e.preventDefault(); return; }

    if (delta > 0 && idx < PAGE_COUNT - 1) {
      e.preventDefault(); paging = true; goToPage(idx + 1);
      setTimeout(() => (paging = false), PAGE_STEP_MS);
    } else if (delta < 0 && idx > 0) {
      e.preventDefault(); paging = true; goToPage(idx - 1);
      setTimeout(() => (paging = false), PAGE_STEP_MS);
    }
  }, { passive: false });

  // Keep alignment on resize
  window.addEventListener('resize', () => {
    const idx = currentIndex();
    scroller.scrollLeft = idx * pageWidth();
  }, { passive: true });

  // Init: mark page 0 active so its underline animates on first scroll
  pages.forEach((p,i)=>p.classList.toggle('active', i===0));
  scroller.classList.add('dir-right'); // default wipe direction
})();

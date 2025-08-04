(() => {
  const scroller = document.getElementById('intro-pages');
  const introBottom = document.querySelector('.intro-bottom');
  if (!scroller || !introBottom) return;

  // PAGE order in DOM:
  // 0: Home (ignored for cube)
  // 1: Education, 2: Skills, 3: Projects, 4: Experience, 5: Contact

  // Map pages -> cube faces (adjust if your cube uses a different face order)
  const pageToFace = {
    1: 0, // Education  -> front
    2: 1, // Skills     -> right
    3: 2, // Projects   -> back
    4: 3, // Experience -> left
    5: 4  // Contact    -> top (or choose bottom=5 if you want)
  };

  // Inverse map (cube -> pages)
  const faceToPage = Object.fromEntries(
    Object.entries(pageToFace).map(([p, f]) => [f, Number(p)])
  );

  const PAGE_COUNT = [...scroller.children].filter(el => el.classList.contains('page')).length;
  let syncing = false;
  let paging = false;
  const PAGE_STEP_MS = 600;

  const pageWidth = () => scroller.clientWidth;
  const currentIndex = () => Math.round(scroller.scrollLeft / pageWidth());

  function goToPage(index) {
    const clamped = Math.max(0, Math.min(PAGE_COUNT - 1, index));
    const x = clamped * pageWidth();
    syncing = true;
    scroller.scrollTo({ left: x, behavior: 'smooth' });
    setTimeout(() => (syncing = false), PAGE_STEP_MS + 100);
  }

  // Cube -> Pages (cube calls this after snap)
  window.onIntroCubeSnap = function(faceIndex) {
    const pageIndex = faceToPage[faceIndex];
    if (typeof pageIndex === 'number') {
      goToPage(pageIndex); // never goes to Home since Home isn't in faceToPage
    }
  };

  // Pages -> Cube (after horizontal scroll settles)
  let scrollTO = null;
  function onScrollSettled() {
    const idx = currentIndex();
    if (idx === 0) return; // Home does not affect cube
    const face = pageToFace[idx];
    if (typeof face === 'number' && typeof window.setIntroCubeFace === 'function') {
      window.setIntroCubeFace(face);
    }
  }
  scroller.addEventListener('scroll', () => {
    if (syncing) return;
    clearTimeout(scrollTO);
    scrollTO = setTimeout(onScrollSettled, 120);
  });

  // Maintain snapping on resize
  window.addEventListener('resize', () => {
    const idx = currentIndex();
    scroller.scrollLeft = idx * pageWidth();
  }, { passive: true });

  // Vertical wheel → horizontal paging (only over the bottom region)
  introBottom.addEventListener('wheel', (e) => {
    const delta = e.deltaY;
    const idx = currentIndex();

    if (paging) { e.preventDefault(); return; }

    if (delta > 0) {
      if (idx < PAGE_COUNT - 1) {
        e.preventDefault();
        paging = true;
        goToPage(idx + 1);
        setTimeout(() => (paging = false), PAGE_STEP_MS);
      }
    } else if (delta < 0) {
      if (idx > 0) {
        e.preventDefault();
        paging = true;
        goToPage(idx - 1);
        setTimeout(() => (paging = false), PAGE_STEP_MS);
      }
    }
  }, { passive: false });
})();

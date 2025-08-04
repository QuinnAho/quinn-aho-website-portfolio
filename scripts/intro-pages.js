// scripts/intro-pages.js
(() => {
  const scroller = document.getElementById('intro-pages');
  const introBottom = document.querySelector('.intro-bottom');
  if (!scroller || !introBottom) return;

  const PAGE_COUNT = scroller.children.length; // pages in markup
  let syncing = false;     // prevents feedback loops between cube <-> pages
  let paging = false;      // debounce per page step
  const PAGE_STEP_MS = 600;

  function pageWidth() { return scroller.clientWidth; }
  function currentIndex() { return Math.round(scroller.scrollLeft / pageWidth()); }

  function goToPage(index) {
    const clamped = Math.max(0, Math.min(PAGE_COUNT - 1, index));
    const x = clamped * pageWidth();
    syncing = true;
    scroller.scrollTo({ left: x, behavior: 'smooth' });
    setTimeout(() => (syncing = false), PAGE_STEP_MS + 100);
  }

  // Cube -> Pages
  window.onIntroCubeSnap = function(faceIndex) {
    // If you only want the 4 side faces to map, remap here.
    goToPage(faceIndex);
  };

  // Pages -> Cube (on scroll)
  let rafId = null;
  scroller.addEventListener('scroll', () => {
    if (syncing) return;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const idx = currentIndex();
      if (typeof window.setIntroCubeFace === 'function') {
        window.setIntroCubeFace(idx);
      }
    });
  });

  // Page snapping on resize
  window.addEventListener('resize', () => {
    const idx = currentIndex();
    scroller.scrollLeft = idx * pageWidth();
  }, { passive: true });

  // ---- Wheel bridging: vertical wheel -> horizontal paging ----
  // We only intercept wheel when the pointer is over the bottom half (introBottom).
  introBottom.addEventListener('wheel', (e) => {
    // Only hijack when fully within the intro bottom region
    // If you want even stricter control, check bounding rect and pointer coords.
    const delta = e.deltaY;
    const idx = currentIndex();

    // If we're mid paging, ignore extra wheel deltas
    if (paging) { e.preventDefault(); return; }

    if (delta > 0) {
      // scrolling down -> go right if not at last page, else let it bubble (default)
      if (idx < PAGE_COUNT - 1) {
        e.preventDefault();
        paging = true;
        goToPage(idx + 1);
        setTimeout(() => (paging = false), PAGE_STEP_MS);
      } // else: at last page: allow default to continue page scroll downward
    } else if (delta < 0) {
      // scrolling up -> go left if not at first page, else let it bubble (default)
      if (idx > 0) {
        e.preventDefault();
        paging = true;
        goToPage(idx - 1);
        setTimeout(() => (paging = false), PAGE_STEP_MS);
      } // else: at first page: allow default to scroll up to hero
    }
  }, { passive: false }); // passive: false is required to call preventDefault()
})();

(() => {
  const scroller = document.getElementById('intro-pages');
  const introBottom = document.querySelector('.intro-bottom');
  if (!scroller || !introBottom) return;

  const pages = Array.from(scroller.querySelectorAll('.page'));
  const PAGE_COUNT = pages.length;
  const PAGE_STEP_MS = 600;
  const UNDERLINE_MS = 520;

  // Page-to-cube-face mapping
  // Pages: 0=Home, 1=Education, 2=Skills, 3=Projects, 4=Experience, 5=Contact
  const PAGE_TO_FACE = [3, 4, 5, 1, 2, 0];
  const FACE_TO_PAGE = PAGE_TO_FACE.reduce((acc, face, page) => {
    acc[face] = page;
    return acc;
  }, {});

  let syncing = false;
  let paging = false;
  let lastActive = 0;
  let lastScrollX = 0;

  const pageWidth = () => scroller.clientWidth;
  const currentIndex = () => Math.round(scroller.scrollLeft / pageWidth());

  function setScrollDirection(isRight) {
    scroller.classList.toggle('dir-right', isRight);
    scroller.classList.toggle('dir-left', !isRight);
  }

  function updateCubeFace(pageIndex) {
    const face = PAGE_TO_FACE[pageIndex];
    if (face !== undefined && window.setIntroCubeFace) {
      window.setIntroCubeFace(face);
    }
  }

  function setActivePage(nextIdx, isMovingRight) {
    if (nextIdx === lastActive) return;

    const leaving = pages[lastActive];
    if (leaving) {
      leaving.classList.remove('active', 'pre-activate', 'leaving-left', 'leaving-right');
      leaving.classList.add(isMovingRight ? 'leaving-right' : 'leaving-left');
      setTimeout(() => leaving.classList.remove('leaving-left', 'leaving-right'), UNDERLINE_MS + 60);
    }

    setScrollDirection(isMovingRight);

    const entering = pages[nextIdx];
    if (entering) {
      entering.classList.remove('active', 'leaving-left', 'leaving-right');
      entering.classList.add('pre-activate');
      void entering.offsetWidth; // Force reflow
      requestAnimationFrame(() => {
        entering.classList.remove('pre-activate');
        entering.classList.add('active');
      });
    }

    updateCubeFace(nextIdx);
    lastActive = nextIdx;
  }

  function goToPage(index) {
    const clamped = Math.max(0, Math.min(PAGE_COUNT - 1, index));
    const isMovingRight = clamped > lastActive;

    syncing = true;
    scroller.scrollTo({ left: clamped * pageWidth(), behavior: 'smooth' });
    setActivePage(clamped, isMovingRight);
    setTimeout(() => (syncing = false), PAGE_STEP_MS + 120);
  }

  window.goToIntroPage = goToPage;

  // Cube snap callback
  window.onIntroCubeSnap = (faceIndex) => {
    const pageIndex = FACE_TO_PAGE[faceIndex];
    if (pageIndex !== undefined) goToPage(pageIndex);
  };

  // Scroll tracking
  let scrollRaf = null;
  scroller.addEventListener('scroll', () => {
    const isMovingRight = scroller.scrollLeft > lastScrollX;
    setScrollDirection(isMovingRight);
    lastScrollX = scroller.scrollLeft;

    if (syncing) return;

    if (scrollRaf) cancelAnimationFrame(scrollRaf);
    scrollRaf = requestAnimationFrame(() => {
      const idx = currentIndex();
      if (idx !== lastActive) {
        setActivePage(idx, isMovingRight);
      }
    });
  });

  // Wheel navigation
  introBottom.addEventListener('wheel', (e) => {
    if (paging) {
      e.preventDefault();
      return;
    }

    const idx = currentIndex();
    const delta = e.deltaY;

    if (delta > 0 && idx < PAGE_COUNT - 1) {
      e.preventDefault();
      paging = true;
      goToPage(idx + 1);
      setTimeout(() => (paging = false), PAGE_STEP_MS);
    } else if (delta < 0 && idx > 0) {
      e.preventDefault();
      paging = true;
      goToPage(idx - 1);
      setTimeout(() => (paging = false), PAGE_STEP_MS);
    }
  }, { passive: false });

  // Resize alignment
  window.addEventListener('resize', () => {
    scroller.scrollLeft = currentIndex() * pageWidth();
  }, { passive: true });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const onIntroSection = window.scrollY >= window.innerHeight * 0.5;
    const sheetOpen = document.querySelector('.detail-sheet.open');

    if (!onIntroSection || sheetOpen) return;

    const idx = currentIndex();

    if (e.key === 'ArrowRight' && idx < PAGE_COUNT - 1) {
      e.preventDefault();
      goToPage(idx + 1);
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      goToPage(idx - 1);
    }
  });

  // Initialize
  pages.forEach((p, i) => p.classList.toggle('active', i === 0));
  updateCubeFace(0);
  scroller.classList.add('dir-right');
})();

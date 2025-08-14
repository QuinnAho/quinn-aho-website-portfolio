(() => {
  function openSheetById(id) {
    const sheet = document.getElementById(id);
    if (!sheet) return;
    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('sheet-open');
  }

  function closeSheet(sheet) {
    if (!sheet) return;
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.detail-sheet.open')) {
      document.documentElement.classList.remove('sheet-open');
    }
  }

  window.openDetailSheet = openSheetById;

  // Delegate clicks: open with up arrow, close with down arrow or backdrop click
  document.addEventListener('click', (e) => {
    const openBtn = e.target.closest('.page-up-arrow');
    if (openBtn) {
      e.preventDefault();
      openSheetById(openBtn.dataset.target);
      return;
    }

    const closeBtn = e.target.closest('.sheet-close');
    if (closeBtn) {
      e.preventDefault();
      closeSheet(closeBtn.closest('.detail-sheet'));
      return;
    }

    // Click backdrop (outside .sheet-content) closes
    const sheet = e.target.closest('.detail-sheet');
    if (sheet && e.target === sheet) {
      closeSheet(sheet);
    }
  });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const open = document.querySelector('.detail-sheet.open');
      if (open) closeSheet(open);
    }
  });
})();

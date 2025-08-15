(() => {
  const body = document.body;
  const toggle = document.querySelector('.side-nav-toggle');
  const arrow = document.querySelector('.side-nav-arrow');
  const sideNav = document.querySelector('.side-nav');
  let pinned = false;

  if (toggle) {
    toggle.addEventListener('click', e => {
      e.stopPropagation();
      pinned = !pinned;
      body.classList.toggle('side-nav-open', pinned);
      toggle.setAttribute('aria-expanded', pinned);
      toggle.innerHTML = pinned ? '\u25C0' : '\u25B6';
      if (!pinned) body.classList.remove('side-nav-hover');
    });
  }

  if (arrow && sideNav) {
    arrow.addEventListener('mouseenter', () => {
      if (!pinned) body.classList.add('side-nav-hover');
    });

    sideNav.addEventListener('mouseleave', () => {
      if (!pinned) body.classList.remove('side-nav-hover');
    });

    document.addEventListener('mousemove', e => {
      if (pinned) return;
      if (sideNav.contains(e.target)) {
        body.classList.add('side-nav-hover');
      } else if (!arrow.contains(e.target)) {
        body.classList.remove('side-nav-hover');
      }
    });
  }
})();


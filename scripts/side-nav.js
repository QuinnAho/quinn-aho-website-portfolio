(() => {
  const body = document.body;
  const toggle = document.querySelector('.side-nav-toggle');
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

  document.addEventListener('mousemove', e => {
    if (pinned) return;
    if (e.clientX < window.innerWidth / 4) {
      body.classList.add('side-nav-hover');
    } else {
      body.classList.remove('side-nav-hover');
    }
  });
})();


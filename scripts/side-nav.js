(() => {
  const body = document.body;
  const toggle = document.querySelector('.side-nav-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    const open = body.classList.toggle('side-nav-open');
    toggle.setAttribute('aria-expanded', open);
    toggle.innerHTML = open ? '\u25C0' : '\u25B6';
  });
})();


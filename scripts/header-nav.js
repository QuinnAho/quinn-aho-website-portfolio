(() => {
  const intro = document.getElementById('intro');
  const links = document.querySelectorAll('.nav-links a');
  const pageMap = {
    education: 1,
    skills: 2,
    projects: 3,
    experience: 4,
    contact: 5
  };

  links.forEach(link => {
    link.addEventListener('click', e => {
      const target = link.getAttribute('href').slice(1);
      if (!target) return;
      e.preventDefault();
      if (intro) intro.scrollIntoView({ behavior: 'smooth' });
      if (typeof window.goToIntroPage === 'function' && pageMap[target] != null) {
        window.goToIntroPage(pageMap[target]);
      }
      if (typeof window.openDetailSheet === 'function') {
        window.openDetailSheet(`${target}-details`);
      }
    });
  });
})();

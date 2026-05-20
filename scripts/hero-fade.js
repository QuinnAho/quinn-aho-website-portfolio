/**
 * Fade the hero background (fluid sim canvas + intro cube) as the user scrolls
 * past the first viewport. The fluid sim is gorgeous in the hero and busy
 * everywhere else; this confines it to the first screen.
 *
 * Implementation: read scrollY against viewport height, map to opacity in
 * [1.0 → 0.0] across the first 80% of the viewport, and toggle pointer-events
 * off so the canvases don't intercept clicks once they're invisible.
 */
(() => {
  const heroBg = document.querySelector('.hero-bg');
  if (!heroBg) return;

  const FADE_END_RATIO = 0.8; // fully faded by 80% of one viewport scrolled

  let ticking = false;

  function update() {
    const vh = window.innerHeight || 1;
    const fadeDistance = vh * FADE_END_RATIO;
    const y = window.scrollY || window.pageYOffset || 0;
    const t = Math.min(1, Math.max(0, y / fadeDistance));
    const opacity = 1 - t;
    heroBg.style.opacity = opacity.toFixed(3);
    heroBg.style.pointerEvents = opacity < 0.05 ? 'none' : '';
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();

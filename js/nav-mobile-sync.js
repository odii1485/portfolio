/**
 * Ensures mobile nav links exist before React-Bits modules load (services page fix).
 */
(function () {
  function ensureMobileNavLinks() {
    if (!window.matchMedia('(max-width: 768px)').matches) return;

    const cardNav = document.querySelector('.nav-links .card-nav');
    if (!cardNav?.querySelector('.card-nav-link')) return;

    document.body.classList.add('nav-menu-fallback');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureMobileNavLinks);
  } else {
    ensureMobileNavLinks();
  }

  window.addEventListener('load', ensureMobileNavLinks);
})();

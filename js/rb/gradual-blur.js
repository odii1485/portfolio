/** Gradual blur on section headings — react-bits inspired reveal */

const HEADING_SEL =
  '.big-heading, .section-top h2, .service-title, .services-hero-inner h1, #about .big-heading';

export function initGradualBlur() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll(HEADING_SEL).forEach((h) => {
    if (h.classList.contains('gradual-blur-heading')) return;
    h.classList.add('gradual-blur-heading');

    if (h.classList.contains('reveal')) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('gb-visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    obs.observe(h);
  });
}

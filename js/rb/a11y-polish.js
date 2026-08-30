/** Phase 7 — A11y, performance, and polish */

export function initA11yPolish() {
  applyReducedMotionMode();
  injectSkipLink();
  enhanceFocusVisibility();
  pauseOffscreenVideos();
  fixCalendlyAccent();
  lazyLoadBelowFoldImages();
}

function applyReducedMotionMode() {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const apply = () => {
    document.documentElement.classList.toggle('rb-reduced-motion', mq.matches);
  };
  apply();
  mq.addEventListener('change', apply);
}

function injectSkipLink() {
  if (document.getElementById('skip-to-content')) return;
  const link = document.createElement('a');
  link.id = 'skip-to-content';
  link.href = '#hero';
  link.className = 'skip-to-content';
  link.textContent = 'Skip to main content';
  link.addEventListener('click', (e) => {
    const target = document.getElementById('hero');
    if (!target) return;
    e.preventDefault();
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: false });
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.body.prepend(link);
}

function enhanceFocusVisibility() {
  document.documentElement.classList.add('rb-focus-enhanced');
}

function pauseOffscreenVideos() {
  const videos = document.querySelectorAll('video[autoplay]');
  if (!videos.length || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const v = entry.target;
        if (entry.isIntersecting) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    },
    { threshold: 0.15 },
  );

  videos.forEach((v) => {
    v.muted = true;
    io.observe(v);
  });
}

function fixCalendlyAccent() {
  document.querySelectorAll('.calendly-inline-widget[data-url]').forEach((el) => {
    const url = el.getAttribute('data-url');
    if (!url || !url.includes('primary_color=c8ff00')) return;
    el.setAttribute(
      'data-url',
      url.replace('primary_color=c8ff00', 'primary_color=e9d391'),
    );
  });
}

function lazyLoadBelowFoldImages() {
  const imgs = document.querySelectorAll('img[loading="lazy"]:not([decoding])');
  imgs.forEach((img) => {
    img.decoding = 'async';
  });
}

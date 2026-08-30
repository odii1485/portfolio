/**
 * Platforms grid — cycle brand colour spotlight (one logo at a time, no hover required)
 */
export function initPlatformSpotlight() {
  const grid = document.querySelector('.platforms-grid');
  if (!grid || grid.dataset.platformSpotlightReady) return;

  const items = [...grid.querySelectorAll('.platform-item[data-brand]')];
  if (!items.length) return;

  grid.dataset.platformSpotlightReady = '1';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const INTERVAL_MS = 1800;

  let index = 0;
  let timer = null;
  let paused = false;

  const setSpotlight = (i) => {
    items.forEach((el, j) => {
      const on = j === i;
      el.classList.toggle('is-spotlight', on);
      if (on) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
    index = i;
  };

  const tick = () => {
    if (paused) return;
    setSpotlight((index + 1) % items.length);
  };

  const startLoop = () => {
    if (reduced) return;
    stopLoop();
    timer = window.setInterval(tick, INTERVAL_MS);
  };

  const stopLoop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  setSpotlight(0);
  if (!reduced) startLoop();

  items.forEach((item, i) => {
    item.addEventListener('mouseenter', () => {
      paused = true;
      stopLoop();
      setSpotlight(i);
    });
    item.addEventListener('focusin', () => {
      paused = true;
      stopLoop();
      setSpotlight(i);
    });
  });

  grid.addEventListener('mouseleave', () => {
    paused = false;
    if (!reduced) startLoop();
  });

  grid.addEventListener('focusout', (e) => {
    if (!grid.contains(e.relatedTarget)) {
      paused = false;
      if (!reduced) startLoop();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLoop();
    else if (!paused && !reduced) startLoop();
  });
}

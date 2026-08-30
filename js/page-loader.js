/**
 * Page loader — home: full first visit · services: brief stable transition (~2s)
 */
(function () {
  const STORAGE_HOME = 'rahul-portfolio-loader-v1';
  const STORAGE_SERVICES = 'rahul-portfolio-loader-services-v1';

  const TIMING = {
    home: { min: 5800, max: 7200, readyDelay: 350 },
    services: { min: 2100, max: 2800, readyDelay: 120 },
  };

  const STATUS_HOME = [
    'Warming up your preview',
    'Indexing skills & journey',
    'Staging live project stories',
    'Polishing recommendations',
    'Almost ready',
  ];

  let progressRaf = null;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function getPageId(loader) {
    const raw = loader?.dataset?.loaderPage || 'home';
    return raw === 'services' ? 'services' : 'home';
  }

  function hasSeenHome() {
    try {
      return sessionStorage.getItem(STORAGE_HOME) === '1';
    } catch (_) {
      return false;
    }
  }

  function hasSeenServices() {
    try {
      return sessionStorage.getItem(STORAGE_SERVICES) === '1';
    } catch (_) {
      return false;
    }
  }

  function markSeen(page) {
    try {
      if (page === 'services') {
        sessionStorage.setItem(STORAGE_SERVICES, '1');
      } else {
        sessionStorage.setItem(STORAGE_HOME, '1');
      }
    } catch (_) {
      /* ignore */
    }
  }

  function dispatchDone(page) {
    window.__pageLoaderDone = { page };
    window.dispatchEvent(
      new CustomEvent('page-loader:done', { detail: { page } }),
    );
  }

  function indexLines(loader, fast) {
    const lines = loader.querySelectorAll('[data-loader-line]');
    lines.forEach((el, i) => {
      el.style.setProperty('--line-i', String(i));
      if (fast) {
        el.style.setProperty('--line-delay-step', '0.09s');
      }
    });
    loader.style.setProperty('--loader-line-count', String(lines.length));
  }

  function setProgress(loader, pct) {
    const fill = loader.querySelector('[data-loader-progress]');
    const pctEl = loader.querySelector('[data-loader-pct]');
    const clamped = Math.min(100, Math.max(0, Math.round(pct)));
    if (fill) fill.style.width = `${clamped}%`;
    if (pctEl) pctEl.textContent = `${clamped}%`;
  }

  function setFixedStatus(loader, page) {
    const statusEl = loader.querySelector('[data-loader-status]');
    if (!statusEl) return;
    statusEl.textContent =
      page === 'services' ? 'Loading services catalogue' : 'Preparing your experience';
  }

  function startStatusCycle(loader, page) {
    const statusEl = loader.querySelector('[data-loader-status]');
    const lines = STATUS_HOME;
    if (!statusEl || page !== 'home' || lines.length < 2) return () => {};

    let index = 0;
    statusEl.textContent = lines[0];

    const interval = setInterval(() => {
      index = (index + 1) % lines.length;
      statusEl.classList.add('is-changing');
      setTimeout(() => {
        statusEl.textContent = lines[index];
        statusEl.classList.remove('is-changing');
      }, 160);
    }, 1200);

    return () => clearInterval(interval);
  }

  function animateProgress(loader, durationMs) {
    const start = performance.now();
    const target = 94;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 2;
      setProgress(loader, eased * target);
      if (t < 1) progressRaf = requestAnimationFrame(tick);
    };

    progressRaf = requestAnimationFrame(tick);
    return () => {
      if (progressRaf) cancelAnimationFrame(progressRaf);
    };
  }

  function finishLoader(loader, page, reduced, stopStatus, stopProgress) {
    if (stopStatus) stopStatus();
    if (stopProgress) stopProgress();
    setProgress(loader, 100);

    loader.classList.add('is-exiting');
    loader.setAttribute('aria-busy', 'false');

    const statusEl = loader.querySelector('[data-loader-status]');
    if (statusEl) {
      statusEl.textContent = page === 'services' ? 'Ready' : 'Welcome';
    }

    const done = () => {
      loader.classList.add('hidden');
      document.body.classList.remove('loader-active');
      markSeen(page);
      if (page === 'home') {
        document.documentElement.classList.add('loader-seen');
      } else {
        document.documentElement.classList.add('loader-services-seen');
      }
      dispatchDone(page);
    };

    if (window.gsap && !reduced) {
      const card = loader.querySelector('[data-loader-card]');
      const tl = window.gsap.timeline({
        onComplete: done,
        defaults: { ease: 'power2.inOut' },
      });
      if (card) {
        tl.to(card, { scale: 1.02, opacity: 0, duration: page === 'services' ? 0.32 : 0.4 }, 0);
      }
      tl.to(loader, { opacity: 0, duration: page === 'services' ? 0.38 : 0.45 }, 0.06);
    } else {
      setTimeout(done, reduced ? 80 : page === 'services' ? 400 : 720);
    }
  }

  function skipLoader(loader, page) {
    loader.classList.add('hidden', 'page-loader--skipped');
    loader.setAttribute('aria-busy', 'false');
    document.body.classList.remove('loader-active');
    dispatchDone(page);
  }

  function runLoader(loader) {
    const page = getPageId(loader);
    const isServices = page === 'services';
    const timing = TIMING[page] || TIMING.home;
    const reduced = prefersReducedMotion();

    if (isServices) {
      if (hasSeenServices()) {
        skipLoader(loader, page);
        return;
      }
      loader.classList.add('page-loader--brief');
    } else if (hasSeenHome()) {
      skipLoader(loader, page);
      return;
    }

    if (reduced) {
      markSeen(page);
      skipLoader(loader, page);
      return;
    }

    document.body.classList.add('loader-active');
    indexLines(loader, isServices);
    setFixedStatus(loader, page);
    setProgress(loader, 0);

    setTimeout(() => {
      loader.classList.add('is-ready');
    }, timing.readyDelay);

    const stopStatus = isServices ? null : startStatusCycle(loader, page);
    const stopProgress = animateProgress(loader, timing.min);

    const minDelay = new Promise((r) => setTimeout(r, timing.min));
    const loadDelay = new Promise((r) => {
      if (document.readyState === 'complete') r();
      else window.addEventListener('load', r, { once: true });
    });
    const maxDelay = new Promise((r) => setTimeout(r, timing.max));

    Promise.race([
      Promise.all([minDelay, loadDelay]),
      maxDelay,
    ]).then(() => finishLoader(loader, page, reduced, stopStatus, stopProgress));
  }

  function init() {
    const loader = document.getElementById('page-loader');
    if (!loader) return;
    runLoader(loader);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

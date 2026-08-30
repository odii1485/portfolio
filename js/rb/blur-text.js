/** BlurText — react-bits inspired word reveal (vanilla) */

function splitWords(text) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function renderWords(el, words) {
  el.innerHTML = words
    .map(
      (word, i) =>
        `<span class="rb-blur-word" style="--rb-blur-i:${i}">${word}</span>`,
    )
    .join('<span class="rb-blur-space"> </span>');
}

function prepareBlurElement(el) {
  if (el.dataset.rbBlurText) return;
  el.dataset.rbBlurText = '1';

  const raw = el.textContent.trim();
  const words = splitWords(raw);
  if (!words.length) return;

  renderWords(el, words);
}

export function revealBlurHandoff(root = document) {
  const scope = root === document ? document : root;
  const targets = scope.querySelectorAll('[data-rb-blur-handoff]');
  targets.forEach((el) => {
    if (!el.dataset.rbBlurText) prepareBlurElement(el);
    el.classList.add('rb-blur-text-visible');
  });
}

function runHandoffForPage(page) {
  const heroRoot =
    page === 'services'
      ? document.getElementById('services-hero')
      : document.getElementById('hero');
  if (!heroRoot?.querySelector('[data-rb-blur-handoff]')) return;
  requestAnimationFrame(() => requestAnimationFrame(() => revealBlurHandoff(heroRoot)));
}

function wireLoaderHandoff() {
  window.addEventListener('page-loader:done', (ev) => {
    runHandoffForPage(ev.detail?.page || 'home');
  });

  if (window.__pageLoaderDone?.page) {
    runHandoffForPage(window.__pageLoaderDone.page);
  } else if (
    document.documentElement.classList.contains('loader-seen') ||
    document.documentElement.classList.contains('loader-services-seen')
  ) {
    const page = document.body.classList.contains('page-services')
      ? 'services'
      : 'home';
    runHandoffForPage(page);
  }
}

export function initBlurText() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  wireLoaderHandoff();

  if (reduced) {
    document.querySelectorAll('[data-rb-blur-text]').forEach((el) => {
      prepareBlurElement(el);
      el.classList.add('rb-blur-text-visible');
    });
    return;
  }

  document.querySelectorAll('[data-rb-blur-text]').forEach((el) => {
    if (el.dataset.rbBlurText) return;
    if (el.hasAttribute('data-rb-blur-handoff')) {
      prepareBlurElement(el);
      return;
    }

    prepareBlurElement(el);

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('rb-blur-text-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -40px 0px' },
    );
    obs.observe(el);
  });
}

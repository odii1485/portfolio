/** Scroll Stack — sticky stacking for Journey + Services process (CSS + light GSAP) */

const DESKTOP_MQ = '(min-width: 769px)';

function prepareScrollStack(root) {
  root.querySelectorAll('.timeline-item, .process-card').forEach((item) => {
    item.classList.add('scroll-stack-item');
    const inner = item.querySelector('.timeline-content, .process-card-inner') || item;
    inner.classList.add('scroll-stack-inner');
  });
}

export function initScrollStack() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  if (!window.matchMedia(DESKTOP_MQ).matches) {
    initServicesMobileReveal();
    return;
  }

  const journeyTimeline = document.querySelector('#journey .timeline');
  if (journeyTimeline && !journeyTimeline.hasAttribute('data-rb-scroll-stack')) {
    journeyTimeline.setAttribute('data-rb-scroll-stack', '');
  }

  const processGrid = document.querySelector('#services-process .process-grid');
  if (processGrid && !processGrid.hasAttribute('data-rb-scroll-stack')) {
    processGrid.setAttribute('data-rb-scroll-stack', '');
    processGrid.querySelectorAll('.process-card').forEach((card) => {
      if (!card.querySelector('.process-card-inner')) {
        const wrap = document.createElement('div');
        wrap.className = 'process-card-inner scroll-stack-inner';
        while (card.firstChild) wrap.appendChild(card.firstChild);
        card.appendChild(wrap);
      }
    });
  }

  document.querySelectorAll('[data-rb-scroll-stack]').forEach((root) => {
    if (root.dataset.rbScrollStack) return;
    root.dataset.rbScrollStack = '1';
    root.classList.add('scroll-stack-active');
    prepareScrollStack(root);

    const items = [...root.querySelectorAll('.scroll-stack-item')];
    if (items.length < 2) return;

    items.forEach((item, i) => {
      item.style.setProperty('--stack-index', String(i + 1));
      const inner = item.querySelector('.scroll-stack-inner');
      if (!inner || !window.gsap || !window.ScrollTrigger) return;

      window.gsap.fromTo(
        inner,
        { scale: 0.94, opacity: 0.88 },
        {
          scale: 1,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            end: 'top 28%',
            scrub: 0.6,
          },
        },
      );
    });

    window.ScrollTrigger?.refresh();
  });
}

/** Mobile services list — scroll-driven expand */
export function initServicesMobileReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia(DESKTOP_MQ).matches) return;

  const rows = [...document.querySelectorAll('#services .svc-row.svc-stack')];
  if (!rows.length) return;

  rows.forEach((row) => {
    row.classList.add('svc-mobile-reveal');
    if (!window.gsap || !window.ScrollTrigger) return;

    window.gsap.fromTo(
      row,
      { scale: 0.96, opacity: 0.72, y: 28 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        ease: 'power2.out',
        duration: 0.55,
        scrollTrigger: {
          trigger: row,
          start: 'top 92%',
          toggleActions: 'play none none reverse',
        },
      },
    );
  });

  window.ScrollTrigger?.refresh();
}

/** Mobile certification carousel — legacy swipe path (skipped when infinite CSS scroll is active) */

export function initCertMobileCarousel() {
  const certWrap = document.querySelector('[data-cert-scroll]');
  const certTrack = certWrap?.querySelector('.cert-scroll-track');
  if (!certWrap || !certTrack || certWrap.dataset.rbCertMobile) return;

  const touchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const narrow = window.innerWidth <= 768;
  if (!touchOnly && !narrow) return;
  if (window.__certOrbitMode) return;
  if (
    certTrack.dataset.certInfiniteReady ||
    certTrack.dataset.certDuplicated ||
    certWrap.dataset.certCarouselJs
  ) {
    return;
  }

  certWrap.dataset.rbCertMobile = '1';
  certWrap.classList.add('cert-mobile-active');

  certTrack.querySelectorAll('.cert-card').forEach((card) => {
    card.classList.remove('reveal');
    card.classList.add('visible');
  });

  certTrack.style.animation = 'none';

  const gap = parseFloat(getComputedStyle(certTrack).gap) || 18;
  const cardStep = () => {
    const card = certTrack.querySelector('.cert-card');
    return (card?.offsetWidth || 280) + gap;
  };

  let offset = 0;
  let touchStartX = 0;
  let touchStartOffset = 0;
  let dragging = false;

  const apply = () => {
    certTrack.style.transform = `translate3d(${offset}px, 0, 0)`;
  };

  const snapNearest = () => {
    const step = cardStep();
    offset = Math.round(offset / step) * step;
    certTrack.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
    apply();
    certTrack.addEventListener('transitionend', () => {
      certTrack.style.transition = '';
    }, { once: true });
  };

  certWrap.addEventListener(
    'touchstart',
    (e) => {
      dragging = true;
      touchStartX = e.touches[0].clientX;
      touchStartOffset = offset;
      certTrack.style.transition = '';
    },
    { passive: true },
  );

  certWrap.addEventListener(
    'touchmove',
    (e) => {
      if (!dragging) return;
      const dx = e.touches[0].clientX - touchStartX;
      offset = touchStartOffset + dx;
      apply();
    },
    { passive: true },
  );

  certWrap.addEventListener(
    'touchend',
    () => {
      if (!dragging) return;
      dragging = false;
      snapNearest();
    },
    { passive: true },
  );

  certWrap.querySelector('.cert-nav-next')?.addEventListener('click', () => {
    offset -= cardStep();
    certTrack.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
    apply();
    setTimeout(() => {
      certTrack.style.transition = '';
    }, 460);
  });

  certWrap.querySelector('.cert-nav-prev')?.addEventListener('click', () => {
    offset += cardStep();
    certTrack.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
    apply();
    setTimeout(() => {
      certTrack.style.transition = '';
    }, 460);
  });

  apply();
}

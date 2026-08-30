/** LogoLoop — react-bits infinite marquee (replaces CSS marquee animation) */

const ANIMATION_CONFIG = { SMOOTH_TAU: 0.25, MIN_COPIES: 2, COPY_HEADROOM: 2 };

function mountLogoLoop(container, { speed = 120, direction = 'left', gap = 32, logoHeight = 28, pauseOnHover = true } = {}) {
  const track = container.querySelector('.logoloop__track');
  const seq = container.querySelector('.logoloop__seq');
  if (!track || !seq) return null;

  const isVertical = direction === 'up' || direction === 'down';
  let seqWidth = 0;
  let seqHeight = 0;
  let copyCount = ANIMATION_CONFIG.MIN_COPIES;
  let isHovered = false;
  let offset = 0;
  let velocity = 0;
  let rafId = null;
  let lastTs = null;

  const magnitude = Math.abs(speed);
  const dirMult = isVertical ? (direction === 'up' ? 1 : -1) : direction === 'left' ? 1 : -1;
  const targetVelocity = magnitude * dirMult;
  const hoverSpeed = pauseOnHover ? 0 : undefined;

  container.style.setProperty('--logoloop-gap', `${gap}px`);
  container.style.setProperty('--logoloop-logoHeight', `${logoHeight}px`);
  container.classList.add('logoloop', isVertical ? 'logoloop--vertical' : 'logoloop--horizontal', 'logoloop--fade');

  const updateDimensions = () => {
    const containerWidth = container.clientWidth;
    const rect = seq.getBoundingClientRect();
    const w = Math.ceil(rect.width);
    const h = Math.ceil(rect.height);
    if (isVertical && h > 0) {
      seqHeight = h;
      const copiesNeeded = Math.ceil((container.clientHeight || h) / h) + ANIMATION_CONFIG.COPY_HEADROOM;
      copyCount = Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded);
    } else if (w > 0) {
      seqWidth = w;
      const copiesNeeded = Math.ceil(containerWidth / w) + ANIMATION_CONFIG.COPY_HEADROOM;
      copyCount = Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded);
    }
    track.innerHTML = '';
    for (let c = 0; c < copyCount; c++) {
      const clone = seq.cloneNode(true);
      clone.classList.remove('logoloop__seq');
      clone.classList.add('logoloop__list');
      clone.removeAttribute('id');
      track.appendChild(clone);
    }
  };

  const animate = (ts) => {
    if (lastTs === null) lastTs = ts;
    const dt = Math.max(0, ts - lastTs) / 1000;
    lastTs = ts;
    const target = isHovered && hoverSpeed !== undefined ? hoverSpeed : targetVelocity;
    const easingFactor = 1 - Math.exp(-dt / ANIMATION_CONFIG.SMOOTH_TAU);
    velocity += (target - velocity) * easingFactor;
    const size = isVertical ? seqHeight : seqWidth;
    if (size > 0) {
      offset = ((offset + velocity * dt) % size + size) % size;
      track.style.transform = isVertical
        ? `translate3d(0, ${-offset}px, 0)`
        : `translate3d(${-offset}px, 0, 0)`;
    }
    rafId = requestAnimationFrame(animate);
  };

  const onResize = () => updateDimensions();
  window.addEventListener('resize', onResize);
  if (hoverSpeed !== undefined) {
    container.addEventListener('mouseenter', () => {
      isHovered = true;
    });
    container.addEventListener('mouseleave', () => {
      isHovered = false;
    });
  }

  updateDimensions();
  rafId = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
  };
}

function buildLogoLoopFromSpans(container, spans, options = {}) {
  if (!spans.length) return null;

  const wrap = document.createElement('div');
  wrap.className = 'logoloop logoloop--horizontal logoloop--fade';
  wrap.style.width = '100%';

  const track = document.createElement('div');
  track.className = 'logoloop__track';

  const seq = document.createElement('div');
  seq.className = 'logoloop__seq';

  spans.forEach((node) => {
    const item = document.createElement('div');
    item.className = 'logoloop__item';
    item.appendChild(node.cloneNode(true));
    seq.appendChild(item);
  });

  track.appendChild(seq);
  wrap.appendChild(track);
  container.appendChild(wrap);

  return mountLogoLoop(wrap, options);
}

function initLogoLoopStrip(container, options) {
  if (!container || container.dataset.logoLoop) return;
  container.dataset.logoLoop = '1';

  const oldTrack = container.querySelector('.marquee-track, .services-process-track');
  if (!oldTrack) return;

  const itemRoot = oldTrack.querySelector('.marquee-content') || oldTrack;
  const spans = [...itemRoot.querySelectorAll(':scope > span')];
  if (!spans.length) return;

  oldTrack.remove();
  buildLogoLoopFromSpans(container, spans, options);
}

export function initLogoLoop() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  initLogoLoopStrip(document.querySelector('.marquee-section'), {
    speed: 85,
    direction: 'left',
    gap: 48,
    logoHeight: 32,
    pauseOnHover: true,
  });

  initLogoLoopStrip(document.querySelector('.services-process-marquee'), {
    speed: 70,
    direction: 'left',
    gap: 40,
    logoHeight: 28,
    pauseOnHover: true,
  });
}

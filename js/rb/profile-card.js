/** ProfileCard tilt — react-bits (vanilla port, pointer-driven CSS vars) */

const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v, p = 3) => parseFloat(v.toFixed(p));
const adjust = (v, fMin, fMax, tMin, tMax) => round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

function setVarsFromXY(wrap, shell, x, y) {
  const width = shell.clientWidth || 1;
  const height = shell.clientHeight || 1;
  const percentX = clamp((100 / width) * x);
  const percentY = clamp((100 / height) * y);
  const centerX = percentX - 50;
  const centerY = percentY - 50;

  wrap.style.setProperty('--pointer-x', `${percentX}%`);
  wrap.style.setProperty('--pointer-y', `${percentY}%`);
  wrap.style.setProperty('--background-x', `${adjust(percentX, 0, 100, 35, 65)}%`);
  wrap.style.setProperty('--background-y', `${adjust(percentY, 0, 100, 35, 65)}%`);
  wrap.style.setProperty('--pointer-from-center', `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`);
  wrap.style.setProperty('--pointer-from-top', `${percentY / 100}`);
  wrap.style.setProperty('--pointer-from-left', `${percentX / 100}`);
  wrap.style.setProperty('--rotate-x', `${round(-(centerX / 5))}deg`);
  wrap.style.setProperty('--rotate-y', `${round(centerY / 4)}deg`);
}

export function initProfileCard() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const wrapper = document.querySelector('[data-rb-profile-card]');
  if (!wrapper || wrapper.dataset.rbProfile) return;
  wrapper.dataset.rbProfile = '1';

  const shell = wrapper.querySelector('.pc-card-shell') || wrapper.querySelector('.pc-card');
  const card = wrapper.querySelector('.pc-card');
  if (!shell || !card) return;

  const innerGradient =
    wrapper.dataset.innerGradient ||
    'linear-gradient(145deg, rgba(201,184,150,0.12) 0%, rgba(107,159,196,0.15) 50%, rgba(157,142,196,0.1) 100%)';
  const glowColor = wrapper.dataset.behindGlow || 'rgba(168, 198, 185, 0.4)';

  wrapper.style.setProperty('--inner-gradient', innerGradient);
  wrapper.style.setProperty('--behind-glow-color', glowColor);
  wrapper.style.setProperty('--card-opacity', '0.65');

  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  let raf = 0;
  let running = false;

  const step = (ts) => {
    if (!running) return;
    const k = 0.14;
    currentX += (targetX - currentX) * k;
    currentY += (targetY - currentY) * k;
    setVarsFromXY(wrapper, shell, currentX, currentY);
    if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
      raf = requestAnimationFrame(step);
    } else {
      running = false;
      raf = 0;
    }
  };

  const start = () => {
    if (!running) {
      running = true;
      raf = requestAnimationFrame(step);
    }
  };

  const setTarget = (x, y) => {
    targetX = x;
    targetY = y;
    start();
  };

  const toCenter = () => {
    setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
  };

  const onMove = (e) => {
    const rect = shell.getBoundingClientRect();
    setTarget(e.clientX - rect.left, e.clientY - rect.top);
  };

  const onEnter = (e) => {
    card.classList.add('active');
    wrapper.classList.add('active');
    wrapper.style.setProperty('--card-opacity', '1');
    onMove(e);
  };

  const onLeave = () => {
    toCenter();
    const settle = () => {
      if (Math.hypot(targetX - currentX, targetY - currentY) < 0.6) {
        card.classList.remove('active');
        wrapper.classList.remove('active');
        wrapper.style.setProperty('--card-opacity', '0.65');
      } else {
        requestAnimationFrame(settle);
      }
    };
    requestAnimationFrame(settle);
  };

  shell.addEventListener('pointerenter', onEnter);
  shell.addEventListener('pointermove', onMove);
  shell.addEventListener('pointerleave', onLeave);

  const ix = shell.clientWidth / 2;
  const iy = shell.clientHeight / 2;
  currentX = ix;
  currentY = iy;
  setVarsFromXY(wrapper, shell, ix, iy);
  toCenter();
}

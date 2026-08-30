/**
 * BorderGlow — vanilla port of react-bits BorderGlow component
 * @see https://github.com/DavidHDev/react-bits/tree/main/src/content/Components/BorderGlow
 */

const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
const GRADIENT_KEYS = [
  '--gradient-one',
  '--gradient-two',
  '--gradient-three',
  '--gradient-four',
  '--gradient-five',
  '--gradient-six',
  '--gradient-seven',
];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

const PROOF_DEFAULTS = {
  colors: ['#8ec4b8', '#c9b88a', '#9eb5c8'],
  glowColor: '168 35 72',
  cardBg: 'rgba(18, 20, 26, 0.9)',
  borderRadius: 14,
  glowRadius: 22,
  glowIntensity: 0.7,
  coneSpread: 20,
  edgeSensitivity: 26,
  fillOpacity: 0.32,
};

function parseHSL(hslStr) {
  const match = String(hslStr).match(/([\d.]+)\s+([\d.]+)%?\s+([\d.]+)%?/);
  if (!match) return { h: 168, s: 35, l: 72 };
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
}

function buildGlowVars(glowColor, intensity) {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const keys = ['--glow-color', '--glow-color-60', '--glow-color-50', '--glow-color-40', '--glow-color-30', '--glow-color-20', '--glow-color-10'];
  const vars = {};
  for (let i = 0; i < opacities.length; i++) {
    vars[keys[i]] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
  }
  return vars;
}

function buildGradientVars(colors) {
  const vars = {};
  for (let i = 0; i < 7; i++) {
    const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
    vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
  }
  vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

function easeOutCubic(x) {
  return 1 - (1 - x) ** 3;
}

function easeInCubic(x) {
  return x * x * x;
}

function animateValue({ start = 0, end = 100, duration = 1000, delay = 0, ease = easeOutCubic, onUpdate, onEnd }) {
  const t0 = performance.now() + delay;
  function tick() {
    const elapsed = performance.now() - t0;
    const t = Math.min(elapsed / duration, 1);
    onUpdate(start + (end - start) * ease(t));
    if (t < 1) requestAnimationFrame(tick);
    else if (onEnd) onEnd();
  }
  setTimeout(() => requestAnimationFrame(tick), delay);
}

function getCenter(el) {
  const { width, height } = el.getBoundingClientRect();
  return [width / 2, height / 2];
}

function getEdgeProximity(el, x, y) {
  const [cx, cy] = getCenter(el);
  const dx = x - cx;
  const dy = y - cy;
  let kx = Infinity;
  let ky = Infinity;
  if (dx !== 0) kx = cx / Math.abs(dx);
  if (dy !== 0) ky = cy / Math.abs(dy);
  return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
}

function getCursorAngle(el, x, y) {
  const [cx, cy] = getCenter(el);
  const dx = x - cx;
  const dy = y - cy;
  if (dx === 0 && dy === 0) return 0;
  let degrees = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (degrees < 0) degrees += 360;
  return degrees;
}

export function runBorderGlowSweep(card) {
  if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const angleStart = 110;
  const angleEnd = 465;
  card.classList.add('sweep-active');
  card.style.setProperty('--cursor-angle', `${angleStart}deg`);

  animateValue({ duration: 500, onUpdate: (v) => card.style.setProperty('--edge-proximity', String(v)) });
  animateValue({
    ease: easeInCubic,
    duration: 1500,
    end: 50,
    onUpdate: (v) => {
      card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`);
    },
  });
  animateValue({
    ease: easeOutCubic,
    delay: 1500,
    duration: 2250,
    start: 50,
    end: 100,
    onUpdate: (v) => {
      card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`);
    },
  });
  animateValue({
    ease: easeInCubic,
    delay: 2500,
    duration: 1500,
    start: 100,
    end: 0,
    onUpdate: (v) => card.style.setProperty('--edge-proximity', String(v)),
    onEnd: () => card.classList.remove('sweep-active'),
  });
}

function applyCardOptions(card, opts = {}) {
  const colors = (opts.colors || PROOF_DEFAULTS.colors).slice();
  const glowColor = opts.glowColor || PROOF_DEFAULTS.glowColor;
  const intensity = parseFloat(opts.glowIntensity ?? PROOF_DEFAULTS.glowIntensity);

  card.style.setProperty('--card-bg', opts.cardBg || PROOF_DEFAULTS.cardBg);
  card.style.setProperty('--edge-sensitivity', String(opts.edgeSensitivity ?? PROOF_DEFAULTS.edgeSensitivity));
  card.style.setProperty('--border-radius', `${opts.borderRadius ?? PROOF_DEFAULTS.borderRadius}px`);
  card.style.setProperty('--glow-padding', `${opts.glowRadius ?? PROOF_DEFAULTS.glowRadius}px`);
  card.style.setProperty('--cone-spread', String(opts.coneSpread ?? PROOF_DEFAULTS.coneSpread));
  card.style.setProperty('--fill-opacity', String(opts.fillOpacity ?? PROOF_DEFAULTS.fillOpacity));

  Object.entries(buildGlowVars(glowColor, intensity)).forEach(([k, v]) => card.style.setProperty(k, v));
  Object.entries(buildGradientVars(colors)).forEach(([k, v]) => card.style.setProperty(k, v));
}

function ensureBorderGlowStructure(card) {
  if (!card.querySelector(':scope > .edge-light')) {
    const edgeLight = document.createElement('span');
    edgeLight.className = 'edge-light';
    edgeLight.setAttribute('aria-hidden', 'true');
    card.insertBefore(edgeLight, card.firstChild);
  }

  let inner = card.querySelector(':scope > .border-glow-inner');
  if (!inner) {
    inner = document.createElement('div');
    inner.className = 'border-glow-inner';
    const edgeLight = card.querySelector(':scope > .edge-light');
    const movable = [...card.children].filter((c) => c !== edgeLight);
    movable.forEach((node) => inner.appendChild(node));
    card.appendChild(inner);
  }

  return inner;
}

function initReactBitsBorderGlowCard(card) {
  if (card.dataset.rbBorderGlowInit) return;
  card.dataset.rbBorderGlowInit = '1';
  card.classList.add('border-glow-card');

  ensureBorderGlowStructure(card);

  const opts = {
    colors: (card.dataset.glowColors || '').split(',').map((c) => c.trim()).filter(Boolean),
    glowColor: card.dataset.glowColor,
    cardBg: card.dataset.cardBg,
    borderRadius: card.dataset.borderRadius ? parseFloat(card.dataset.borderRadius) : undefined,
    glowRadius: card.dataset.glowRadius ? parseFloat(card.dataset.glowRadius) : undefined,
    glowIntensity: card.dataset.glowIntensity,
    coneSpread: card.dataset.coneSpread ? parseFloat(card.dataset.coneSpread) : undefined,
    edgeSensitivity: card.dataset.edgeSensitivity ? parseFloat(card.dataset.edgeSensitivity) : undefined,
    fillOpacity: card.dataset.fillOpacity,
  };
  if (!opts.colors.length) opts.colors = [...PROOF_DEFAULTS.colors];

  applyCardOptions(card, opts);

  const onMove = (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--edge-proximity', `${(getEdgeProximity(card, x, y) * 100).toFixed(3)}`);
    card.style.setProperty('--cursor-angle', `${getCursorAngle(card, x, y).toFixed(3)}deg`);
  };

  card.addEventListener('pointermove', onMove, { passive: true });
  card._rbBorderGlowCleanup = () => card.removeEventListener('pointermove', onMove);
}

/** Always-on idle rotation for project cards (react-bits border glow) */
function initWorkBorderGlowIdle(card) {
  if (card.dataset.rbWorkGlowIdle) return;
  card.dataset.rbWorkGlowIdle = '1';

  card.style.setProperty('--edge-proximity', '75');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    card.style.setProperty('--cursor-angle', '200deg');
    return;
  }

  let angle = Math.random() * 360;
  let raf = 0;
  let visible = true;

  const tick = () => {
    if (visible && !card.classList.contains('sweep-active')) {
      angle = (angle + 0.14) % 360;
      if (!card.matches(':hover')) {
        card.style.setProperty('--cursor-angle', `${angle.toFixed(2)}deg`);
      }
    }
    raf = requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
    },
    { threshold: 0.05 },
  );
  io.observe(card);
  raf = requestAnimationFrame(tick);

  const prev = card._rbBorderGlowCleanup;
  card._rbBorderGlowCleanup = () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    if (prev) prev();
  };
}

/** Legacy conic rotation for skills cards */
function initLegacyConicGlow(card) {
  if (card.dataset.rbBorderGlow) return;
  card.dataset.rbBorderGlow = '1';

  const colors = (card.dataset.glowColors || '#e9d391,#a8c6b9,#bdd4c8')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  const bg = card.dataset.cardBg || '#0a0a0a';

  card.style.setProperty('--border-glow-bg', bg);
  card.style.setProperty(
    '--border-glow-gradient',
    `conic-gradient(from var(--border-glow-angle, 0deg), ${colors.join(', ')}, ${colors[0] || '#e9d391'})`
  );

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let angle = 0;
  let raf = 0;
  let visible = true;
  const speed = parseFloat(card.dataset.glowSpeed || '0.35') || 0.35;

  const tick = () => {
    if (visible) {
      angle = (angle + speed) % 360;
      card.style.setProperty('--border-glow-angle', `${angle}deg`);
    }
    raf = requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
  }, { threshold: 0.05 });
  io.observe(card);
  raf = requestAnimationFrame(tick);

  const prev = card._rbBorderGlowCleanup;
  card._rbBorderGlowCleanup = () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    if (prev) prev();
  };
}

export function initBorderGlow() {
  document.querySelectorAll('.proof-ribbon-shard').forEach((shard) => {
    shard.classList.add('border-glow-card');
    shard.setAttribute('data-rb-border-glow', '');
    if (!shard.dataset.glowColors) shard.dataset.glowColors = PROOF_DEFAULTS.colors.join(',');
    if (!shard.dataset.glowColor) shard.dataset.glowColor = PROOF_DEFAULTS.glowColor;
    if (!shard.dataset.cardBg) shard.dataset.cardBg = PROOF_DEFAULTS.cardBg;
    initReactBitsBorderGlowCard(shard);
  });

  document.querySelectorAll('.hero-profile-card.border-glow-card[data-rb-border-glow]').forEach((card) => {
    if (!card.dataset.glowColors) card.dataset.glowColors = '#e9d391,#a8c6b9,#bdd4c8';
    if (!card.dataset.glowColor) card.dataset.glowColor = '42 45 70';
    initReactBitsBorderGlowCard(card);
  });

  const WORK_GLOW = {
    colors: ['#e9d391', '#a8c6b9', '#bdd4c8', '#6b9fc4'],
    glowColor: '42 38 28',
    cardBg: 'rgba(8, 9, 12, 0.94)',
    borderRadius: 24,
    glowRadius: 30,
    glowIntensity: 0.88,
    coneSpread: 22,
    edgeSensitivity: 22,
    fillOpacity: 0.45,
  };

  // (Project cards now use the cinematic-spread design with its own visual treatment;
  // no border-glow wrap needed here.)

  document.querySelectorAll('.work-card:not(.work-card-cta), .skills-atlas-card').forEach((card) => {
    if (!card.hasAttribute('data-rb-border-glow')) {
      card.setAttribute('data-rb-border-glow', '');
      card.dataset.glowColors = card.dataset.glowColors || '#e9d391,#a8c6b9,#bdd4c8';
      card.dataset.cardBg = card.dataset.cardBg || '#0a0a0a';
    }
  });

  document.querySelectorAll('.rec-card.glass').forEach((card) => {
    if (!card.hasAttribute('data-rb-border-glow')) {
      card.setAttribute('data-rb-border-glow', '');
      card.dataset.glowColors = '#e9d391,#a8c6b9,#bdd4c8';
      card.dataset.cardBg = 'rgba(10, 10, 10, 0.72)';
    }
  });

  document.querySelectorAll('[data-rb-border-glow]:not(.border-glow-card)').forEach(initLegacyConicGlow);
}

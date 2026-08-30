/** VariableProximity — react-bits */

export function initVariableProximity() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll('.skills-cat-title:not([data-variable-proximity]), .skills-atlas-title:not([data-variable-proximity])').forEach((el) => {
    el.dataset.variableProximity = '';
    el.dataset.radius = '100';
    el.dataset.maxScale = '1.2';
  });

  document.querySelectorAll('[data-variable-proximity]:not([data-vp-ready])').forEach((root) => {
    root.dataset.vpReady = '1';

    const from = root.dataset.from || 'center';
    const radius = +(root.dataset.radius || 120);
    const maxScale = +(root.dataset.maxScale || 1.25);

    const text = root.textContent;
    root.innerHTML = text
      .split('')
      .map((ch) => {
        if (ch === ' ') return '<span class="variable-proximity-char">&nbsp;</span>';
        return `<span class="variable-proximity-char">${ch}</span>`;
      })
      .join('');

    const chars = root.querySelectorAll('.variable-proximity-char');

    const apply = (x, y) => {
      chars.forEach((char, i) => {
        const rect = char.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(x - cx, y - cy);
        const t = Math.max(0, 1 - dist / radius);
        let weight = t;
        if (from === 'first') weight = t * (1 - i / chars.length);
        if (from === 'last') weight = t * (i / chars.length);
        const scale = 1 + (maxScale - 1) * weight;
        char.style.fontVariationSettings = `'wght' ${Math.round(400 + 500 * weight)}`;
        char.style.transform = `scale(${scale.toFixed(3)})`;
        char.style.opacity = `${(0.55 + 0.45 * weight).toFixed(2)}`;
      });
    };

    const reset = () => {
      chars.forEach((char) => {
        char.style.fontVariationSettings = '';
        char.style.transform = '';
        char.style.opacity = '';
      });
    };

    const zone = root.closest('.skills-col, .skills-wrap, section, .service-detail') || root;
    const onMove = (e) => apply(e.clientX, e.clientY);
    zone.addEventListener('mousemove', onMove, { passive: true });
    root.addEventListener('mousemove', onMove, { passive: true });
    zone.addEventListener('mouseleave', reset);
    root.addEventListener('mouseleave', reset);
  });
}

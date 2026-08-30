/** Glass Surface + Fluid Glass — sparse glass (floating UI only) */

export function initGlassSurface() {
  const navbar = document.getElementById('navbar');
  if (navbar && !navbar.dataset.rbGlass) {
    navbar.dataset.rbGlass = '1';
    navbar.classList.add('glass-surface', 'glass-surface-nav');
  }

  document.querySelectorAll('.fluid-glass').forEach((el) => {
    if (el.dataset.rbFluidGlass) return;
    el.dataset.rbFluidGlass = '1';
    el.classList.add('fluid-glass-ready');
  });

  document.querySelectorAll('.nav-cta').forEach((el) => {
    el.classList.add('fluid-glass', 'fluid-glass-ready');
  });
}

/** FlowingMenu — react-bits nav (mobile overlay) */

import { initMenuItem, buildMarqueeLayer } from './flowing-menu-core.js';

function buildMenuFromItems(items, borderColor = 'rgba(255,255,255,0.12)') {
  const wrap = document.createElement('div');
  wrap.className = 'menu-wrap';
  const menu = document.createElement('nav');
  menu.className = 'menu';

  items.forEach((cfg) => {
    const { marquee, inner, part, speed } = buildMarqueeLayer(cfg.text, cfg.image, +(cfg.speed || 15));
    const item = document.createElement('div');
    item.className = 'menu__item';
    item.style.borderColor = cfg.borderColor || borderColor;

    const linkEl = document.createElement('a');
    linkEl.className = 'menu__item-link';
    linkEl.href = cfg.link || '#';
    linkEl.textContent = cfg.text;
    if (cfg.textColor) linkEl.style.color = cfg.textColor;

    item.appendChild(linkEl);
    item.appendChild(marquee);
    menu.appendChild(item);

    initMenuItem(item, marquee, inner, part, speed);
  });

  wrap.appendChild(menu);
  return wrap;
}

function itemsFromCardNavLinks() {
  return [...document.querySelectorAll('.card-nav-link')].map((a) => ({
    link: a.getAttribute('href') || '#',
    text: a.textContent.trim(),
    speed: 14,
    borderColor: 'rgba(255,255,255,0.1)',
    textColor: 'rgba(255,255,255,0.92)',
  }));
}

function mountFlowingMenuRoot(root) {
  if (root.dataset.flowingReady) return false;
  let items = [];
  try {
    items = JSON.parse(root.dataset.menuItems || '[]');
  } catch {
    items = [];
  }
  if (!items.length) items = itemsFromCardNavLinks();
  if (!items.length) return false;

  root.innerHTML = '';
  root.appendChild(buildMenuFromItems(items));
  root.dataset.flowingReady = '1';
  return true;
}

function initNavFlowingMenu() {
  if (window.matchMedia('(max-width: 768px)').matches) {
    document.body.classList.add('nav-menu-fallback');
    return;
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let anyMounted = false;

  document.querySelectorAll('[data-rb-flowing-menu]').forEach((root) => {
    if (mountFlowingMenuRoot(root)) anyMounted = true;
  });

  if (!anyMounted) {
    document.body.classList.add('nav-menu-fallback');
  } else {
    document.body.classList.remove('nav-menu-fallback');
  }

  if (reduced) {
    document.body.classList.add('nav-menu-fallback');
  }
}

export function initFlowingMenu() {
  initNavFlowingMenu();
}

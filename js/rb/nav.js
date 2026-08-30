/**
 * Phase 3 — Gooey Nav (desktop) + Flowing Menu (mobile) + Card Nav flow
 */
import {
  initGooeyNav,
  syncGooeyNavActive,
  isGooeyNavScrollLocked,
} from './gooey-nav.js';
import { initCardNav } from './card-nav.js';
import { initFlowingMenu } from './flowing-menu.js';

const DESKTOP_MQ = '(min-width: 769px)';

function closeMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  const closeBtn = document.getElementById('nav-close');
  toggle?.classList.remove('open');
  links?.classList.remove('open');
  document.body.classList.remove('nav-menu-open');
  toggle?.setAttribute('aria-expanded', 'false');
  toggle?.setAttribute('aria-label', 'Menu');
  closeBtn?.setAttribute('aria-hidden', 'true');
  links?.querySelectorAll('[data-rb-flowing-menu]').forEach((host) => {
    host.setAttribute('aria-hidden', 'true');
  });
}

function wireFlowingMenuClose() {
  const closeOnClick = (a) => {
    if (a.dataset.rbNavCloseWired) return;
    a.dataset.rbNavCloseWired = '1';
    a.addEventListener('click', () => {
      setTimeout(closeMobileNav, 120);
    });
  };

  document.querySelectorAll('.rb-flowing-menu-host .menu__item-link').forEach(closeOnClick);
  document.querySelectorAll('.nav-links.open .card-nav-link, .card-nav .card-nav-link').forEach(closeOnClick);
}

export function initReactBitsNav() {
  initFlowingMenu();
  setTimeout(() => {
    initFlowingMenu();
    wireFlowingMenuClose();
  }, 80);
  initCardNav();
  window.__rbSyncGooeyNav = syncGooeyNavActive;
  window.__rbGooeyScrollLocked = isGooeyNavScrollLocked;

  if (window.matchMedia(DESKTOP_MQ).matches) {
    initGooeyNav();
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const isDesktop = window.matchMedia(DESKTOP_MQ).matches;
      const hasGooey = document.querySelector('.gooey-nav-container');
      if (isDesktop && !hasGooey) {
        initGooeyNav();
      }
      if (!isDesktop && hasGooey) {
        hasGooey.remove();
        document.body.classList.remove('has-gooey-nav');
      }
      initCardNav();
      initFlowingMenu();
    }, 200);
  });
}

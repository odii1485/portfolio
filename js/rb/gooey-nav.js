/** GooeyNav — desktop nav with single sliding pill (no blur/particle effects) */

const PILL_EASE = 'power2.inOut';
const PILL_DUR = 0.42;

function sectionIdFromHref(href) {
  if (!href) return '';
  return href.includes('#') ? href.split('#').pop() : href.replace(/^#/, '');
}

function scrollToSection(href) {
  if (!href) return;
  const id = sectionIdFromHref(href);
  if (id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
  }
  if (href.includes('.html') || href.startsWith('/')) {
    window.location.href = href;
  }
}

let gooeyState = null;
let scrollLockUntil = 0;
let scrollLockIndex = -1;
let scrollLockTargetId = '';

export function lockGooeyNavForScroll(index, ms = 2200) {
  scrollLockIndex = index;
  scrollLockUntil = Date.now() + ms;
  const li = gooeyState?.ul.children[index];
  scrollLockTargetId = sectionIdFromHref(li?.querySelector('a')?.getAttribute('href'));
  if (gooeyState) {
    movePillToIndex(index, false);
  }
}

export function isGooeyNavScrollLocked() {
  if (Date.now() >= scrollLockUntil) {
    scrollLockTargetId = '';
    return false;
  }
  if (scrollLockTargetId) {
    const el = document.getElementById(scrollLockTargetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
      const ratio = visible / Math.min(rect.height, vh);
      if (ratio >= 0.4) {
        scrollLockUntil = 0;
        scrollLockTargetId = '';
        return false;
      }
    }
  }
  return true;
}

function getItemRect(wrapper, li) {
  const cr = wrapper.getBoundingClientRect();
  const pr = li.getBoundingClientRect();
  return {
    left: pr.left - cr.left,
    top: pr.top - cr.top,
    width: pr.width,
    height: pr.height,
  };
}

function movePillToIndex(index, immediate = false) {
  if (!gooeyState) return;
  const { ul, pill, wrapper } = gooeyState;
  const li = ul.children[index];
  if (!li) return;

  [...ul.children].forEach((el, i) => el.classList.toggle('active', i === index));
  gooeyState.activeIndex = index;

  const rect = getItemRect(wrapper, li);
  const gsap = window.gsap;

  if (gsap) {
    gsap.killTweensOf(pill);
    if (immediate) {
      gsap.set(pill, rect);
    } else {
      gsap.to(pill, {
        ...rect,
        duration: PILL_DUR,
        ease: PILL_EASE,
        overwrite: 'auto',
      });
    }
  } else {
    Object.assign(pill.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
  }
}

export function syncGooeyNavActive(sectionId) {
  if (!gooeyState || !sectionId) return;
  if (isGooeyNavScrollLocked()) {
    const lockedLi = gooeyState.ul.children[scrollLockIndex];
    const lockedId = sectionIdFromHref(lockedLi?.querySelector('a')?.getAttribute('href'));
    if (sectionId !== lockedId) return;
  }

  const items = [...gooeyState.ul.querySelectorAll('li')];
  const index = items.findIndex(
    (li) => sectionIdFromHref(li.querySelector('a')?.getAttribute('href')) === sectionId,
  );
  if (index >= 0 && index !== gooeyState.activeIndex) {
    movePillToIndex(index, false);
  }
}

export function initGooeyNav() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(min-width: 769px)').matches) return;

  const navLinks = document.getElementById('nav-links');
  if (!navLinks || navLinks.querySelector('.gooey-nav-container')) return;

  const sourceLinks = [...navLinks.querySelectorAll('a.card-nav-link')].filter(
    (a) => !a.classList.contains('card-nav-cta'),
  );
  if (!sourceLinks.length) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'gooey-nav-container';
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Primary');

  const pill = document.createElement('span');
  pill.className = 'gooey-pill';
  pill.setAttribute('aria-hidden', 'true');

  const ul = document.createElement('ul');
  let activeIndex = sourceLinks.findIndex((a) => a.classList.contains('active'));
  if (activeIndex < 0) activeIndex = 0;

  sourceLinks.forEach((src, index) => {
    const li = document.createElement('li');
    if (index === activeIndex) li.classList.add('active');

    const a = document.createElement('a');
    a.href = src.getAttribute('href') || '#';
    a.textContent = src.textContent.trim();

    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href) return;
      const id = sectionIdFromHref(href);
      const onPage = id && document.getElementById(id);
      if (onPage) {
        e.preventDefault();
        lockGooeyNavForScroll(index);
        movePillToIndex(index, false);
        scrollToSection(href);
        document.querySelectorAll('.card-nav-link:not(.card-nav-cta)').forEach((link, i) => {
          link.classList.toggle('active', i === index);
        });
        return;
      }
      if (href.includes('.html')) {
        e.preventDefault();
        window.location.href = href;
      }
    });

    li.appendChild(a);
    ul.appendChild(li);
  });

  nav.appendChild(pill);
  nav.appendChild(ul);
  wrapper.appendChild(nav);
  navLinks.insertBefore(wrapper, navLinks.firstChild);
  document.body.classList.add('has-gooey-nav');

  gooeyState = { ul, pill, wrapper, activeIndex };
  movePillToIndex(activeIndex, true);

  let resizeRaf = 0;
  const onResize = () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      if (window.innerWidth < 769 || !gooeyState) return;
      movePillToIndex(gooeyState.activeIndex, true);
    });
  };
  new ResizeObserver(onResize).observe(wrapper);
  window.addEventListener('resize', onResize, { passive: true });
}

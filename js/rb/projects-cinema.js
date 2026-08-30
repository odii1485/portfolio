/**
 * Cinematic Projects Spread
 *
 * - Desktop: pinned 100vh stage with a GSAP timeline scrubbed by scroll.
 *   Each project spread animates IN (art slides + scales, title words
 *   reveal line-by-line, meta+CTA fade up), holds, then cross-fades OUT
 *   as the next one comes IN. Pager dot syncs to the active spread.
 *
 * - Mobile (<=900px) and prefers-reduced-motion: no pin, no scrub.
 *   Each spread becomes a normal stacked card with a simple reveal.
 *
 * - Flip card: "Read details" toggles `.is-flipped` on the active card,
 *   revealing the back face with full case-study copy.
 */

const DESKTOP_MQ = '(min-width: 901px)';

let activeTimeline = null;
let activeResizeHandler = null;

function isDesktop() {
  return window.matchMedia(DESKTOP_MQ).matches;
}

function isReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ── Flip card interaction ─────────────────────────────────── */
function bindFlipCards(root) {
  const flipOpen = (card) => {
    if (!card) return;
    root.querySelectorAll('[data-flip-card].is-flipped').forEach((c) => {
      if (c !== card) c.classList.remove('is-flipped');
    });
    card.classList.add('is-flipped');
  };

  const flipClose = (card) => card?.classList.remove('is-flipped');

  root.querySelectorAll('[data-flip-trigger]').forEach((btn) => {
    if (btn.dataset.rbFlipBound) return;
    btn.dataset.rbFlipBound = '1';
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      const spread = btn.closest('.cinema-spread');
      const card = spread?.querySelector('[data-flip-card]');
      if (!card) return;
      if (card.classList.contains('is-flipped')) {
        flipClose(card);
      } else {
        flipOpen(card);
      }
    });
  });

  root.querySelectorAll('.cinema-card__close').forEach((btn) => {
    if (btn.dataset.rbFlipBound) return;
    btn.dataset.rbFlipBound = '1';
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      flipClose(btn.closest('[data-flip-card]'));
    });
  });
}

/* ── Desktop pinned timeline (wheel-hijack — one scroll = one card) ── */
function buildDesktopTimeline(root, stage, spreads) {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return null;

  const pager = root.querySelectorAll('[data-cinema-pager]');
  const setActivePager = (idx) => {
    pager.forEach((p, i) => p.classList.toggle('is-active', i === idx));
  };
  const projectCount = spreads.length;

  // Pre-set initial states
  spreads.forEach((spread, i) => {
    const isFirst = i === 0;
    const art = spread.querySelector('.cinema-spread__art');
    const words = spread.querySelectorAll('.cinema-spread__word');
    const meta = spread.querySelectorAll(
      '.cinema-spread__icon, .cinema-spread__meta, .cinema-spread__lede, .cinema-spread__cta',
    );

    gsap.set(spread, {
      autoAlpha: isFirst ? 1 : 0,
      scale: isFirst ? 1 : 0.96,
      xPercent: isFirst ? 0 : 8,
    });

    if (isFirst) {
      gsap.set(art, { x: 0, scale: 1, opacity: 1 });
      gsap.set(words, { yPercent: 0, opacity: 1 });
      gsap.set(meta, { y: 0, opacity: 1 });
    } else {
      gsap.set(art, { x: -60, scale: 0.94, opacity: 0 });
      gsap.set(words, { yPercent: 110, opacity: 0 });
      gsap.set(meta, { y: 18, opacity: 0 });
    }
  });

  setActivePager(0);

  // Master timeline — PAUSED. Manually advanced via tweenTo() on wheel events or pager clicks.
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });
  tl.addLabel('seg0');

  for (let i = 1; i < projectCount; i++) {
    const prev = spreads[i - 1];
    const spread = spreads[i];
    const art = spread.querySelector('.cinema-spread__art');
    const words = spread.querySelectorAll('.cinema-spread__word');
    const meta = spread.querySelectorAll(
      '.cinema-spread__icon, .cinema-spread__meta, .cinema-spread__lede, .cinema-spread__cta',
    );

    tl.call(() => {
      prev.querySelector('[data-flip-card].is-flipped')?.classList.remove('is-flipped');
      spread.querySelector('[data-flip-card].is-flipped')?.classList.remove('is-flipped');
    });

    tl.to(prev, { autoAlpha: 0, scale: 0.95, xPercent: -8, duration: 0.32 }, '>')
      .to(spread, { autoAlpha: 1, scale: 1, xPercent: 0, duration: 0.4 }, '<+0.04')
      .to(art, { x: 0, scale: 1, opacity: 1, duration: 0.45 }, '<')
      .to(words, { yPercent: 0, opacity: 1, stagger: 0.05, duration: 0.45 }, '<+0.08')
      .to(meta, { y: 0, opacity: 1, stagger: 0.04, duration: 0.35 }, '<+0.14');

    tl.addLabel(`seg${i}`);
  }

  // ── Wheel / keyboard / touch / pager click interaction ─────
  let currentIndex = 0;
  let isAnimating = false;
  let lastWheelAt = 0;
  let pinActive = false;

  const advanceTo = (target) => {
    if (target === currentIndex || target < 0 || target >= projectCount) return false;
    isAnimating = true;
    currentIndex = target;
    setActivePager(target);
    tl.tweenTo(`seg${target}`, {
      duration: 0.55,
      ease: 'power2.out',
      onComplete: () => {
        isAnimating = false;
      },
    });
    return true;
  };

  pager.forEach((dot, idx) => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      advanceTo(idx);
    });
  });

  const consume = (e) => {
    // Stop the event before Lenis (which listens on window) can see it.
    e.preventDefault();
    e.stopImmediatePropagation();
  };

  const onWheel = (e) => {
    if (!pinActive) return;
    if (Math.abs(e.deltaY) < 4) return;

    const dir = e.deltaY > 0 ? 1 : -1;
    const target = currentIndex + dir;

    // At a boundary — let the wheel pass through to Lenis so the page
    // scrolls past the pin end and ScrollTrigger releases the pin.
    if (target < 0 || target >= projectCount) {
      return;
    }

    // Otherwise we consume the event entirely (no scroll, no Lenis).
    consume(e);

    // Throttle so trackpad inertia spam doesn't skip multiple cards.
    const now = performance.now();
    if (isAnimating || now - lastWheelAt < 90) return;
    lastWheelAt = now;
    advanceTo(target);
  };

  const onKey = (e) => {
    if (!pinActive || isAnimating) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      if (advanceTo(currentIndex + 1)) e.preventDefault();
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      if (advanceTo(currentIndex - 1)) e.preventDefault();
    }
  };

  let touchStartY = null;
  const onTouchStart = (e) => {
    if (!pinActive) return;
    if (e.touches?.length === 1) touchStartY = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    if (!pinActive || touchStartY === null || isAnimating) return;
    const delta = touchStartY - (e.touches?.[0]?.clientY ?? touchStartY);
    if (Math.abs(delta) < 40) return;
    const dir = delta > 0 ? 1 : -1;
    const target = currentIndex + dir;
    if (target < 0 || target >= projectCount) return;
    e.preventDefault();
    touchStartY = null;
    advanceTo(target);
  };
  const onTouchEnd = () => { touchStartY = null; };

  const attachInput = () => {
    if (pinActive) return;
    pinActive = true;
    // NOTE: do NOT lenis.stop() here. We need Lenis to handle the
    // boundary wheel event that releases the pin. Inside the
    // cinema sequence we use stopImmediatePropagation in onWheel
    // so Lenis simply never sees those events.
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
  };
  const detachInput = () => {
    if (!pinActive) return;
    pinActive = false;
    window.removeEventListener('wheel', onWheel, { capture: true });
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
  };

  // Tiny pin — just enough to engage, releases on first scroll past boundary.
  const st = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: '+=60',
    pin: true,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onEnter: attachInput,
    onEnterBack: attachInput,
    onLeave: detachInput,
    onLeaveBack: detachInput,
  });

  // Return an object that mimics gsap.timeline so teardown() works.
  return { scrollTrigger: st, kill: () => { detachInput(); st.kill(); tl.kill(); } };
}

/* ── Mobile fallback — simple stacked reveal ───────────────── */
function initMobileReveal(spreads) {
  if (!window.gsap || !window.ScrollTrigger) return;

  spreads.forEach((spread) => {
    spread.classList.add('cinema-spread--mobile');
    window.gsap.fromTo(
      spread,
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        ease: 'power2.out',
        duration: 0.55,
        scrollTrigger: {
          trigger: spread,
          start: 'top 88%',
          toggleActions: 'play none none reverse',
        },
      },
    );
  });

  window.ScrollTrigger?.refresh();
}

/* ── Lifecycle / resize handling ───────────────────────────── */
function teardown() {
  if (activeTimeline) {
    // New shape returns { scrollTrigger, kill } that owns its own cleanup.
    if (typeof activeTimeline.kill === 'function') {
      activeTimeline.kill();
    } else {
      activeTimeline.scrollTrigger?.kill();
    }
    activeTimeline = null;
  }
}

function mount(root) {
  const stage = root.querySelector('.cinema-stage');
  const spreads = [...root.querySelectorAll('.cinema-spread')];
  if (!stage || spreads.length === 0) return;

  bindFlipCards(root);

  if (isReducedMotion()) {
    root.classList.add('cinema-wrap--static');
    return;
  }

  if (isDesktop()) {
    activeTimeline = buildDesktopTimeline(root, stage, spreads);
  } else {
    initMobileReveal(spreads);
  }
}

export function initProjectsCinema() {
  const root = document.querySelector('[data-rb-projects-cinema]');
  if (!root) return;

  mount(root);

  // Re-mount on breakpoint change (debounced)
  let resizeTimer;
  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const shouldBeDesktop = isDesktop() && !isReducedMotion();
      const isCurrentlyDesktop = !!activeTimeline;
      if (shouldBeDesktop !== isCurrentlyDesktop) {
        teardown();
        // Reset inline styles GSAP applied
        root.querySelectorAll('.cinema-spread').forEach((s) => {
          s.style.cssText = '';
          s.querySelector('.cinema-spread__art')?.removeAttribute('style');
          s.querySelectorAll('.cinema-spread__word').forEach((w) => w.removeAttribute('style'));
          s.querySelectorAll('.cinema-spread__icon, .cinema-spread__meta, .cinema-spread__lede, .cinema-spread__cta')
            .forEach((el) => el.removeAttribute('style'));
        });
        mount(root);
      } else if (activeTimeline) {
        window.ScrollTrigger?.refresh();
      }
    }, 220);
  };

  activeResizeHandler = handleResize;
  window.addEventListener('resize', handleResize, { passive: true });
}

/* Back-compat export so older imports don't break */
export function initWorkScrollStack() {}

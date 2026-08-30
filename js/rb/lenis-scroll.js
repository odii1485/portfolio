/**
 * Lenis smooth-scroll integration.
 * Provides butter-smooth wheel scrolling and syncs with GSAP ScrollTrigger.
 *
 * Loaded from CDN via window.Lenis (see index.html script tag).
 */

export function initLenis() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.__lenis) return; // already initialized

  // Skip on touch / coarse-pointer devices. Mobile already has native
  // smooth scroll, and Lenis applies a transform to the scroll container
  // that breaks `position: fixed` (sticky CTA bar, etc.).
  const isTouch =
    window.matchMedia('(hover: none)').matches ||
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 900px)').matches;
  if (isTouch) return;

  if (typeof window.Lenis !== 'function') {
    console.warn('[Rahul Web] Lenis library not loaded; smooth scroll disabled.');
    return;
  }

  const lenis = new window.Lenis({
    duration: 1.05,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    smoothWheel: true,
    touchMultiplier: 1.6,
    wheelMultiplier: 1.0,
    lerp: 0.1,
  });

  // Drive ScrollTrigger updates from Lenis scroll events
  if (window.ScrollTrigger) {
    lenis.on('scroll', () => window.ScrollTrigger.update());
  }

  // Drive Lenis from GSAP's ticker if available, otherwise our own rAF loop
  if (window.gsap?.ticker) {
    window.gsap.ticker.add((time) => lenis.raf(time * 1000));
    window.gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  window.__lenis = lenis;
}

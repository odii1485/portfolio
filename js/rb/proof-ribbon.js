/**
 * Credential shards — staggered entrance + continuous shiny sweep loop.
 * Each shard sweeps every ~6s, offset by 400ms per shard so the glow
 * travels through the row like a wave. Pauses when the section is
 * off-screen to save the GPU.
 */

import { runBorderGlowSweep } from './border-glow.js';

/* One full sweep is ~4s (see runBorderGlowSweep timing); we wait a
 * comfortable beat after that before triggering the next one. */
const LOOP_INTERVAL_MS = 6000;
/* Per-shard offset so the wave travels left-to-right. */
const SHARD_STAGGER_MS = 400;
/* First sweep delay after section becomes visible. */
const INITIAL_DELAY_MS = 280;

function startContinuousSweeps(section) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (section.dataset.rbProofLoop === '1') return;
  section.dataset.rbProofLoop = '1';

  const shards = [...section.querySelectorAll('.proof-ribbon-shard.border-glow-card')];
  if (!shards.length) return;

  let isVisible = true; // we are called from an io-fired callback already in-view
  const timers = [];

  const sweep = (shard) => {
    if (!isVisible) return;
    if (!shard.isConnected) return;
    if (shard.classList.contains('sweep-active')) return; // skip if a sweep is mid-run
    runBorderGlowSweep(shard);
  };

  shards.forEach((shard, i) => {
    const initialOffset = INITIAL_DELAY_MS + i * SHARD_STAGGER_MS;
    const startTimer = setTimeout(() => {
      sweep(shard);
      const intervalId = setInterval(() => sweep(shard), LOOP_INTERVAL_MS);
      timers.push(() => clearInterval(intervalId));
    }, initialOffset);
    timers.push(() => clearTimeout(startTimer));
  });

  // Pause loop while section is off-screen so we're not burning the
  // GPU on invisible animations.
  const visibilityIO = new IntersectionObserver(
    (entries) => {
      isVisible = entries.some((e) => e.isIntersecting);
    },
    { threshold: 0.05 }
  );
  visibilityIO.observe(section);
  timers.push(() => visibilityIO.disconnect());
}

export function initProofRibbon() {
  const section = document.querySelector('.proof-ribbon');
  if (!section) return;

  if (window.matchMedia('(max-width: 768px)').matches) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    section.classList.add('is-animated');
    return;
  }

  if (section.classList.contains('is-animated')) return;

  const entranceIO = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      section.classList.add('is-animated');
      startContinuousSweeps(section);
      entranceIO.disconnect();
    },
    { threshold: 0.18, rootMargin: '0px 0px -48px 0px' }
  );

  entranceIO.observe(section);
}

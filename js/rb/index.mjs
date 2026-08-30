/**

 * React-Bits redesign — single orchestrator (vanilla ports).

 */

import { initReactBitsBackgrounds } from './backgrounds.mjs';

import { initRotatingText } from './rotating-text.js';

import { initProfileCard } from './profile-card.js';

import { initBorderGlow } from './border-glow.js';

import { initGlassSurface } from './glass-surface.js';

import { initReactBitsNav } from './nav.js';

import { initVariableProximity } from './variable-proximity.js';

import { initLogoLoop } from './logo-loop.js';

import { initGradualBlur } from './gradual-blur.js';

import { initImageTrail } from './image-trail.js';

import { initScrollStack } from './scroll-stack.js';
import { initServicesHover } from './services-hover.js';
import { initProjectsCinema } from './projects-cinema.js';
import { initLenis } from './lenis-scroll.js';

import { initCertGallery } from './cert-gallery.js';

import { initCertMobileCarousel } from './cert-mobile.js';

import { initA11yPolish } from './a11y-polish.js';
import { initServicesBackgrounds } from './services-bg.js';
import { initBlurText } from './blur-text.js';
import { initPlatformSpotlight } from './platform-spotlight.js';
import { initProofRibbon } from './proof-ribbon.js';



export function initReactBits() {

  const steps = [

    ['lenis', initLenis],

    ['a11yPolish', initA11yPolish],

    ['servicesBg', initServicesBackgrounds],
    ['backgrounds', initReactBitsBackgrounds],

    ['glass', initGlassSurface],

    ['rotatingText', initRotatingText],
    ['blurText', initBlurText],

    ['profileCard', initProfileCard],

    ['nav', initReactBitsNav],

    ['variableProximity', initVariableProximity],

    ['logoLoop', initLogoLoop],

    ['platformSpotlight', initPlatformSpotlight],

    ['proofRibbon', initProofRibbon],

    ['gradualBlur', initGradualBlur],

    ['scrollStack', initScrollStack],

    ['servicesHover', initServicesHover],

    ['borderGlow', initBorderGlow],

    ['projectsCinema', initProjectsCinema],

    ['imageTrail', initImageTrail],

    ['certGallery', initCertGallery],

    ['certMobile', initCertMobileCarousel],

  ];



  for (const [name, fn] of steps) {

    try {

      fn();

    } catch (err) {

      console.error(`[Rahul Web] React-Bits init failed (${name}):`, err);

    }

  }



  if (window.ScrollTrigger) {

    window.addEventListener('load', () => window.ScrollTrigger.refresh(), { once: true });

  }

}



function boot() {

  if (window.__rbMounted) return;

  window.__rbMounted = true;

  initReactBits();

}



if (document.readyState === 'loading') {

  document.addEventListener('DOMContentLoaded', boot);

} else {

  boot();

}



# Portfolio enhancement — 3-phase plan

Aligned with [React Bits](https://reactbits.dev) patterns already ported to vanilla JS (`js/rb/`).

## Design rules (all phases)

- **One hero effect per page** — no stacking Prism + Rays + Blinds on the same block.
- **Glass only on readable UI** — nav, docks, contact, schedule, service intros (not every card).
- **Background variety cap** — max ~6 effect types site-wide; sections share families intentionally.
- **`prefers-reduced-motion`** — static fallbacks, no WebGL orbit, no infinite marquees.

---

## Phase 1 — Foundation & parity (conversion + consistency)

**Goal:** Both pages feel like one product; performance and mobile CTA.

| # | Task | Files |
|---|------|--------|
| 1.1 | Services detail sections: Shape Grid (not Gradient Blinds) + scrim | `services-bg.js`, `index.mjs` order |
| 1.2 | Services hero: readability glass + Light Rays (subtle) | `services.html`, `rb-overrides.css` |
| 1.3 | Hero marquee → Logo Loop (already wired; verify) | `logo-loop.js` |
| 1.4 | Lazy-load Three.js only for Color Bends | `backgrounds.mjs` |
| 1.5 | Mobile sticky “Book a Call” bar | `index.html`, `style.css`, `main.js` |
| 1.6 | Reduced-motion: hide WebGL layers, keep layout | `a11y-polish.js`, `rb-overrides.css` |
| 1.7 | Recommendations + schedule glass frames | `index.html`, `glass-system.css` |

**Exit criteria:** `services.html` matches index polish; Lighthouse-friendly deferral; mobile CTA visible after scroll.

---

## Phase 2 — Motion & interaction (wow without noise)

**Goal:** Selective React-Bits text motion + Journey differentiation + cert a11y.

| # | Task | Files |
|---|------|--------|
| 2.1 | BlurText reveal on hero + services H1 | `blur-text.js`, `index.html`, `services.html` |
| 2.1b | Premium page loader (monogram, blur name, session first-visit, hero handoff) | `page-loader.css`, `page-loader.js`, `index.html`, `services.html` |
| 2.2 | Journey: Shape Grid (hex, slow) replaces Line Waves | `index.html` |
| 2.3 | Cert 3D gallery: keyboard ←/→ + focus hint | `cert-gallery.js`, `cert-gallery.css` |
| 2.4 | Impact counters: eased CountUp polish | `main.js` |
| 2.5 | Variable proximity on all Skills Atlas titles | `variable-proximity.js` (verify) |

**Exit criteria:** Journey visually distinct from Work; certs usable with keyboard; headings animate once on scroll.

---

## Phase 3 — Trust & discoverability (content + SEO)

**Goal:** Recruiter skim quality and search/social clarity.

| # | Task | Files |
|---|------|--------|
| 3.1 | Work modals: labelled Overview / Highlights / Outcome | `index.html`, `style.css` |
| 3.2 | JSON-LD `Person` + `WebSite` schema | `index.html` |
| 3.3 | `sitemap.xml` lastmod + `services.html` link | `sitemap.xml` |
| 3.4 | Schedule: glass Calendly shell + loading state | `index.html`, `glass-system.css` |
| 3.5 | CTA video: `preload="metadata"` + offscreen pause (extend a11y) | `index.html`, `a11y-polish.js` |

**Exit criteria:** Rich results eligible; modals scannable; Calendly doesn’t flash unstyled.

---

## Background map (target end state)

| Section | Background |
|---------|------------|
| Hero | Prism |
| About | Silk |
| Skills | Light Rays |
| Journey | Shape Grid (hex) |
| Work | Line Waves |
| Impact | Shape Grid |
| Services (index) | Line Waves |
| Certifications | Color Bends |
| Achievements | Shape Grid |
| Industries | Shape Grid |
| Recommendations | Line Waves (cool) |
| Schedule / Contact | Line Waves |
| Services page hero | Light Rays + Prism overlay optional off |
| Services details | Shape Grid (per section) |
| Services process | Line Waves (cool) — unchanged |

---

## Out of scope (intentionally)

- Dock, Particles everywhere, DecryptedText, global glass revival.
- More than 2 new WebGL effect types beyond current set.

---

## Next steps (completed)

| # | Task | Status |
|---|------|--------|
| N.1 | BlurText on Skills `big-heading` (“A complete … toolkit”) | Done |
| N.2 | Mobile sticky CTA on `services.html` (Book a Call → schedule, Contact) | Done |
| N.3 | Work modals: Challenge → Approach → What I owned → Key results → Outcome | Done |

## Phase 4a — Premium polish (completed)

| # | Task | Status |
|---|------|--------|
| 4a.1 | Proof strip under hero marquee | Done |
| 4a.2 | Designed OG card (`assets/og-card.svg` + `assets/og-card.png`) + meta | Done |
| 4a.3 | Services hero: remove CDN video; Light Rays + glass (match home) | Done |
| 4b.1 | Services backgrounds: stronger grids, Prism hero, per-section tints, hover | Done |

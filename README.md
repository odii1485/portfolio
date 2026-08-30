# Rahul Odedra — Portfolio

Personal portfolio site for **Rahul Odedra**, Consultant QA Engineer at Astound Digital — specialising in Salesforce (B2B, Sales, Experience, Commerce Cloud), Shopify, manual, API, and performance testing.

**Live site:** [https://rahul-odedra.netlify.app/](https://rahul-odedra.netlify.app/)

---

## Highlights

- **Premium editorial layout** — champagne / seafoam palette, glass readability layers, editorial work showcase
- **React Bits (vanilla ports)** — Prism, Silk, Light Rays, Shape Grid, Line Waves, Color Bends, 3D cert gallery, gooey nav, blur text, logo loop, and more (`js/rb/`)
- **Two pages** — `index.html` (portfolio) and `services.html` (seven QA service deep-dives)
- **Accessibility** — reduced-motion fallbacks, keyboard cert gallery, focus-friendly modals
- **SEO & social** — JSON-LD, sitemap, designed OG card (`assets/og-card.png`)
- **Case studies** — five project cards with modal detail (challenge → approach → metrics → outcome)

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Markup | Static HTML5 |
| Styles | CSS (design tokens in `css/style.css`, modules in `css/`) |
| Scripts | Vanilla JS + ES modules |
| Motion | [GSAP](https://greensock.com/gsap/) + ScrollTrigger |
| WebGL | OGL (Prism, Silk, Light Rays, Line Waves), Three.js (Color Bends, lazy-loaded) |
| 3D certs | Custom carousel (`js/rb/cert-gallery.js`) |
| Local server | `npx serve` via npm |

No build step required for production — deploy the repo root as static files.

---

## Quick start

```bash
npm install   # optional — only defines dev script
npm start     # serves on http://localhost:3000
```

Or double-click `start-dev.bat` (Windows).

Open `index.html` over `file://` for a quick preview; **WebGL backgrounds and ES modules need HTTP** — use `npm start` for the full experience.

---

## Project structure

```
├── index.html              # Home — hero, skills, work, certs, contact
├── services.html           # Services — 7 offerings + process section
├── css/
│   ├── style.css           # Core layout & tokens
│   ├── react-bits.css      # Component styles (nav, cards, modals)
│   ├── rb-overrides.css    # Section backgrounds & WebGL shells
│   ├── glass-system.css    # Readability glass (nav, contact, schedule)
│   ├── premium-skills-work.css
│   ├── cert-gallery.css
│   └── blur-text.css
├── js/
│   ├── main.js             # Scroll, modals, counters, nav spy
│   ├── rb-boot.js          # Loads js/rb/index.mjs
│   └── rb/                 # React-Bits vanilla ports & orchestration
├── assets/
│   ├── projects/           # Work section imagery (5 case studies)
│   ├── certifications/     # Cert badges & media
│   ├── og-card.png         # Link preview (1200×630)
│   ├── linkedin-banner.png # Profile cover (1584×396)
│   ├── linkedin-post.png   # Feed post (1080×1350)
│   └── LINKEDIN-ASSETS.md  # Which asset to use where
├── docs/
│   └── ENHANCEMENT-PHASES.md
├── resume.pdf
├── sitemap.xml
└── package.json
```

---

## Pages

### Home (`index.html`)

| Section | Background (typical) |
|---------|----------------------|
| Hero | Prism + profile card |
| About | Silk |
| Skills | Light Rays |
| Journey | Shape Grid (hex) |
| Work | Line Waves + editorial cards |
| Certifications | Color Bends + 3D gallery |
| Contact / Schedule | Line Waves + glass panels |

### Services (`services.html`)

| Area | Notes |
|------|--------|
| Hero | Prism + glass intro |
| 7 × service detail | Per-section shape grid + industry tint |
| Process | Line Waves (cool) — “How we'll work together” |
| Nav | In-page: Overview, Process; links home for Work / Book a Call |

---

## Deploy (Netlify)

1. Connect the GitHub repo to Netlify.
2. **Build command:** leave empty (static site).
3. **Publish directory:** `/` (repo root).
4. Ensure `assets/`, `js/rb/`, and certification media are included in the deploy.
5. After deploy, refresh social previews:
   - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
   - [Meta Sharing Debugger](https://developers.facebook.com/tools/debug/)

Custom domain (if used): update `canonical`, `og:url`, and JSON-LD URLs in `index.html` / `services.html`.

---

## Assets & branding

- **Favicon:** `favicon.svg`
- **OG / Twitter:** `assets/og-card.png` (not the profile photo)
- **LinkedIn cover:** `assets/linkedin-banner.png` — text sits right of profile photo safe zone
- **LinkedIn post image:** `assets/linkedin-post.png` — portrait 4:5 for feed posts

See `assets/LINKEDIN-ASSETS.md` and `assets/projects/README.md`.

---

## Design principles

- One strong background effect per hero block (no stacked WebGL noise).
- Glass only where text must read over motion (nav, docks, contact, schedule).
- Client-neutral copy and imagery in the work section (industry themes only).
- `prefers-reduced-motion`: WebGL hidden, layout preserved.

Full enhancement log: `docs/ENHANCEMENT-PHASES.md`.

---

## Credits

- UI patterns inspired by [React Bits](https://reactbits.dev), implemented as vanilla JS in `js/rb/`
- Fonts: [Inter](https://fonts.google.com/specimen/Inter), [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) (Google Fonts)
- GSAP, OGL, Three.js via CDN / dynamic import

---

## Contact

- **Email:** rahulodedra1485@gmail.com
- **LinkedIn:** [rahul-odedra](https://www.linkedin.com/in/rahul-odedra-48405817a/)
- **Résumé:** `resume.pdf` on the site

© 2026 Rahul Odedra. All rights reserved.

/* ════════════════════════════════════════════
   RAHUL ODEDRA — Premium Portfolio JS
   GSAP-powered, Astound Digital-inspired
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
    }

    /* ───── Custom Cursor (desktop only) ───── */
    const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches
        && window.innerWidth > 1024;

    if (isDesktop) {
        const dot = document.getElementById('cursor-dot');
        const ring = document.getElementById('cursor-ring');

        if (dot && ring) {
            let mx = window.innerWidth / 2, my = window.innerHeight / 2;
            let dx = mx, dy = my;
            let rx = mx, ry = my;
            let rafId = null;
            let needsRender = true;

            const RING_LERP = 0.28; // quicker catch-up = less "laggy" feeling
            const DOT_LERP  = 0.55;

            const render = () => {
                if (document.hidden) {
                    rafId = requestAnimationFrame(render);
                    return;
                }

                dx += (mx - dx) * DOT_LERP;
                dy += (my - dy) * DOT_LERP;
                rx += (mx - rx) * RING_LERP;
                ry += (my - ry) * RING_LERP;

                dot.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;
                ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;

                // keep animating while there is motion remaining, otherwise idle
                const moving =
                    Math.abs(mx - dx) > 0.1 || Math.abs(my - dy) > 0.1 ||
                    Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1;
                if (moving || needsRender) {
                    needsRender = false;
                    rafId = requestAnimationFrame(render);
                } else {
                    rafId = null;
                }
            };

            const wake = () => {
                needsRender = true;
                if (!rafId) rafId = requestAnimationFrame(render);
            };

            document.addEventListener('pointermove', (e) => {
                mx = e.clientX;
                my = e.clientY;
                wake();
            }, { passive: true });

            // Delegated hover detection (much cheaper than per-element listeners)
            const hoverSelector = '[data-cursor="hover"], a, button, input, textarea, select, [role="button"]';
            document.addEventListener('pointerover', (e) => {
                const target = e.target instanceof Element ? e.target.closest(hoverSelector) : null;
                document.body.classList.toggle('cursor-hover', !!target);
            }, { passive: true });
            document.addEventListener('pointerout', (e) => {
                const related = e.relatedTarget instanceof Element ? e.relatedTarget.closest(hoverSelector) : null;
                if (!related) document.body.classList.remove('cursor-hover');
            }, { passive: true });

            wake();
        }
    }

    /* ───── Mobile Navigation ───── */
    const toggle = document.getElementById('nav-toggle');
    const closeBtn = document.getElementById('nav-close');
    const links = document.getElementById('nav-links');
    const mobileNavMq = window.matchMedia('(max-width: 768px)');

    const setMobileNavOpen = (open) => {
        if (!toggle || !links) return;
        const useSimpleNav =
            mobileNavMq.matches ||
            document.body.classList.contains('page-services') ||
            document.body.classList.contains('nav-menu-fallback') ||
            !links.querySelector('.rb-flowing-menu-host .menu__item');

        if (useSimpleNav) {
            document.body.classList.add('nav-menu-fallback');
        }

        toggle.classList.toggle('open', open);
        links.classList.toggle('open', open);
        document.body.classList.toggle('nav-menu-open', open);
        document.documentElement.classList.toggle('nav-menu-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
        closeBtn?.setAttribute('aria-hidden', open ? 'false' : 'true');

        // Stop / start smooth scroll while the menu covers the page so
        // the page underneath can't be wheel-scrolled.
        if (open) {
            window.__lenis?.stop();
        } else {
            window.__lenis?.start();
        }

        links.querySelectorAll('[data-rb-flowing-menu]').forEach((host) => {
            host.setAttribute('aria-hidden', open && !useSimpleNav ? 'false' : 'true');
        });
    };

    const closeMobileNav = () => setMobileNavOpen(false);

    if (toggle && links) {
        toggle.addEventListener('click', () => {
            setMobileNavOpen(!links.classList.contains('open'));
        });
        closeBtn?.addEventListener('click', closeMobileNav);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && links.classList.contains('open')) closeMobileNav();
        });
        links.querySelectorAll('a').forEach((a) => {
            a.addEventListener('click', closeMobileNav);
        });
    }

    /* ───── Sticky Navbar ───── */
    const navbar = document.getElementById('navbar');
    const updateNav = () => navbar.classList.toggle('scrolled', window.scrollY > 60);
    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });

    /* ───── Reveal-on-scroll Observer ───── */
    const reveals = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                const idx = Array.from(entry.target.parentElement?.children || [])
                    .indexOf(entry.target);
                entry.target.style.transitionDelay = `${Math.min(i * 60, 240)}ms`;
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(el => revealObserver.observe(el));

    /* ───── Active Nav on Scroll (most-visible section wins) ───── */
    const navAnchors = document.querySelectorAll('.nav-links .card-nav-link:not(.card-nav-cta), .nav-links a:not(.nav-cta)');
    const isServicesPage = !!document.getElementById('services-hero');
    const pageFile = window.location.pathname.split('/').pop() || 'index.html';

    const navTargetId = (href) => {
        if (!href) return '';
        if (href.startsWith('#')) return href.slice(1);
        try {
            const u = new URL(href, window.location.href);
            const samePage = u.pathname.endsWith(pageFile) || u.pathname === window.location.pathname;
            return samePage && u.hash ? u.hash.slice(1) : '';
        } catch {
            return '';
        }
    };

    const onPageNavIds = new Set();
    navAnchors.forEach((a) => {
        const id = navTargetId(a.getAttribute('href') || '');
        if (id) onPageNavIds.add(id);
    });

    let sections = document.querySelectorAll('section[id]');
    if (isServicesPage && onPageNavIds.size) {
        const serviceDetailIds = [...document.querySelectorAll('.service-detail[id]')].map((s) => s.id);
        const spyIds = new Set([...onPageNavIds, ...serviceDetailIds]);
        sections = document.querySelectorAll(
            [...spyIds].map((id) => `section#${CSS.escape(id)}`).join(', '),
        );
    }

    const sectionRatios = new Map();
    let navScrollRaf = 0;
    let lastNavId = '';

    const navHighlightId = (visibleId) => {
        if (!visibleId) return '';
        if (onPageNavIds.has(visibleId)) return visibleId;
        if (isServicesPage && visibleId !== 'services-hero' && visibleId !== 'services-process') {
            if (document.querySelector(`.service-detail#${CSS.escape(visibleId)}`)) {
                return onPageNavIds.has('services-hero') ? 'services-hero' : visibleId;
            }
        }
        return '';
    };

    const applyActiveSection = (id) => {
        const highlightId = navHighlightId(id);
        if (!highlightId || highlightId === lastNavId) return;
        if (typeof window.__rbGooeyScrollLocked === 'function' && window.__rbGooeyScrollLocked()) {
            return;
        }
        lastNavId = highlightId;
        navAnchors.forEach(a => a.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${highlightId}"], .nav-links a[href$="#${highlightId}"]`);
        if (active) active.classList.add('active');
        if (typeof window.__rbSyncGooeyNav === 'function') window.__rbSyncGooeyNav(highlightId);
    };

    const pickActiveSection = () => {
        let bestId = '';
        let bestRatio = 0;
        sectionRatios.forEach((ratio, id) => {
            if (ratio > bestRatio) {
                bestRatio = ratio;
                bestId = id;
            }
        });
        if (bestId && bestRatio >= 0.12) applyActiveSection(bestId);
    };

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            sectionRatios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        cancelAnimationFrame(navScrollRaf);
        navScrollRaf = requestAnimationFrame(pickActiveSection);
    }, { threshold: [0, 0.12, 0.25, 0.4, 0.55, 0.7] });
    sections.forEach(s => navObserver.observe(s));

    /* ───── Counter Roll Animation ───── */
    const counterEls = document.querySelectorAll('[data-count]');
    const animateCount = (el) => {
        if (el.dataset.counted) return;
        el.dataset.counted = '1';
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const duration = 2000;
        const start = performance.now();
        const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

        const step = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const value = target * easeOutExpo(p);
            el.textContent = (target % 1 === 0
                ? Math.round(value)
                : value.toFixed(1)) + suffix;
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCount(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    counterEls.forEach(el => counterObserver.observe(el));

    /* ───── Skill Bars + Percentage Counter Animation ───── */
    const skillBars = document.querySelectorAll('.skill-bar');
    const skillAtlasMeters = document.querySelectorAll('.skills-atlas-meter[data-fill]');

    const animateSkillPct = (el, target) => {
        const duration = 1600;
        const start = performance.now();
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const step = (now) => {
            const p = Math.min((now - start) / duration, 1);
            el.textContent = `${Math.round(target * easeOut(p))}%`;
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const meter = entry.target.querySelector('.skill-meter');
            const pct = entry.target.querySelector('.skill-pct');

            if (meter) {
                const fill = meter.dataset.fill || '0';
                meter.style.setProperty('--target', `${fill}%`);
                requestAnimationFrame(() => meter.classList.add('filled'));
            }
            if (pct) {
                const target = parseInt(pct.dataset.target || '0', 10);
                animateSkillPct(pct, target);
            }
            skillObserver.unobserve(entry.target);
        });
    }, { threshold: 0.3, rootMargin: '0px 0px -40px 0px' });
    skillBars.forEach(el => skillObserver.observe(el));

    const skillAtlasObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const fill = entry.target.dataset.fill || '0';
            entry.target.style.setProperty('--fill', `${fill}%`);
            entry.target.classList.add('is-filled');
            skillAtlasObserver.unobserve(entry.target);
        });
    }, { threshold: 0.3, rootMargin: '0px 0px -40px 0px' });
    skillAtlasMeters.forEach(el => skillAtlasObserver.observe(el));

    /* ───── Mouse-follow glow on skill cards ───── */
    document.querySelectorAll('.skills-col, .skills-atlas-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
            card.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`);
        });
    });

    /* ───── GSAP Pinned Horizontal Scroll for Selected Work ───── */
    const pinWrap = document.getElementById('pin-wrap');
    const pinTrack = document.getElementById('pin-track');
    const progressFill = document.getElementById('pin-progress-fill');

    if (pinWrap && pinTrack && !document.querySelector('.work-editorial') && !document.querySelector('.work-v2-list') && window.gsap && window.ScrollTrigger && window.innerWidth > 768) {
        const buildPin = () => {
            const trackWidth = pinTrack.scrollWidth;
            const viewportWidth = window.innerWidth;
            const distance = trackWidth - viewportWidth + 80;

            if (distance <= 0) return;

            gsap.to(pinTrack, {
                x: -distance,
                ease: 'none',
                scrollTrigger: {
                    trigger: pinWrap,
                    start: 'top top',
                    end: () => `+=${distance + 200}`,
                    pin: true,
                    scrub: 1,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => {
                        if (progressFill) {
                            progressFill.style.width = `${(self.progress * 100).toFixed(2)}%`;
                        }
                    }
                }
            });
        };

        buildPin();
        window.addEventListener('resize', () => {
            ScrollTrigger.refresh();
        });
    }

    /* ───── Parallax for hero image (subtle) — desktop only; on phones it fights
       the dynamic toolbar and feels like the layout is "sinking" while scrolling ───── */
    const heroImg = document.querySelector('.hero-img-wrap');
    const enableHeroParallax = window.matchMedia('(min-width: 769px)').matches;
    if (heroImg && enableHeroParallax && window.gsap && window.ScrollTrigger) {
        gsap.to(heroImg, {
            yPercent: -8,
            ease: 'none',
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1
            }
        });
    }

    /* ───── Parallax CTA text ───── */
    const ctaLines = document.querySelectorAll('.parallax-text .cta-line');
    if (ctaLines.length && window.gsap && window.ScrollTrigger) {
        ctaLines.forEach((line, i) => {
            gsap.from(line, {
                y: 80,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '#cta-section',
                    start: 'top 75%'
                },
                delay: i * 0.12
            });
        });
    }

    /* ─────────────────────────────────────────────────────────────────
       Animation 1 — Cursor image-trail inside .cta-block ONLY
       Mousemove is bound to .cta-block (the centered content area —
       headline + sub + buttons), so thumbnails NEVER spawn over the
       "Let's Build" marquee or the empty section rails on the left
       and right. Desktop only, throttled by distance, capped
       concurrent images.
       ───────────────────────────────────────────────────────────────── */
    const ctaBlock = document.getElementById('cta-block');
    const ctaTrail = document.getElementById('cta-trail');
    if (ctaBlock && ctaTrail && isDesktop && !ctaBlock.dataset.rbImageTrail) {
        const trailImages = [
            'assets/projects/wine-b2b.jpg',
            'assets/projects/data-cloud-ai.jpg',
            'assets/projects/shopify-overhaul.jpg',
            'assets/projects/sfcc-personal-care.jpg',
            'assets/projects/travel-sfcc.jpg',
        ];
        // pre-cache so first spawn is instant
        trailImages.forEach(src => { const i = new Image(); i.src = src; });

        let lastSpawnX = -10000;
        let lastSpawnY = -10000;
        let lastMoveX  = 0;
        let lastMoveY  = 0;
        let imgIndex   = 0;
        const minDist  = 90;             // px between spawns
        const maxLive  = 12;             // safety cap on concurrent thumbs

        const spawn = (e) => {
            const rect = ctaBlock.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // distance throttle
            const sdx = x - lastSpawnX;
            const sdy = y - lastSpawnY;
            if (Math.hypot(sdx, sdy) < minDist) {
                lastMoveX = x; lastMoveY = y;
                return;
            }

            // direction of motion (for drift)
            const mdx = x - lastMoveX;
            const mdy = y - lastMoveY;
            const mLen = Math.hypot(mdx, mdy) || 1;
            const driftX = (mdx / mLen) * 60;
            const driftY = (mdy / mLen) * 60;

            // concurrency cap — drop the oldest
            while (ctaTrail.children.length >= maxLive) {
                ctaTrail.removeChild(ctaTrail.firstChild);
            }

            const img = document.createElement('img');
            img.src = trailImages[imgIndex % trailImages.length];
            img.alt = '';
            img.className = 'cta-trail-img';
            img.style.left = `${x}px`;
            img.style.top  = `${y}px`;
            img.style.setProperty('--r',  `${(Math.random() * 16 - 8).toFixed(2)}deg`);
            img.style.setProperty('--dx', `${driftX.toFixed(2)}px`);
            img.style.setProperty('--dy', `${driftY.toFixed(2)}px`);
            ctaTrail.appendChild(img);

            // self-cleanup once the keyframe finishes
            img.addEventListener('animationend', () => img.remove(), { once: true });

            imgIndex++;
            lastSpawnX = x; lastSpawnY = y;
            lastMoveX  = x; lastMoveY  = y;
        };

        ctaBlock.addEventListener('mousemove', spawn);
        ctaBlock.addEventListener('mouseleave', () => {
            // reset throttle so a fresh re-entry spawns immediately
            lastSpawnX = -10000;
            lastSpawnY = -10000;
        });
    }

    /* ─────────────────────────────────────────────────────────────────
       Animation 2 — Sticky-stack service rows
       ──────────────────────────────────────────────────────────────
       The stacking effect itself is pure CSS (`position: sticky` on
       each .svc-row.svc-stack — see style.css). All this JS does is
       inject the colored left-edge accent bar into each row.
       ───────────────────────────────────────────────────────────── */
    document.querySelectorAll('#services .svc-row').forEach((row) => {
        if (!row.querySelector('.svc-accent-bar')) {
            const bar = document.createElement('span');
            bar.className = 'svc-accent-bar';
            bar.setAttribute('aria-hidden', 'true');
            row.prepend(bar);
        }
    });

    queueMicrotask(() => window.__initServicesHover?.());
    window.addEventListener('load', () => window.__initServicesHover?.(), { once: true });

    /* ───── Subtle 3D tilt on work cards ───── */
    document.querySelectorAll('.work-card:not(.work-card-cta)').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 4;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * -4;
            card.style.transform =
                `translateY(-8px) perspective(900px) rotateY(${x}deg) rotateX(${y}deg)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    /* ───── Mouse-follow glow on industry cards ───── */
    document.querySelectorAll('.ind-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
            card.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`);
        });
    });

    /* ───── Magnetic hover for primary CTAs ───── */
    if (isDesktop) {
        document.querySelectorAll('.cta-primary, .cta-secondary, .nav-cta').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = (e.clientX - rect.left - rect.width / 2) * 0.18;
                const y = (e.clientY - rect.top - rect.height / 2) * 0.18;
                btn.style.transform = `translate(${x}px, ${y}px)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }

    /* ───── Project Detail Modal ───── */
    const projectData = {
        'wine-b2b': {
            tag: 'Wine & Spirits · QA Lead · Live',
            title: 'B2B Commerce Platform — Wine & Spirits',
            role: 'QA Lead',
            industry: 'Wine & Spirits / B2B',
            duration: '2026 — Present',
            image: 'assets/projects/wine-b2b.jpg',
            problem: 'Enterprise B2B rollout with tiered contract pricing, distributor hierarchies, and ERP-linked orders — any pricing or sync defect blocks trade-partner revenue.',
            approach: 'Risk-based QA strategy first, then layered functional, API, and UAT coverage across catalogs, bulk reorder, and integration touchpoints before each release train.',
            metrics: [
                'Zero P1 escapes target on governed release gates',
                'Full distributor journey covered — desktop, mobile, and API contracts',
                'UAT sign-off with distributors and internal stakeholders each sprint'
            ],
            overview: "Currently leading QA for a Salesforce B2B Commerce rollout in the wine & spirits sector — an enterprise platform serving distributors and trade partners. The work spans complex account hierarchies, contract pricing, bulk reorder flows, and tight ERP integration.",
            responsibilities: [
                'Authoring the master QA strategy and test plan covering account hierarchies, entitlements, catalogs, and B2B-specific commerce flows',
                'Validating tier-based contract pricing, volume discounts, and customer-specific price books across distributor segments',
                'Designing test cases for bulk reorder workflows, quick-order forms, and recurring purchase flows',
                'End-to-end validation of storefront ↔ ERP integrations — order sync, inventory updates, and customer master data flows',
                'Cross-browser and mobile-device QA across the full distributor buying journey',
                'Postman API contract testing for internal commerce endpoints and partner integrations',
                'Coordinating UAT with client stakeholders, distributors, and trade partners'
            ],
            tech: ['Salesforce B2B Commerce', 'B2B Storefront', 'Contract Pricing', 'ERP Integration', 'Postman', 'JIRA', 'Confluence', 'Apex Console'],
            outcome: 'Live engagement — the platform is currently in active rollout with measurable improvements expected in distributor self-service adoption and order-cycle efficiency.'
        },

        'data-cloud-ai': {
            tag: 'Retail · QA Lead',
            title: 'Salesforce Data Cloud & AI Prediction Engine',
            role: 'QA Lead',
            industry: 'Retail',
            duration: 'Oct 2024 — Dec 2024',
            image: 'assets/projects/data-cloud-ai.jpg',
            problem: 'Retail client needed trusted unified customer data and AI-driven segments feeding Marketing Cloud — bad federation or scoring would mis-target campaigns at scale.',
            approach: 'Validated Snowflake BYOL mappings and DMOs with SQL checks, then regression-tested Calculated Insights, batch predictions, and end-to-end activation workflows against UAT criteria.',
            metrics: [
                'Multi-source federation verified across Snowflake views and DMOs',
                'RFM and propensity pipelines validated before MC activation',
                'Shipped without P1 escapes on segmentation releases'
            ],
            overview: "Led QA on a complex Salesforce Data Cloud build for a retail programme — combining BYOL data federation via Snowflake, AI-driven RFM and propensity-score predictions, and end-to-end Marketing Cloud activation. The work demanded validating both the data layer and the downstream marketing impact.",
            responsibilities: [
                'Collaborated with development and technical-architect teams to understand the Data Model design in Data Cloud, ensuring test strategy aligned with project architecture',
                'Designed and executed test cases for validating BYOL data federation setups — seamless integration of Snowflake views, accurate mapping of standard and custom DMOs',
                'Performed functional and regression testing for Calculated Insights, verifying RFM-analysis accuracy and compliance with client segmentation requirements',
                'Validated batch data transformations and batch prediction jobs for prediction-model inputs, ensuring consistency in propensity-score outputs',
                'Conducted end-to-end testing of customer segmentation and Marketing Cloud campaign activation workflows',
                'Created a comprehensive UAT Test Plan defining objectives, entry/exit criteria, and a detailed schedule for client validation',
                'Developed and executed SQL queries to validate database transformations and accuracy of cross-system data flows',
                'Managed SQL files in Bitbucket for version control and collaboration on validation scripts',
                'Documented test plans, results, and defect logs in Confluence for transparency and team traceability'
            ],
            tech: ['Salesforce Data Cloud', 'Snowflake', 'BYOL Federation', 'Marketing Cloud', 'Calculated Insights', 'SQL', 'Bitbucket', 'Confluence', 'JIRA'],
            outcome: 'Successfully validated complex multi-source data federation and AI-driven segmentation pipeline — enabling reliable RFM scoring and propensity-driven Marketing Cloud activations to ship without P1 escapes.'
        },

        'shopify-overhaul': {
            tag: 'Retail · QA Lead',
            title: 'Shopify E-Commerce Platform Overhaul',
            role: 'QA Lead',
            industry: 'Retail',
            duration: 'May 2024 — Aug 2024',
            image: 'assets/projects/shopify-overhaul.jpg',
            problem: 'Full Shopify replatform with aggressive timeline — checkout, catalog, and mobile parity had to hold while requirements evolved mid-sprint.',
            approach: 'Requirement-to-test-case traceability, smoke plus full regression each sprint, and tight dev/client loops on defects and scope risks.',
            metrics: [
                'Smoke, regression, integration, and mobile suites each release',
                'Cross-browser checkout and catalog flows signed off',
                'On-schedule delivery with strong client satisfaction scores'
            ],
            overview: "Led QA on a major Shopify platform transformation — from comprehensive requirement analysis through delivery, ensuring quality across every layer of the storefront and continuous communication with the client throughout.",
            responsibilities: [
                'Conducted comprehensive requirement analysis and task estimations on the Shopify platform',
                'Created detailed test cases covering smoke, regression, integration, component, and mobile testing',
                'Executed full-spectrum QA across all test types and devices — desktop, tablet, and mobile',
                'Logged and tracked bugs while identifying and documenting risks for proactive mitigation',
                'Drove timely defect resolution through tight collaboration with the development team',
                'Maintained regular client communication — providing updates, managing expectations, and gathering feedback throughout the testing lifecycle',
                'Ensured cross-browser compatibility and consistent UX across the merchant catalog and checkout flow'
            ],
            tech: ['Shopify', 'Mobile QA', 'Cross-Browser', 'Regression Testing', 'Integration Testing', 'JIRA', 'Zephyr'],
            outcome: 'Delivered a quality-assured platform overhaul on schedule with strong client satisfaction — recognised for ownership of the QA workstream and proactive client communication.'
        },

        'sfcc-personal-care': {
            tag: 'Consumer Goods · QA Engineer',
            title: 'SFCC Multi-Site Launch — Personal Care',
            role: 'QA Engineer',
            industry: 'Consumer Goods · Personal Care',
            duration: 'Mar 2024 — May 2024',
            image: 'assets/projects/sfcc-personal-care.jpg',
            problem: 'Parallel international SFCC sites with locale-specific pricing, tax, and content — inconsistency across markets would damage brand trust at launch.',
            approach: 'Per-market test matrices, coordinated cross-team test windows, and device/browser parity checks on shared components and locale variants.',
            metrics: [
                'Multiple regional sites launched in one program window',
                'Locale, currency, and tax rules validated per market',
                'Zero P1 production escapes post go-live'
            ],
            overview: "Managed comprehensive QA on Salesforce Commerce Cloud — delivering high-quality e-commerce across multiple international sites for a consumer personal-care programme.",
            responsibilities: [
                'Managed end-to-end QA activities across multiple SFCC sites for a multi-market personal-care programme',
                'Oversaw multiple site implementations, adapting testing strategy to meet diverse client and market requirements',
                'Collaborated with cross-functional teams — development, design, and business — to align QA with project objectives',
                'Coordinated testing efforts across teams to streamline processes and accelerate sprint outcomes',
                'Ensured optimal performance and consistent user experience across each market-specific site implementation',
                'Validated multi-locale content, currency, and tax rule variations across regions',
                'Conducted cross-browser and cross-device testing to verify visual and functional parity'
            ],
            tech: ['Salesforce Commerce Cloud', 'Multi-Site', 'Multi-Locale', 'UAT', 'Cross-Browser', 'Cross-Device', 'JIRA', 'Confluence'],
            outcome: 'Multiple personal-care market launches delivered with consistent UX and zero P1 production escapes across the multi-site footprint.'
        },

        'travel-sfcc': {
            tag: 'Travel & Hospitality · QA Engineer',
            title: 'Travel Platform SFCC Redesign & Priohub Integration',
            role: 'QA Engineer',
            industry: 'Hospitality · Travel Services',
            duration: 'Apr 2023 — Oct 2023',
            image: 'assets/projects/travel-sfcc.jpg',
            problem: 'SFCC redesign plus Priohub integration had to improve booking UX without breaking payments or partner services under peak traffic.',
            approach: 'Phased QA across redesign features and integration APIs, with regression on booking, payment, and third-party service paths each milestone.',
            metrics: [
                'Redesign and Priohub integration validated in sequence',
                'Booking and payment flows regression-tested each sprint',
                'Client-reported uplift in engagement and site traffic post-launch'
            ],
            overview: "Contributed to two consecutive QA programmes on an SFCC travel & hospitality platform — covering the redesign and Priohub third-party integration. Delivered measurable lifts in customer engagement and site traffic.",
            responsibilities: [
                'Contributed to QA activities for the SFCC platform redesign, ensuring high-quality deliverables met spec within tight deadlines',
                'Performed thorough testing of the Priohub integration — validating functionality and performance of third-party services',
                'Implemented comprehensive testing strategies to validate new features and platform enhancements',
                'Collaborated effectively with the development team — facilitating clear communication and timely problem resolution',
                'Validated booking flows, payment integrations, and partner-facing service touchpoints',
                'Received positive feedback from the client regarding customer response and uplift in site traffic post-redesign'
            ],
            tech: ['Salesforce Commerce Cloud', 'Priohub Integration', 'API Testing', 'Cross-Browser', 'JIRA', 'Confluence'],
            outcome: 'Client publicly acknowledged improved customer engagement and site-traffic uplift following the redesign — a direct result of the QA-led release stability.'
        }
    };

    const modal = document.getElementById('project-modal');
    const modalImg = document.getElementById('modal-image');
    const modalTag = document.getElementById('modal-tag');
    const modalRole = document.getElementById('modal-role');
    const modalIndustry = document.getElementById('modal-industry');
    const modalTitle = document.getElementById('modal-title');
    const modalOverview = document.getElementById('modal-overview');
    const modalProblem = document.getElementById('modal-problem');
    const modalApproach = document.getElementById('modal-approach');
    const modalMetrics = document.getElementById('modal-metrics');
    const modalProblemWrap = document.getElementById('modal-problem-wrap');
    const modalApproachWrap = document.getElementById('modal-approach-wrap');
    const modalMetricsWrap = document.getElementById('modal-metrics-wrap');
    const modalResponsibilities = document.getElementById('modal-responsibilities');
    const modalTech = document.getElementById('modal-tech');
    const modalOutcome = document.getElementById('modal-outcome');
    const modalOutcomeWrap = document.getElementById('modal-outcome-wrap');

    const fillModalSection = (wrap, el, value, asList = false) => {
        if (!wrap || !el) return;
        if (!value || (Array.isArray(value) && !value.length)) {
            wrap.style.display = 'none';
            return;
        }
        wrap.style.display = 'block';
        if (asList) {
            el.innerHTML = '';
            value.forEach((item) => {
                const li = document.createElement('li');
                li.textContent = item;
                el.appendChild(li);
            });
        } else {
            el.textContent = value;
        }
    };

    const openProjectModal = (id) => {
        const data = projectData[id];
        if (!data || !modal) return;

        modalImg.src = data.image;
        modalImg.alt = data.title;
        modalTag.textContent = data.tag;
        modalRole.textContent = data.role;
        modalIndustry.textContent = data.industry;
        modalTitle.textContent = data.title;
        modalOverview.textContent = data.overview;

        fillModalSection(modalProblemWrap, modalProblem, data.problem);
        fillModalSection(modalApproachWrap, modalApproach, data.approach);
        fillModalSection(modalMetricsWrap, modalMetrics, data.metrics, true);

        modalResponsibilities.innerHTML = '';
        data.responsibilities.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            modalResponsibilities.appendChild(li);
        });

        modalTech.innerHTML = '';
        data.tech.forEach(t => {
            const span = document.createElement('span');
            span.textContent = t;
            modalTech.appendChild(span);
        });

        if (data.outcome) {
            modalOutcome.textContent = data.outcome;
            modalOutcomeWrap.style.display = 'block';
        } else {
            modalOutcomeWrap.style.display = 'none';
        }

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    };

    const closeProjectModal = () => {
        if (!modal) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    };

    document.querySelectorAll('.work-card[data-project]').forEach(card => {
        card.addEventListener('click', () => openProjectModal(card.dataset.project));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openProjectModal(card.dataset.project);
            }
        });
    });

    document.querySelectorAll('[data-modal-close]').forEach(el => {
        el.addEventListener('click', (e) => {
            if (el.tagName === 'A' && el.getAttribute('href')) return;
            e.preventDefault();
            closeProjectModal();
        });
    });

    const modalCloseBtn = document.getElementById('modal-close');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeProjectModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
            closeProjectModal();
        }
    });

    /* ───── Certification carousel (v5 — DOM rotation) ─────
       True infinity-loop using DOM rotation. Each time a card scrolls
       fully past the left edge, it is *physically moved* to the right
       end of the track in the DOM. The same trick mirrored for "prev"
       (last card moves to the front). Because there's always a card on
       either side of the visible window, empty space is impossible —
       the next card slides into view the moment the previous one leaves.

       Track always holds 2N cards (N originals + N appended clones)
       so even the widest viewport sees a continuous strip. */
    const certWrap  = document.querySelector('[data-cert-scroll]');
    const certTrack = certWrap?.querySelector('.cert-scroll-track');
    if (certWrap && certTrack && !window.__certOrbitMode && !certWrap.classList.contains('cert-infinite-active')) {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!reduced) {
            certWrap.classList.remove('cert-infinite-active');
            certWrap.dataset.certCarouselJs = '1';
            const prepareCertCard = (card, isClone = false) => {
                // Carousel cards are dynamically moved/cloned, so they must not
                // depend on the one-time reveal observer to become visible.
                card.classList.remove('reveal');
                card.classList.add('visible');
                if (isClone) {
                    card.setAttribute('aria-hidden', 'true');
                    card.setAttribute('tabindex', '-1');
                    card.classList.add('cert-card-clone');
                }
            };

            Array.from(certTrack.children).forEach(card => prepareCertCard(card));

            // Append a single set of clones so we always have a buffer of
            // cards on the right — even after the first card has scrolled
            // off the left, there are still N cards visible.
            Array.from(certTrack.children).forEach(c => {
                const cl = c.cloneNode(true);
                prepareCertCard(cl, true);
                certTrack.appendChild(cl);
            });

            // Kill the CSS keyframe fallback now that JS is in charge.
            certTrack.style.animation = 'none';

            const gap = parseFloat(getComputedStyle(certTrack).gap) || 18;
            const cardStep = () => {
                const f = certTrack.querySelector('.cert-card');
                return (f?.offsetWidth || 282) + gap;
            };

            const SPEED        = 0.55;        // auto-scroll px/frame
            const ANIM_MS      = 550;         // arrow click animation duration
            const ANIM_EASE    = 'cubic-bezier(0.32, 0.72, 0, 1)';

            let offset         = 0;           // current translateX (≤ 0)
            let hoverPaused    = false;
            let interactPaused = false;
            let isAnimating    = false;
            let animTimer      = null;
            const isPaused     = () => hoverPaused || interactPaused;

            const applyTransform = () => {
                certTrack.style.transform = `translateX(${offset}px)`;
            };
            applyTransform();

            /* Continuous auto-scroll — every time the first card has
               fully slid off the left, recycle it to the back. This
               keeps the visible window full forever. */
            const tick = () => {
                if (!isPaused() && !isAnimating) {
                    offset -= SPEED;
                    applyTransform();

                    const step = cardStep();
                    if (offset <= -step) {
                        const first = certTrack.firstElementChild;
                        certTrack.appendChild(first);
                        offset += step;
                        applyTransform();
                    }
                }
                requestAnimationFrame(tick);
            };

            /* Arrow "next" — slide one card off the left, then move it
               to the back. Synchronous DOM rotation + offset reset at
               the end means no visible jump. */
            const next = () => {
                if (isAnimating) return;
                interactPaused = true;
                isAnimating    = true;

                const step = cardStep();
                offset -= step;
                certTrack.style.transition = `transform ${ANIM_MS}ms ${ANIM_EASE}`;
                applyTransform();

                clearTimeout(animTimer);
                animTimer = setTimeout(() => {
                    certTrack.style.transition = 'none';
                    const first = certTrack.firstElementChild;
                    certTrack.appendChild(first);
                    offset += step;
                    applyTransform();
                    void certTrack.offsetHeight;   // commit
                    certTrack.style.transition = '';
                    isAnimating    = false;
                    interactPaused = false;
                }, ANIM_MS + 20);
            };

            /* Arrow "prev" — pre-shift the LAST card to the front (with
               the offset compensated so the visual stays put), then
               animate the offset back to its previous value, revealing
               the new first card sliding in from the left. */
            const prev = () => {
                if (isAnimating) return;
                interactPaused = true;
                isAnimating    = true;

                const step = cardStep();

                // 1) Rotate DOM: last -> first (must be synchronous with
                //    the offset compensation, otherwise the visual jumps).
                const last = certTrack.lastElementChild;
                certTrack.insertBefore(last, certTrack.firstChild);
                offset -= step;
                certTrack.style.transition = 'none';
                applyTransform();
                void certTrack.offsetHeight;   // commit

                // 2) Now animate the offset back, sliding it into view.
                offset += step;
                certTrack.style.transition = `transform ${ANIM_MS}ms ${ANIM_EASE}`;
                applyTransform();

                clearTimeout(animTimer);
                animTimer = setTimeout(() => {
                    certTrack.style.transition = '';
                    isAnimating    = false;
                    interactPaused = false;
                }, ANIM_MS + 20);
            };

            certWrap.querySelector('.cert-nav-prev')?.addEventListener('click', prev);
            certWrap.querySelector('.cert-nav-next')?.addEventListener('click', next);

            certWrap.addEventListener('mouseenter', () => { hoverPaused = true; });
            certWrap.addEventListener('mouseleave', () => { hoverPaused = false; });
            certWrap.addEventListener('focusin',    () => { hoverPaused = true; });
            certWrap.addEventListener('focusout',   () => { hoverPaused = false; });

            /* Touch swipe — mobile / tablet */
            let touchStartX = 0;
            let touchStartOffset = 0;
            let touchDragging = false;

            certWrap.addEventListener(
                'touchstart',
                (e) => {
                    touchDragging = true;
                    interactPaused = true;
                    touchStartX = e.touches[0].clientX;
                    touchStartOffset = offset;
                    certTrack.style.transition = '';
                },
                { passive: true },
            );

            certWrap.addEventListener(
                'touchmove',
                (e) => {
                    if (!touchDragging) return;
                    const dx = e.touches[0].clientX - touchStartX;
                    offset = touchStartOffset + dx;
                    applyTransform();
                },
                { passive: true },
            );

            const endTouch = () => {
                if (!touchDragging) return;
                touchDragging = false;
                const step = cardStep();
                const moved = Math.abs(offset - touchStartOffset);
                if (moved > step * 0.18) {
                    if (offset < touchStartOffset) next();
                    else prev();
                } else {
                    offset = touchStartOffset;
                    certTrack.style.transition = `transform ${ANIM_MS}ms ${ANIM_EASE}`;
                    applyTransform();
                    setTimeout(() => {
                        certTrack.style.transition = '';
                        interactPaused = false;
                    }, ANIM_MS + 20);
                }
            };

            certWrap.addEventListener('touchend', endTouch, { passive: true });
            certWrap.addEventListener('touchcancel', endTouch, { passive: true });

            requestAnimationFrame(tick);
        }
    }

    const certCards = document.querySelectorAll('.cert-card');
    if (certCards.length) {
        const hoverNone = window.matchMedia('(hover: none)').matches;
        certCards.forEach(card => {
            card.addEventListener('click', () => {
                if (hoverNone) card.classList.toggle('is-flipped');
            });
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.classList.toggle('is-flipped');
                }
                if (e.key === 'Escape') {
                    card.classList.remove('is-flipped');
                    card.blur();
                }
            });
        });
    }

    /* ───── Contact form → Netlify Forms (submissions: Netlify dashboard → Forms) ───── */
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]') || form.querySelector('button');
            const msg = document.getElementById('form-msg');
            const original = btn.innerHTML;
            btn.innerHTML = '<span>Sending...</span>';
            btn.disabled = true;
            msg.textContent = '';
            msg.classList.remove('form-msg-err');

            const action = form.getAttribute('action') || '/';

            try {
                const body = new URLSearchParams(new FormData(form)).toString();
                const res = await fetch(action, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body,
                });
                if (res.ok) {
                    msg.textContent = '✓ Thanks — your message is on its way. I\'ll be in touch shortly.';
                    form.reset();
                } else {
                    msg.textContent = 'That did not go through. Please email rahulodedra1485@gmail.com directly.';
                    msg.classList.add('form-msg-err');
                }
            } catch {
                msg.textContent = 'Network error — please try again or email rahulodedra1485@gmail.com.';
                msg.classList.add('form-msg-err');
            } finally {
                setTimeout(() => {
                    btn.innerHTML = original;
                    btn.disabled = false;
                }, 400);
            }
        });
    }

    if (document.body.classList.contains('page-services')) {
        document.getElementById('navbar')?.classList.add('scrolled');
    }

    /* ───── Calendly: pin iframe inside shell on mobile (Safari overlap fix) ───── */
    const calendlyShell = document.getElementById('schedule-calendly-shell');
    const mobileMq = window.matchMedia('(max-width: 768px)');

    const pinCalendlyIframe = () => {
        if (!calendlyShell || !mobileMq.matches) return;
        const iframe = calendlyShell.querySelector('iframe');
        const host = calendlyShell.querySelector('.calendly-inline-widget');
        if (!iframe) return;
        Object.assign(iframe.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            minHeight: '100%',
            maxHeight: '100%',
            margin: '0',
            border: '0',
            transform: 'none',
        });
        if (host) {
            Object.assign(host.style, {
                position: 'absolute',
                inset: '0',
                width: '100%',
                height: '100%',
                margin: '0',
                transform: 'none',
            });
        }
    };

    if (calendlyShell) {
        pinCalendlyIframe();
        const poll = setInterval(() => {
            pinCalendlyIframe();
            if (calendlyShell.querySelector('iframe')) {
                clearInterval(poll);
            }
        }, 400);
        setTimeout(() => clearInterval(poll), 12000);
        mobileMq.addEventListener('change', pinCalendlyIframe);
        window.addEventListener('resize', pinCalendlyIframe);
    }

    /* ───── Mobile sticky CTA (index + services) ───── */
    const mobileCta = document.getElementById('mobile-cta-bar');
    if (mobileCta) {
        const mq = window.matchMedia('(max-width: 768px)');
        const showAfter = 480;
        const sync = () => {
            if (mq.matches) {
                mobileCta.removeAttribute('hidden');
                const show = window.scrollY > showAfter;
                mobileCta.classList.toggle('is-visible', show);
                document.body.classList.toggle('mobile-cta-active', show);
            } else {
                mobileCta.setAttribute('hidden', '');
                mobileCta.classList.remove('is-visible');
                document.body.classList.remove('mobile-cta-active');
            }
        };
        sync();
        window.addEventListener('scroll', sync, { passive: true });
        mq.addEventListener('change', sync);
    }
});

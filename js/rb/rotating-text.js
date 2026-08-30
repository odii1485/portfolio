/** Hero specialty line — smooth phrase crossfade (no per-character stagger) */

const HERO_SKILL_ACCENTS = [
  '#bdd4c8',
  '#e9d391',
  '#a8c6b9',
  '#c9d9a8',
  '#dceee6',
  '#e9d391',
];

const EXIT_MS = 380;
const ENTER_MS = 520;

function applyAccent(el, phraseIndex) {
  const color = HERO_SKILL_ACCENTS[phraseIndex % HERO_SKILL_ACCENTS.length];
  el.style.setProperty('--hero-skill-color', color);
}

function setPhrase(el, phrase, phraseIndex) {
  el.textContent = phrase;
  el.className = 'hero-specialty-text';
  applyAccent(el, phraseIndex);
}

export function initRotatingText() {
  const mount = document.getElementById('hero-rotating-text');
  if (!mount || mount.dataset.rbRotating) return;
  mount.dataset.rbRotating = '1';

  const phrases = (mount.dataset.phrases || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  const texts =
    phrases.length > 0
      ? phrases
      : [
          'Salesforce Commerce Cloud',
          'B2B Commerce · Data Cloud',
          'Shopify Quality Engineering',
          'Test Automation · Robot Framework',
          'API & Database Validation',
          'Agentforce · AI Testing',
        ];

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;

  setPhrase(mount, texts[0], 0);

  if (reduced) return;

  const interval = +(mount.dataset.interval || 3400);

  const rotate = () => {
    index = (index + 1) % texts.length;
    mount.classList.remove('is-entering');
    mount.classList.add('is-leaving');

    window.setTimeout(() => {
      setPhrase(mount, texts[index], index);
      mount.classList.remove('is-leaving');
      mount.classList.add('is-entering');
      window.setTimeout(() => mount.classList.remove('is-entering'), ENTER_MS);
    }, EXIT_MS);
  };

  mount._rbRotateTimer = window.setInterval(rotate, interval);
}

/** Inject WebGL background layers into services.html detail sections */

const DIRECTIONS = ['right', 'left', 'diagonal', 'down'];

const GRID_BY_COLOR = {
  cyan: {
    border: 'rgba(107, 159, 196, 0.16)',
    hover: 'rgba(107, 159, 196, 0.14)',
  },
  pink: {
    border: 'rgba(184, 125, 150, 0.16)',
    hover: 'rgba(184, 125, 150, 0.14)',
  },
  purple: {
    border: 'rgba(143, 132, 196, 0.17)',
    hover: 'rgba(143, 132, 196, 0.14)',
  },
  green: {
    border: 'rgba(233, 211, 145, 0.18)',
    hover: 'rgba(233, 211, 145, 0.15)',
  },
  amber: {
    border: 'rgba(255, 183, 3, 0.17)',
    hover: 'rgba(255, 183, 3, 0.13)',
  },
  violet: {
    border: 'rgba(123, 44, 191, 0.18)',
    hover: 'rgba(168, 120, 220, 0.14)',
  },
  cyan2: {
    border: 'rgba(94, 234, 212, 0.16)',
    hover: 'rgba(94, 234, 212, 0.13)',
  },
};

function shapeGridSnippet(index, colorKey) {
  const dir = DIRECTIONS[index % DIRECTIONS.length];
  const shape = index % 2 === 0 ? 'hexagon' : 'square';
  const palette = GRID_BY_COLOR[colorKey] || GRID_BY_COLOR.green;
  return `
<div class="rb-bg-layer rb-bg-layer--services" data-rb-shape-grid data-shape="${shape}" data-direction="${dir}" data-speed="0.28" data-square-size="50" data-border-color="${palette.border}" data-hover-fill-color="${palette.hover}" data-hover-trail="5" data-vignette-strength="0.32" aria-hidden="true"></div>
<div class="rb-content-scrim rb-content-scrim--services-detail" aria-hidden="true"></div>
`;
}

export function initServicesBackgrounds() {
  if (!document.querySelector('#services-hero')) return;

  document.querySelectorAll('.service-detail').forEach((section, i) => {
    if (section.querySelector('.rb-bg-layer')) return;
    section.style.position = 'relative';
    section.style.overflow = 'hidden';

    const colorKey = section.dataset.color || 'green';
    const wrap = document.createElement('div');
    wrap.innerHTML = shapeGridSnippet(i, colorKey).trim();
    const layers = [...wrap.children];
    layers.reverse().forEach((el) => section.insertBefore(el, section.firstChild));
  });
}

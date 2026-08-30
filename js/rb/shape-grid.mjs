/**
 * Shape Grid — React-Bits port (Canvas 2D)
 * @see https://github.com/DavidHDev/react-bits/tree/main/src/content/Backgrounds/ShapeGrid
 */
function createVisibilityLoop(container, onVisible) {
  let raf = 0;
  let intersecting = false;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!document.hidden && intersecting) onVisible();
  };
  const start = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  const io = new IntersectionObserver(
    (entries) => {
      intersecting = entries.some((e) => e.isIntersecting);
      if (intersecting && !document.hidden) start();
      else stop();
    },
    { threshold: 0 },
  );
  io.observe(container);
  if (!document.hidden) start();
  return () => {
    stop();
    io.disconnect();
  };
}

export function mountShapeGrid(container, opts = {}) {
  const {
    direction = 'diagonal',
    speed = 0.35,
    borderColor = 'rgba(255,255,255,0.06)',
    hoverFillColor = 'rgba(233,211,145,0.12)',
    squareSize = 44,
    shape = 'square',
    hoverTrailAmount = 6,
    vignetteStrength = 1,
    interactiveTarget = null,
  } = opts;

  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    display: 'block',
    pointerEvents: 'none',
  });
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const gridOffset = { x: 0, y: 0 };
  let hoveredSquare = null;
  const trailCells = [];
  const cellOpacities = new Map();
  let raf = 0;

  const isHex = shape === 'hexagon';
  const isTri = shape === 'triangle';
  const hexHoriz = squareSize * 1.5;
  const hexVert = squareSize * Math.sqrt(3);

  const resize = () => {
    canvas.width = container.clientWidth || 1;
    canvas.height = container.clientHeight || 1;
  };

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  const drawHex = (cx, cy, size) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const vx = cx + size * Math.cos(angle);
      const vy = cy + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
  };

  const drawTriangle = (cx, cy, size, flip) => {
    ctx.beginPath();
    if (flip) {
      ctx.moveTo(cx, cy + size / 2);
      ctx.lineTo(cx + size / 2, cy - size / 2);
      ctx.lineTo(cx - size / 2, cy - size / 2);
    } else {
      ctx.moveTo(cx, cy - size / 2);
      ctx.lineTo(cx + size / 2, cy + size / 2);
      ctx.lineTo(cx - size / 2, cy + size / 2);
    }
    ctx.closePath();
  };

  const updateCellOpacities = () => {
    const targets = new Map();
    if (hoveredSquare) targets.set(`${hoveredSquare.x},${hoveredSquare.y}`, 1);
    if (hoverTrailAmount > 0) {
      trailCells.forEach((t, i) => {
        const key = `${t.x},${t.y}`;
        if (!targets.has(key)) {
          targets.set(key, (trailCells.length - i) / (trailCells.length + 1));
        }
      });
    }
    for (const key of targets.keys()) {
      if (!cellOpacities.has(key)) cellOpacities.set(key, 0);
    }
    for (const [key, opacity] of [...cellOpacities.entries()]) {
      const target = targets.get(key) || 0;
      const next = opacity + (target - opacity) * 0.15;
      if (next < 0.005) cellOpacities.delete(key);
      else cellOpacities.set(key, next);
    }
  };

  const drawGrid = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isHex) {
      const colShift = Math.floor(gridOffset.x / hexHoriz);
      const offsetX = ((gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz;
      const offsetY = ((gridOffset.y % hexVert) + hexVert) % hexVert;
      const cols = Math.ceil(canvas.width / hexHoriz) + 3;
      const rows = Math.ceil(canvas.height / hexVert) + 3;
      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * hexHoriz + offsetX;
          const cy = row * hexVert + ((col + colShift) % 2 !== 0 ? hexVert / 2 : 0) + offsetY;
          const cellKey = `${col},${row}`;
          const alpha = cellOpacities.get(cellKey);
          if (alpha) {
            ctx.globalAlpha = alpha;
            drawHex(cx, cy, squareSize);
            ctx.fillStyle = hoverFillColor;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          drawHex(cx, cy, squareSize);
          ctx.strokeStyle = borderColor;
          ctx.stroke();
        }
      }
    } else if (isTri) {
      const halfW = squareSize / 2;
      const colShift = Math.floor(gridOffset.x / halfW);
      const rowShift = Math.floor(gridOffset.y / squareSize);
      const offsetX = ((gridOffset.x % halfW) + halfW) % halfW;
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
      const cols = Math.ceil(canvas.width / halfW) + 4;
      const rows = Math.ceil(canvas.height / squareSize) + 4;
      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * halfW + offsetX;
          const cy = row * squareSize + squareSize / 2 + offsetY;
          const flip = ((col + colShift + row + rowShift) % 2 + 2) % 2 !== 0;
          const cellKey = `${col},${row}`;
          const alpha = cellOpacities.get(cellKey);
          if (alpha) {
            ctx.globalAlpha = alpha;
            drawTriangle(cx, cy, squareSize, flip);
            ctx.fillStyle = hoverFillColor;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          drawTriangle(cx, cy, squareSize, flip);
          ctx.strokeStyle = borderColor;
          ctx.stroke();
        }
      }
    } else {
      const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
      const cols = Math.ceil(canvas.width / squareSize) + 3;
      const rows = Math.ceil(canvas.height / squareSize) + 3;
      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const sx = col * squareSize + offsetX;
          const sy = row * squareSize + offsetY;
          const cellKey = `${col},${row}`;
          const alpha = cellOpacities.get(cellKey);
          if (alpha) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = hoverFillColor;
            ctx.fillRect(sx, sy, squareSize, squareSize);
            ctx.globalAlpha = 1;
          }
          ctx.strokeStyle = borderColor;
          ctx.strokeRect(sx, sy, squareSize, squareSize);
        }
      }
    }

    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2,
    );
    if (vignetteStrength > 0) {
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.55, `rgba(0, 0, 0, ${0.35 * vignetteStrength})`);
      gradient.addColorStop(1, `rgba(0, 0, 0, ${0.82 * vignetteStrength})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  let animating = false;

  const tick = () => {
    if (!animating) return;
    const effectiveSpeed = Math.max(speed, 0.1);
    const wrapX = isHex ? hexHoriz * 2 : squareSize;
    const wrapY = isHex ? hexVert : isTri ? squareSize * 2 : squareSize;
    switch (direction) {
      case 'right':
        gridOffset.x = (gridOffset.x - effectiveSpeed + wrapX) % wrapX;
        break;
      case 'left':
        gridOffset.x = (gridOffset.x + effectiveSpeed + wrapX) % wrapX;
        break;
      case 'up':
        gridOffset.y = (gridOffset.y + effectiveSpeed + wrapY) % wrapY;
        break;
      case 'down':
        gridOffset.y = (gridOffset.y - effectiveSpeed + wrapY) % wrapY;
        break;
      default:
        gridOffset.x = (gridOffset.x - effectiveSpeed + wrapX) % wrapX;
        gridOffset.y = (gridOffset.y - effectiveSpeed + wrapY) % wrapY;
    }
    updateCellOpacities();
    drawGrid();
    raf = requestAnimationFrame(tick);
  };

  const startAnim = () => {
    if (animating) return;
    animating = true;
    raf = requestAnimationFrame(tick);
  };
  const stopAnim = () => {
    animating = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const stopLoop = createVisibilityLoop(container, startAnim);

  const handleMouseMove = (event) => {
    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
    const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
    const col = Math.floor((mouseX - offsetX) / squareSize);
    const row = Math.floor((mouseY - offsetY) / squareSize);
    if (!hoveredSquare || hoveredSquare.x !== col || hoveredSquare.y !== row) {
      if (hoveredSquare && hoverTrailAmount > 0) {
        trailCells.unshift({ ...hoveredSquare });
        if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount;
      }
      hoveredSquare = { x: col, y: row };
    }
  };

  const handleMouseLeave = () => {
    if (hoveredSquare && hoverTrailAmount > 0) {
      trailCells.unshift({ ...hoveredSquare });
      if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount;
    }
    hoveredSquare = null;
  };

  const eventEl = interactiveTarget || container.closest('section') || container;
  eventEl.addEventListener('mousemove', handleMouseMove);
  eventEl.addEventListener('mouseleave', handleMouseLeave);
  startAnim();

  return () => {
    stopAnim();
    stopLoop();
    ro.disconnect();
    eventEl.removeEventListener('mousemove', handleMouseMove);
    eventEl.removeEventListener('mouseleave', handleMouseLeave);
    if (canvas.parentElement === container) container.removeChild(canvas);
  };
}

/**
 * Light Rays — React-Bits port (OGL)
 * @see https://github.com/DavidHDev/react-bits/tree/main/src/content/Backgrounds/LightRays
 */
import { Renderer, Triangle, Program, Mesh } from 'https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm';
function hexToRGB(hex) {
  const c = hex.replace('#', '').padEnd(6, '0');
  return [
    parseInt(c.slice(0, 2), 16) / 255,
    parseInt(c.slice(2, 4), 16) / 255,
    parseInt(c.slice(4, 6), 16) / 255,
  ];
}

function createVisibilityLoop(container, renderFn) {
  let raf = 0;
  let intersecting = false;
  const tick = (t) => {
    raf = requestAnimationFrame(tick);
    if (document.hidden || !intersecting) return;
    renderFn(t);
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
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (intersecting) start();
  });
  if (!document.hidden) start();
  return () => {
    stop();
    io.disconnect();
    document.removeEventListener('visibilitychange', () => {});
  };
}

function getAnchorAndDir(origin, w, h) {
  const outside = 0.2;
  switch (origin) {
    case 'top-left':
      return { anchor: [0, -outside * h], dir: [0, 1] };
    case 'top-right':
      return { anchor: [w, -outside * h], dir: [0, 1] };
    case 'left':
      return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
    case 'right':
      return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
    case 'bottom-left':
      return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
    case 'bottom-center':
      return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
    case 'bottom-right':
      return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
    default:
      return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
  }
}

const FRAG = `precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 rayPos;
uniform vec2 rayDir;
uniform vec3 raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2 mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;

varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);
  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));
  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;
  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0);
  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }
  vec4 rays1 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed);
  fragColor = rays1 * 0.5 + rays2 * 0.4;
  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }
  float brightness = 1.0 - (coord.y / iResolution.y);
  fragColor.x *= 0.1 + brightness * 0.8;
  fragColor.y *= 0.3 + brightness * 0.6;
  fragColor.z *= 0.5 + brightness * 0.5;
  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }
  fragColor.rgb *= raysColor;
}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}`;

const VERT = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

export function mountLightRays(container, opts = {}) {
  const {
    raysOrigin = 'top-center',
    raysColor = '#e9d391',
    raysSpeed = 0.85,
    lightSpread = 0.92,
    rayLength = 1.8,
    pulsating = false,
    fadeDistance = 1.0,
    saturation = 0.75,
    followMouse = true,
    mouseInfluence = 0.08,
    noiseAmount = 0.04,
    distortion = 0.04,
  } = opts;

  const renderer = new Renderer({
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    alpha: true,
  });
  const gl = renderer.gl;
  Object.assign(gl.canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    display: 'block',
    pointerEvents: 'none',
  });
  container.appendChild(gl.canvas);

  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: [1, 1] },
    rayPos: { value: [0, 0] },
    rayDir: { value: [0, 1] },
    raysColor: { value: hexToRGB(raysColor) },
    raysSpeed: { value: raysSpeed },
    lightSpread: { value: lightSpread },
    rayLength: { value: rayLength },
    pulsating: { value: pulsating ? 1 : 0 },
    fadeDistance: { value: fadeDistance },
    saturation: { value: saturation },
    mousePos: { value: [0.5, 0.5] },
    mouseInfluence: { value: mouseInfluence },
    noiseAmount: { value: noiseAmount },
    distortion: { value: distortion },
  };

  const program = new Program(gl, { vertex: VERT, fragment: FRAG, uniforms });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  const mouse = { x: 0.5, y: 0.5 };
  const smoothMouse = { x: 0.5, y: 0.5 };

  const updatePlacement = () => {
    const wCSS = container.clientWidth || 1;
    const hCSS = container.clientHeight || 1;
    renderer.setSize(wCSS, hCSS);
    const dpr = renderer.dpr;
    const w = wCSS * dpr;
    const h = hCSS * dpr;
    uniforms.iResolution.value = [w, h];
    const { anchor, dir } = getAnchorAndDir(raysOrigin, w, h);
    uniforms.rayPos.value = anchor;
    uniforms.rayDir.value = dir;
  };

  const ro = new ResizeObserver(updatePlacement);
  ro.observe(container);
  updatePlacement();

  const onMove = (e) => {
    const rect = container.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) / rect.width;
    mouse.y = (e.clientY - rect.top) / rect.height;
  };

  if (followMouse && mouseInfluence > 0) {
    container.addEventListener('mousemove', onMove, { passive: true });
  }

  const render = (t) => {
    uniforms.iTime.value = t * 0.001;
    if (followMouse && mouseInfluence > 0) {
      const s = 0.92;
      smoothMouse.x = smoothMouse.x * s + mouse.x * (1 - s);
      smoothMouse.y = smoothMouse.y * s + mouse.y * (1 - s);
      uniforms.mousePos.value = [smoothMouse.x, smoothMouse.y];
    }
    renderer.render({ scene: mesh });
  };

  const stopLoop = createVisibilityLoop(container, render);

  return () => {
    stopLoop();
    ro.disconnect();
    if (followMouse) container.removeEventListener('mousemove', onMove);
    if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}

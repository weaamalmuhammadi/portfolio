/**
 * textures.js — every texture in the hall is painted procedurally on a
 * <canvas> at load time, so the site needs no image files except your
 * own artwork photos.
 *
 *   Fonts      theme font loading + helpers for text on canvas
 *   Surfaces   marble, grid, checker, tiles, polished stone, plaster, panels, bricks
 *   Decals     viewing-circle markers, washes, trails, soft shadows and glows
 *   Paper      artwork placeholders / demo art, wall labels, the back-wall bio
 *
 * Colours and fonts come from the active theme (see themes.js).
 */

import * as THREE from 'three';
import { THEME } from './config.js';

/* =============================================
   HELPERS
   ============================================= */

/* Small seeded PRNG (mulberry32) — the room looks identical on every visit */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h = w) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  return [cv, cv.getContext('2d')];
}

export function toTexture(cv, { repeat = false, aniso = 1, pixel = false } = {}) {
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = aniso;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (pixel) tex.magFilter = THREE.NearestFilter;   // crisp, blocky pixels up close
  return tex;
}

const smooth = (t) => t * t * (3 - 2 * t);
const pad2 = (n) => String(n).padStart(2, '0');

/* '#rrggbb' → [r, g, b] */
const rgbOf = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/* Tileable fractal value noise in [0, 1]. `size` must be a power of two and
   `period` (lattice cells across the tile) a power of two no larger than it. */
function tileableNoise(size, { octaves = 5, period = 4, rand }) {
  const out = new Float32Array(size * size);
  let amp = 1, total = 0;
  for (let o = 0; o < octaves; o++) {
    const p = Math.min(size, period << o);
    const lattice = new Float32Array(p * p);
    for (let i = 0; i < lattice.length; i++) lattice[i] = rand();
    const cell = size / p;

    for (let y = 0; y < size; y++) {
      const fy = y / cell, iy = Math.floor(fy), ty = smooth(fy - iy);
      const r0 = (iy % p) * p, r1 = ((iy + 1) % p) * p;
      for (let x = 0; x < size; x++) {
        const fx = x / cell, ix = Math.floor(fx), tx = smooth(fx - ix);
        const x0 = ix % p, x1 = (ix + 1) % p;
        const top = lattice[r0 + x0] + (lattice[r0 + x1] - lattice[r0 + x0]) * tx;
        const bot = lattice[r1 + x0] + (lattice[r1 + x1] - lattice[r1 + x0]) * tx;
        out[y * size + x] += amp * (top + (bot - top) * ty);
      }
    }
    total += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

/* =============================================
   FONTS
   ============================================= */

/* A canvas font string from the theme, e.g. font('title', 80) */
export function font(kind, size) {
  const t = THEME.type;
  const scale = kind.startsWith('title') ? (t.titleScale ?? 1)
    : kind.startsWith('head') ? (t.headScale ?? 1)
    : (t.bodyScale ?? 1);
  return t[kind].replace('{s}', Math.round(size * scale));
}

/* Load the theme's extra Google Fonts (if any). Call once before building. */
let stylesheetReady = Promise.resolve();
export function loadThemeFonts() {
  if (!THEME.fonts) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${THEME.fonts}&display=swap`;
  stylesheetReady = new Promise((resolve) => {
    link.onload = resolve;
    link.onerror = resolve;
    setTimeout(resolve, 4000);   // never wait forever
  });
  document.head.appendChild(link);
}

/* Resolves once the fonts used on canvas textures have loaded */
let fontsPromise;
export function fontsReady() {
  if (!fontsPromise) {
    const specs = Object.values(THEME.type)
      .filter((v) => typeof v === 'string')
      .map((tpl) => tpl.replace('{s}', '40'));
    fontsPromise = stylesheetReady.then(() => (document.fonts
      ? Promise.all(specs.map((s) => document.fonts.load(s).catch(() => null)))
      : null));
  }
  return fontsPromise;
}

/* Canvas text with manual letter-spacing (works in every browser) */
export function spacedText(c, text, x, y, spacing, align = 'left') {
  const chars  = [...text];
  const widths = chars.map((ch) => c.measureText(ch).width);
  const total  = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const prevAlign = c.textAlign;
  c.textAlign = 'left';
  chars.forEach((ch, i) => { c.fillText(ch, cx, y); cx += widths[i] + spacing; });
  c.textAlign = prevAlign;
  return total;
}

/* Split text into lines no wider than maxW */
function wrapLines(c, text, maxW) {
  const lines = [];
  let line = '';
  text.split(/\s+/).forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (c.measureText(test).width > maxW && line) { lines.push(line); line = word; }
    else line = test;
  });
  if (line) lines.push(line);
  return lines;
}

/* Shrink a font until the text fits a width */
function fitFont(c, text, maxW, kind, size) {
  c.font = font(kind, size);
  while (c.measureText(text).width > maxW && size > 10) {
    size -= 2;
    c.font = font(kind, size);
  }
}

/* =============================================
   SURFACES
   ============================================= */

/* White marble — soft grey clouds plus crisp diagonal veins. Tileable. */
export function makeMarbleTexture(aniso) {
  const S = 1024;
  const rand = rng(11);
  const [cv, c] = makeCanvas(S);

  const n = tileableNoise(S, { octaves: 5, period: 4, rand });
  const img = c.createImageData(S, S);
  const d = img.data;
  for (let i = 0; i < S * S; i++) {
    const v = 233 + (n[i] - 0.5) * 24 + (rand() - 0.5) * 4;
    d[i * 4] = v - 1; d[i * 4 + 1] = v; d[i * 4 + 2] = v + 2; d[i * 4 + 3] = 255;
  }
  c.putImageData(img, 0, 0);

  // Draw a path nine times (shifted one tile each way) so it wraps seamlessly
  const wrapStroke = (pts) => {
    for (let ox = -S; ox <= S; ox += S) {
      for (let oy = -S; oy <= S; oy += S) {
        c.beginPath();
        pts.forEach(([x, y], i) => (i ? c.lineTo(x + ox, y + oy) : c.moveTo(x + ox, y + oy)));
        c.stroke();
      }
    }
  };
  const vein = (x, y, ang, len, step = 5) => {
    const pts = [[x, y]];
    for (let s = 0; s < len; s += step) {
      ang += (rand() - 0.5) * 0.22;
      x += Math.cos(ang) * step;
      y += Math.sin(ang) * step;
      pts.push([x, y]);
    }
    return pts;
  };

  const GRAIN = -0.66; // main vein direction
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // 1) broad, blurry grey clouds following the grain
  if ('filter' in c) c.filter = 'blur(9px)';
  for (let i = 0; i < 14; i++) {
    c.strokeStyle = `rgba(118,120,126,${0.03 + rand() * 0.04})`;
    c.lineWidth = 16 + rand() * 36;
    wrapStroke(vein(rand() * S, rand() * S, GRAIN + (rand() - 0.5) * 0.3, S * (0.4 + rand() * 0.6), 12));
  }
  if ('filter' in c) c.filter = 'none';

  // 2) hairline veins, some with a small branch
  for (let i = 0; i < 22; i++) {
    const pts = vein(rand() * S, rand() * S, GRAIN + (rand() - 0.5) * 0.25, S * (0.25 + rand() * 0.75));
    c.strokeStyle = `rgba(86,88,95,${0.07 + rand() * 0.2})`;
    c.lineWidth = 0.6 + rand() * 1.3;
    wrapStroke(pts);
    if (rand() < 0.5) {
      const [bx, by] = pts[Math.floor(rand() * pts.length)];
      c.lineWidth *= 0.6;
      wrapStroke(vein(bx, by, GRAIN + (rand() < 0.5 ? 0.6 : -0.6), 40 + rand() * 120));
    }
  }

  return toTexture(cv, { repeat: true, aniso });
}

/* Engine-viewport grid: one tile = `cells` squares, thicker line on the tile edge */
export function makeGridTexture(aniso, { base, minor, major, cells = 5, glow = 0 }) {
  const S = 1024;
  const [cv, c] = makeCanvas(S);
  c.fillStyle = base;
  c.fillRect(0, 0, S, S);

  const step = S / cells;
  const lines = (color, width, every, blur = 0) => {
    if (blur && 'filter' in c) c.filter = `blur(${blur}px)`;
    c.strokeStyle = color;
    c.lineWidth = width;
    c.beginPath();
    for (let i = 0; i <= cells; i += every) {
      const p = i * step;
      c.moveTo(p, 0); c.lineTo(p, S);
      c.moveTo(0, p); c.lineTo(S, p);
    }
    c.stroke();
    if (blur && 'filter' in c) c.filter = 'none';
  };
  lines(minor, glow ? 3 : 2, 1);
  if (glow) lines(major, 22, cells, 12);   // soft bloom around the main lines
  lines(major, glow ? 6 : 4, cells);
  return toTexture(cv, { repeat: true, aniso });
}

/* Two-colour pixel checkerboard with a little per-pixel grit. Tileable. */
export function makeCheckerTexture({ a, b, cells = 2, px = 16 }) {
  const S = cells * px;
  const rand = rng(31);
  const [cv, c] = makeCanvas(S);
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      c.fillStyle = (x + y) % 2 ? b : a;
      c.fillRect(x * px, y * px, px, px);
      // pixel bevel: light top-left edge, dark bottom-right edge
      c.fillStyle = 'rgba(255,255,255,0.14)';
      c.fillRect(x * px, y * px, px, 1);
      c.fillRect(x * px, y * px, 1, px);
      c.fillStyle = 'rgba(0,0,0,0.16)';
      c.fillRect(x * px, (y + 1) * px - 1, px, 1);
      c.fillRect((x + 1) * px - 1, y * px, 1, px);
    }
  }
  for (let i = 0; i < S * S * 0.18; i++) {
    c.fillStyle = rand() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)';
    c.fillRect(Math.floor(rand() * S), Math.floor(rand() * S), 1, 1);
  }
  return toTexture(cv, { repeat: true, pixel: true });
}

/* Soft rounded ceramic tile */
export function makeTileTexture(aniso, { base, grout }) {
  const S = 512;
  const rand = rng(41);
  const [cv, c] = makeCanvas(S);
  c.fillStyle = grout;
  c.fillRect(0, 0, S, S);

  const inset = 12, r = 46;
  c.beginPath();
  c.roundRect(inset, inset, S - inset * 2, S - inset * 2, r);
  c.fillStyle = base;
  c.fill();

  // gentle glaze highlight
  const g = c.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, 'rgba(255,255,255,0.22)');
  g.addColorStop(0.55, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.05)');
  c.fillStyle = g;
  c.fill();

  for (let i = 0; i < 2500; i++) {
    c.fillStyle = `rgba(0,0,0,${rand() * 0.035})`;
    c.fillRect(rand() * S, rand() * S, 2, 2);
  }
  return toTexture(cv, { repeat: true, aniso });
}

/* Dark polished stone with faint streaks. Tileable. */
export function makePolishedTexture(aniso, { base }) {
  const S = 1024;
  const rand = rng(51);
  const [cv, c] = makeCanvas(S);
  const [br, bg, bb] = rgbOf(base);
  const n = tileableNoise(S, { octaves: 5, period: 4, rand });
  const img = c.createImageData(S, S);
  const d = img.data;
  for (let i = 0; i < S * S; i++) {
    const v = (n[i] - 0.5) * 18 + (rand() - 0.5) * 4;
    d[i * 4] = br + v; d[i * 4 + 1] = bg + v; d[i * 4 + 2] = bb + v; d[i * 4 + 3] = 255;
  }
  c.putImageData(img, 0, 0);

  if ('filter' in c) c.filter = 'blur(6px)';
  for (let i = 0; i < 18; i++) {
    const x = rand() * S, y = rand() * S, len = S * (0.3 + rand() * 0.5);
    c.strokeStyle = `rgba(255,240,220,${0.015 + rand() * 0.03})`;
    c.lineWidth = 4 + rand() * 16;
    for (let ox = -S; ox <= S; ox += S) {
      c.beginPath();
      c.moveTo(x + ox, y);
      c.lineTo(x + ox + len * 0.8, y - len * 0.6);
      c.stroke();
    }
  }
  if ('filter' in c) c.filter = 'none';
  return toTexture(cv, { repeat: true, aniso });
}

/* Matte plaster — low-contrast grey mottling (tinted by the material colour). Tileable. */
export function makePlasterTexture(aniso, { seed = 5, tone = 238, depth = 16 } = {}) {
  const S = 512;
  const rand = rng(seed);
  const [cv, c] = makeCanvas(S);

  const big  = tileableNoise(S, { octaves: 4, period: 4, rand });
  const fine = tileableNoise(S, { octaves: 2, period: 64, rand });
  const img = c.createImageData(S, S);
  const d = img.data;
  for (let i = 0; i < S * S; i++) {
    let v = tone + (big[i] - 0.5) * depth + (fine[i] - 0.5) * depth * 0.5 + (rand() - 0.5) * 5;
    if (rand() < 0.0012) v -= 10 + rand() * 14;
    d[i * 4] = v; d[i * 4 + 1] = v; d[i * 4 + 2] = v - 1; d[i * 4 + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  return toTexture(cv, { repeat: true, aniso });
}

/* Smooth wall panels with thin seams (one tile = two panels) */
export function makePanelTexture(aniso, { base, seam }) {
  const S = 512;
  const rand = rng(61);
  const [cv, c] = makeCanvas(S);
  c.fillStyle = base;
  c.fillRect(0, 0, S, S);
  for (let i = 0; i < 4000; i++) {
    c.fillStyle = `rgba(${rand() < 0.5 ? '0,0,0' : '255,255,255'},${rand() * 0.02})`;
    c.fillRect(rand() * S, rand() * S, 2, 2);
  }
  c.fillStyle = seam;
  [0, S / 2].forEach((x) => c.fillRect(x - 1, 0, 3, S));
  c.fillRect(0, 0, S, 3);
  return toTexture(cv, { repeat: true, aniso });
}

/* Pixel-art bricks with a colour shift per brick. Tileable. */
export function makeBrickTexture({ brick, mortar }) {
  const S = 64, rowH = 8, brickW = 16;
  const rand = rng(71);
  const [cv, c] = makeCanvas(S);
  const [r, g, b] = rgbOf(brick);
  c.fillStyle = mortar;
  c.fillRect(0, 0, S, S);
  for (let row = 0; row < S / rowH; row++) {
    const offset = row % 2 ? brickW / 2 : 0;
    for (let x = -brickW; x < S + brickW; x += brickW) {
      const k = (rand() - 0.5) * 26;
      c.fillStyle = `rgb(${r + k},${g + k},${b + k})`;
      const bx = x + offset;
      // draw twice when it crosses the edge so the tile wraps
      [bx, bx - S, bx + S].forEach((xx) => c.fillRect(xx + 1, row * rowH + 1, brickW - 1, rowH - 1));
    }
  }
  for (let i = 0; i < 260; i++) {
    c.fillStyle = rand() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
    c.fillRect(Math.floor(rand() * S), Math.floor(rand() * S), 1, 1);
  }
  return toTexture(cv, { repeat: true, pixel: true });
}

/* White passe-partout with a faint shadow cast by the frame's inner lip
   (tinted by the material colour) */
export function makeMatTexture() {
  const W = 256, H = 352;
  const [cv, c] = makeCanvas(W, H);
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, W, H);

  const edge = (x0, y0, x1, y1, alpha, rx, ry, rw, rh) => {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, `rgba(0,0,0,${alpha})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(rx, ry, rw, rh);
  };
  edge(0, 0, 0, 14, 0.2, 0, 0, W, 14);          // top — strongest
  edge(0, 0, 9, 0, 0.08, 0, 0, 9, H);           // left
  edge(W, 0, W - 9, 0, 0.08, W - 9, 0, 9, H);   // right
  return toTexture(cv);
}

/* =============================================
   DECALS
   ============================================= */

/* Fraction of the decal plane covered by the marker's radius (plane size = r / RING_R) */
export const RING_R = 0.4;

/* Text running around the inside of a circle, spread evenly (it's written to loop) */
function circleLabel(c, S, text, radius, color, glow = false) {
  c.save();
  c.fillStyle = color;
  c.font = font('headBold', S * 0.042);
  c.textBaseline = 'middle';
  c.textAlign = 'center';
  if (glow) { c.shadowColor = color; c.shadowBlur = 12; }
  const chars = [...text];
  const gap = S * 0.012;
  const widths = chars.map((ch) => c.measureText(ch).width + gap);
  const stretch = (Math.PI * 2 * radius) / widths.reduce((a, b) => a + b, 0);
  let a = -Math.PI / 2;
  chars.forEach((ch, i) => {
    const half = (widths[i] * stretch) / 2 / radius;
    a += half;
    c.save();
    c.translate(S / 2 + Math.cos(a) * radius, S / 2 + Math.sin(a) * radius);
    c.rotate(a + Math.PI / 2);
    c.fillText(ch, 0, 0);
    c.restore();
    a += half;
  });
  c.restore();
}

/* Viewing-circle marker in the theme's style. Redraws once fonts load if it has a label. */
export function makeMarkerTexture({ seed = 1, label = '' } = {}) {
  const { style, color, glow } = THEME.markers;
  const pixel = style === 'pixel';
  const S = pixel ? 96 : 512;
  const [cv, c] = makeCanvas(S);
  const tex = toTexture(cv, { aniso: 4, pixel });
  const R = S * RING_R;

  const draw = () => {
    const rand = rng(seed);
    c.clearRect(0, 0, S, S);
    c.lineCap = 'round';

    if (style === 'pen') {
      // Two overlapping loose strokes, like a circle drawn twice with a pen
      c.strokeStyle = color;
      for (let k = 0; k < 2; k++) {
        const a0 = rand() * Math.PI * 2;
        const sweep = Math.PI * 2 + 0.2 + rand() * 0.25;
        const w1 = rand() * 6, w2 = rand() * 6;
        c.lineWidth = k === 0 ? 5.5 : 2.2;
        c.globalAlpha = k === 0 ? 0.95 : 0.55;
        c.beginPath();
        for (let i = 0; i <= 140; i++) {
          const a = a0 + (sweep * i) / 140;
          const r = R + Math.sin(a * 2 + w1) * 2.6 + Math.sin(a * 3 + w2) * 1.8 + (k ? -7 : 0);
          const x = S / 2 + Math.cos(a) * r, y = S / 2 + Math.sin(a) * r;
          i ? c.lineTo(x, y) : c.moveTo(x, y);
        }
        c.stroke();
      }
      c.globalAlpha = 1;
      if (label) circleLabel(c, S, label, R * 0.8, color);

    } else if (style === 'brackets') {
      // Editor trigger volume: corner brackets, faint dashed outline, centre cross
      const x0 = S / 2 - R, x1 = S / 2 + R, L = R * 0.42;
      c.strokeStyle = color;
      c.lineWidth = 7;
      c.lineCap = 'square';
      [[x0, x0, 1, 1], [x1, x0, -1, 1], [x0, x1, 1, -1], [x1, x1, -1, -1]].forEach(([x, y, sx, sy]) => {
        c.beginPath();
        c.moveTo(x, y + sy * L); c.lineTo(x, y); c.lineTo(x + sx * L, y);
        c.stroke();
      });
      c.lineWidth = 2;
      c.globalAlpha = 0.45;
      c.setLineDash([10, 10]);
      c.strokeRect(x0, x0, R * 2, R * 2);
      c.setLineDash([]);
      c.globalAlpha = 0.8;
      c.beginPath();
      c.moveTo(S / 2 - 14, S / 2); c.lineTo(S / 2 + 14, S / 2);
      c.moveTo(S / 2, S / 2 - 14); c.lineTo(S / 2, S / 2 + 14);
      c.stroke();
      c.globalAlpha = 1;
      if (label) {
        c.fillStyle = color;
        c.font = font('headBold', S * 0.045);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(label.split('·')[0].trim(), S / 2, x1 - R * 0.28);
      }

    } else if (style === 'ring') {
      // Neon / brass ring: optional blurred bloom under a crisp line
      c.strokeStyle = color;
      if (glow) {
        if ('filter' in c) c.filter = 'blur(10px)';
        c.lineWidth = 16;
        c.beginPath(); c.arc(S / 2, S / 2, R, 0, Math.PI * 2); c.stroke();
        if ('filter' in c) c.filter = 'none';
        c.lineWidth = 5;
        c.strokeStyle = '#ffffff';
        c.beginPath(); c.arc(S / 2, S / 2, R, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = color;
      }
      c.lineWidth = glow ? 2 : 4;
      c.beginPath(); c.arc(S / 2, S / 2, R, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 1.5;
      c.beginPath(); c.arc(S / 2, S / 2, R - 12, 0, Math.PI * 2); c.stroke();
      if (label) circleLabel(c, S, label, R * 0.78, color, glow);

    } else if (style === 'pixel') {
      // Chunky dashed pixel circle
      c.fillStyle = color;
      const n = 64;
      for (let i = 0; i < n; i++) {
        if (i % 4 === 3) continue;   // gaps
        const a = (i / n) * Math.PI * 2;
        const x = Math.round(S / 2 + Math.cos(a) * R), y = Math.round(S / 2 + Math.sin(a) * R);
        c.fillRect(x - 2, y - 2, 4, 4);
      }

    } else if (style === 'soft') {
      // Friendly filled disc with a dashed outline
      c.fillStyle = 'rgba(255,255,255,0.45)';
      c.beginPath(); c.arc(S / 2, S / 2, R, 0, Math.PI * 2); c.fill();
      c.strokeStyle = color;
      c.lineWidth = 7;
      c.setLineDash([22, 16]);
      c.beginPath(); c.arc(S / 2, S / 2, R, 0, Math.PI * 2); c.stroke();
      c.setLineDash([]);
      if (label) circleLabel(c, S, label, R * 0.78, color);
    }
    tex.needsUpdate = true;
  };

  draw();
  if (label) fontsReady().then(draw);
  return tex;
}

/* Soft wash that fills a marker while you stand in it (white; tinted by the material) */
export function makeWashTexture() {
  const S = 256;
  const [cv, c] = makeCanvas(S);
  const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * RING_R);
  g.addColorStop(0, 'rgba(255,255,255,0.34)');
  g.addColorStop(0.75, 'rgba(255,255,255,0.22)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, S, S);
  return toTexture(cv);
}

/* Round soft shadow (under the visitor) */
export function makeBlobTexture() {
  const S = 128;
  const [cv, c] = makeCanvas(S);
  const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.6)');
  g.addColorStop(0.45, 'rgba(0,0,0,0.32)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, S, S);
  return toTexture(cv);
}

/* Soft rectangular shadow (or glow, in white) for frames. Returns the texture
   and the factor to scale the frame size by so the solid core lines up with it. */
export function makeRectHaloTexture(color = '#000') {
  const W = 256, H = 320, padPx = 44;
  const [cv, c] = makeCanvas(W, H);
  c.shadowColor = color;
  c.shadowBlur = 30;
  c.shadowOffsetX = 4000;
  c.fillStyle = color;
  c.fillRect(padPx - 4000, padPx, W - padPx * 2, H - padPx * 2);
  return { tex: toTexture(cv), scaleX: W / (W - padPx * 2), scaleY: H / (H - padPx * 2) };
}

/* Soft white radial halo (skylights, lamps) */
export function makeGlowTexture() {
  const S = 256;
  const [cv, c] = makeCanvas(S);
  const g = c.createRadialGradient(S / 2, S / 2, S * 0.18, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.25)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, S, S);
  return toTexture(cv);
}

/* Trail marks (white; tinted by the material colour).
   'footprints' → scribbled shoe print, 'dots' → soft dot, 'pixels' → square */
export function makeTrailTexture(style, { seed = 3, mirror = false } = {}) {
  if (style === 'dots') {
    const S = 64;
    const [cv, c] = makeCanvas(S);
    const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.25)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, S, S);
    return toTexture(cv);
  }
  if (style === 'pixels') {
    const [cv, c] = makeCanvas(8);
    c.fillStyle = '#fff';
    c.fillRect(1, 1, 6, 6);
    return toTexture(cv, { pixel: true });
  }

  // footprints — random-walk scribble confined to two ovals (toe at the top)
  const W = 128, H = 192;
  const rand = rng(seed);
  const [cv, c] = makeCanvas(W, H);
  if (mirror) { c.translate(W, 0); c.scale(-1, 1); }
  c.strokeStyle = 'rgba(255,255,255,0.95)';
  c.lineWidth = 2.2;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const fill = (cx, cy, rx, ry, steps) => {
    let x = cx, y = cy;
    c.beginPath();
    c.moveTo(x, y);
    for (let i = 0; i < steps; i++) {
      const a = rand() * Math.PI * 2, r = 4 + rand() * 10;
      const nx = x + Math.cos(a) * r, ny = y + Math.sin(a) * r;
      const ex = (nx - cx) / rx, ey = (ny - cy) / ry;
      if (ex * ex + ey * ey < 1) { c.lineTo(nx, ny); x = nx; y = ny; }
    }
    c.stroke();
  };
  fill(66, 62, 30, 46, 240);   // ball of the foot
  fill(60, 150, 23, 27, 150);  // heel
  return toTexture(cv);
}

/* =============================================
   PAPER — artwork placeholders, demo art, labels, bio panel
   ============================================= */

/* Placeholder shown in a frame until the real photo is added */
export function drawPlaceholderArt(cv, art, total) {
  const c = cv.getContext('2d');
  const W = cv.width, H = cv.height, m = Math.min(W, H);
  const P = THEME.paper;
  const rand = rng(100 + art.index);

  c.fillStyle = P.bg;
  c.fillRect(0, 0, W, H);

  // Light hatching, like a sketchbook page
  c.strokeStyle = P.ghost;
  c.lineWidth = 1.2;
  for (let i = 0; i < 90; i++) {
    const x = rand() * W * 1.4 - W * 0.2, y = H * 0.55 + rand() * H * 0.5;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 40 + rand() * 60, y - 40 - rand() * 60);
    c.stroke();
  }

  // Oversized ghost numeral
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillStyle = P.ghost;
  c.font = font('title', m * 0.62);
  c.fillText(pad2(art.index + 1), W / 2, H * 0.5);

  // Title + meta
  c.fillStyle = P.ink;
  fitFont(c, art.title, W * 0.8, 'titleAlt', m * 0.11);
  c.fillText(art.title, W / 2, H * 0.66);

  c.fillStyle = P.accent;
  c.fillRect(W / 2 - m * 0.05, H * 0.69, m * 0.1, 2);

  c.fillStyle = P.muted;
  c.font = font('head', m * 0.034);
  spacedText(c, `${art.category} · ${art.year}`.toUpperCase(), W / 2, H * 0.755, m * 0.008, 'center');

  c.fillStyle = P.faint;
  c.font = font('body', m * 0.032);
  c.fillText(`${pad2(art.index + 1)} / ${pad2(total)}  —  photo coming soon`, W / 2, H * 0.93);
}

/* Sample "key art" so the themes can be previewed with colourful frames (?demo) */
export function drawDemoArt(cv, art) {
  const c = cv.getContext('2d');
  const W = cv.width, H = cv.height, m = Math.min(W, H);
  const rand = rng(500 + art.index);
  const mono = THEME.demoArt === 'mono';
  const hue = [205, 160, 18, 275, 340, 95][art.index % 6];
  const col = (h, s, l, a = 1) => (mono ? `hsla(0,0%,${l}%,${a})` : `hsla(${h},${s}%,${l}%,${a})`);

  // sky
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, col(hue + 20, 55, 14));
  sky.addColorStop(0.65, col(hue, 65, 42));
  sky.addColorStop(1, col(hue - 25, 80, 70));
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);

  // stars
  for (let i = 0; i < 80; i++) {
    c.fillStyle = col(0, 0, 100, rand() * 0.8);
    c.fillRect(rand() * W, rand() * H * 0.5, 2, 2);
  }

  // big sun / planet
  const sx = W * (0.55 + rand() * 0.25), sy = H * (0.28 + rand() * 0.15), sr = m * (0.12 + rand() * 0.08);
  const sun = c.createRadialGradient(sx, sy, 0, sx, sy, sr * 2.2);
  sun.addColorStop(0, col(hue + 60, 95, 88));
  sun.addColorStop(0.45, col(hue + 50, 90, 70, 0.9));
  sun.addColorStop(1, col(hue + 40, 90, 60, 0));
  c.fillStyle = sun;
  c.fillRect(0, 0, W, H);

  // layered mountains
  for (let k = 0; k < 3; k++) {
    const base = H * (0.55 + k * 0.13);
    c.fillStyle = col(hue - 15 * k, 45, 26 - k * 8);
    c.beginPath();
    c.moveTo(0, H);
    let y = base;
    for (let x = 0; x <= W + 20; x += W / 18) {
      y = base - rand() * H * (0.16 - k * 0.03);
      c.lineTo(x, y);
    }
    c.lineTo(W, H);
    c.closePath();
    c.fill();
  }

  // tiny hero on a ledge
  const hx = W * (0.2 + rand() * 0.2), hy = H * 0.8;
  c.fillStyle = col(hue + 180, 90, 60);
  c.fillRect(hx, hy - m * 0.07, m * 0.035, m * 0.07);
  c.fillRect(hx - m * 0.01, hy - m * 0.1, m * 0.055, m * 0.035);

  // title
  c.fillStyle = '#ffffff';
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  fitFont(c, art.title.toUpperCase(), W * 0.8, 'title', m * 0.12);
  c.shadowColor = 'rgba(0,0,0,0.35)';
  c.shadowBlur = 16;
  c.fillText(art.title.toUpperCase(), W * 0.07, H * 0.93);
  c.shadowBlur = 0;
}

/* Small museum label beside each frame */
export function drawWallLabel(cv, art, total) {
  const c = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const P = THEME.paper;

  c.fillStyle = P.label;
  c.fillRect(0, 0, W, H);
  c.strokeStyle = P.labelBorder;
  c.lineWidth = 3;
  c.strokeRect(1.5, 1.5, W - 3, H - 3);

  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';

  c.fillStyle = P.faint;
  c.font = font('head', 26);
  spacedText(c, `${pad2(art.index + 1)} / ${pad2(total)}`, 44, 66, 4);

  c.fillStyle = P.ink;
  fitFont(c, art.title, W - 88, 'title', 60);
  c.fillText(art.title, 44, 150);

  c.fillStyle = P.muted;
  c.font = font('headBold', 26);
  spacedText(c, `${art.category} · ${art.year}`.toUpperCase(), 44, 205, 4);

  c.fillStyle = P.faint;
  c.font = font('body', 28);
  c.fillText(art.tech.join(', '), 44, 300);
}

/* Bio text painted straight onto the back wall (transparent background) */
export function drawBackPanel(cv, site) {
  const c = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const P = THEME.paper;
  const style = THEME.decoration;
  const bodyScale = THEME.type.bodyScale ?? 1;
  const L = 150;
  c.clearRect(0, 0, W, H);
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';

  // Some themes hang the text on a sign board instead of painting it on the wall
  if (THEME.panelBoard) {
    c.fillStyle = P.label;
    c.fillRect(40, 40, W - 80, H - 80);
    c.strokeStyle = P.ink;
    c.lineWidth = 24;
    c.strokeRect(52, 52, W - 104, H - 104);
  }

  // Name (terminal theme writes it like a command)
  c.fillStyle = P.wallInk;
  const name = style === 'terminal' ? `${site.name.toLowerCase()}.exe` : site.name;
  fitFont(c, name, W - L * 2, 'title', 230);
  c.fillText(name, L, 330);
  const nameW = c.measureText(name).width;
  if (style === 'terminal') {   // blinking-cursor block
    c.fillStyle = P.accent;
    c.fillRect(L + nameW + 24, 150, 60, 190);
  }

  // Role, letter-spaced
  c.fillStyle = style === 'terminal' ? P.accent : P.wallInk;
  c.font = font('head', 46);
  const role = style === 'terminal' ? `// ${site.role.toLowerCase()}` : site.role.toUpperCase();
  const roleW = spacedText(c, role, L + 8, 430, style === 'terminal' ? 2 : 14);

  // Decoration under the role
  const rand = rng(77);
  const y0 = 500;
  c.strokeStyle = P.accent;
  c.fillStyle = P.accent;
  c.lineWidth = 4;
  c.lineCap = 'round';
  if (style === 'kink') {       // hand-drawn rule with a little kink
    c.strokeStyle = P.wallInk;
    c.beginPath();
    c.moveTo(L + 6, y0);
    const kinkX = L + roleW * 0.28;
    for (let x = L + 6; x <= kinkX; x += 24) c.lineTo(x, y0 + (rand() - 0.5) * 3);
    c.lineTo(kinkX + 40, y0 + 46);
    c.lineTo(kinkX + 70, y0 + 6);
    for (let x = kinkX + 70; x <= L + roleW; x += 24) c.lineTo(x, y0 + 6 + (rand() - 0.5) * 3);
    c.stroke();
  } else if (style === 'rule') {
    c.fillRect(L + 6, y0, Math.min(roleW, 520), 6);
  } else if (style === 'wave') {
    c.lineWidth = 7;
    c.beginPath();
    for (let x = 0; x <= Math.min(roleW, 700); x += 6) {
      const y = y0 + Math.sin(x / 34) * 12;
      x ? c.lineTo(L + 6 + x, y) : c.moveTo(L + 6, y);
    }
    c.stroke();
  } else if (style === 'pixel') {
    for (let i = 0; i < 14; i++) c.fillRect(L + 6 + i * 44, y0 - 10, 28, 28);
  }

  // Paragraphs
  c.fillStyle = P.wallBody;
  c.font = font('body', 52);
  let y = 690;
  site.bio.forEach((para) => {
    const text = style === 'terminal' ? `> ${para}` : para;
    wrapLines(c, text, W - L * 2).forEach((line) => { c.fillText(line, L, y); y += 82 * bodyScale; });
    y += 44;
  });

  // Nudge toward the contact circle
  c.fillStyle = style === 'kink' ? P.wallInk : P.accent;
  c.font = font('headBold', 40);
  spacedText(c, 'STAND IN THE CIRCLE BELOW TO SAY HELLO', L, H - 70, 8);
}

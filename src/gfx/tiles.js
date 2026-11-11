// 16x16 tiles painted procedurally (seeded, so they look the same every run).
import { PAL } from './palette.js';
import { paint } from './pixel.js';

export const T = 16;

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

function speckle(g, r, color, n, x0 = 0, y0 = 0, w = T, h = T) {
  for (let i = 0; i < n; i++) px(g, color, x0 + Math.floor(r() * w), y0 + Math.floor(r() * h));
}

// --- painters ---------------------------------------------------------------

function wallTop(g, r) {
  px(g, PAL.ink, 0, 0, T, T);
  speckle(g, r, PAL.deep, 10);
}

function wallFace(g, r) {
  // faded damask wallpaper over a wooden wainscot
  px(g, PAL.shade, 0, 0, T, 11);
  for (let x = 1; x < T; x += 4) {
    for (let y = 1; y < 10; y += 4) { px(g, PAL.grey, x + 1, y, 1, 1); px(g, PAL.grey, x, y + 1, 3, 1); px(g, PAL.grey, x + 1, y + 2, 1, 1); }
  }
  speckle(g, r, PAL.deep, 12, 0, 0, T, 11);
  px(g, PAL.wood, 0, 11, T, 5);
  px(g, PAL.dim, 0, 11, T, 1);
  px(g, PAL.ink, 0, 15, T, 1);
  for (let x = 3; x < T; x += 8) px(g, PAL.ink, x, 12, 1, 3);
}

function woodFloor(g, r) {
  px(g, PAL.wood, 0, 0, T, T);
  for (let y = 0; y < T; y += 4) {
    px(g, PAL.ink, 0, y + 3, T, 1);
    const seam = Math.floor(r() * T);
    px(g, PAL.ink, seam, y, 1, 3);
  }
  speckle(g, r, PAL.grey, 8);
  speckle(g, r, PAL.shade, 10);
}

function stageFloor(g, r) {
  px(g, PAL.grey, 0, 0, T, T);
  for (let x = 0; x < T; x += 4) px(g, PAL.wood, x + 3, 0, 1, T);
  speckle(g, r, PAL.dim, 6);
  speckle(g, r, PAL.wood, 10);
}

function tileFloor(g, r) {
  px(g, PAL.frost, 0, 0, T, T);
  px(g, PAL.moon, 0, 7, T, 1);
  px(g, PAL.moon, 7, 0, 1, T);
  px(g, PAL.moon, 15, 0, 1, T);
  px(g, PAL.moon, 0, 15, T, 1);
  speckle(g, r, PAL.bone, 6);
  speckle(g, r, PAL.dim, 4); // grime
  if (r() < 0.3) px(g, PAL.red, Math.floor(r() * 14), Math.floor(r() * 14), 2, 1);
}

function carpet(g, r) {
  px(g, PAL.red, 0, 0, T, T);
  for (let i = 0; i < T; i += 8) {
    px(g, PAL.ink, i + 3, 3, 2, 2);
    px(g, PAL.ink, i + 3, 11, 2, 2);
    px(g, PAL.candle, i + 7, 7, 1, 1);
  }
  speckle(g, r, '#5e0a10', 14);
}

function blackWater(g, r, f = 0) {
  px(g, PAL.ink, 0, 0, T, T);
  const rr = rng(97 + f * 13);
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(rr() * 12), y = Math.floor(rr() * 15);
    px(g, PAL.deep, x, y, 3 + Math.floor(rr() * 3), 1);
  }
  if (f % 2 === 0) px(g, PAL.moon, Math.floor(rr() * 14), Math.floor(rr() * 14), 2, 1);
}

function ice(g, r) {
  px(g, PAL.frost, 0, 0, T, T);
  speckle(g, r, PAL.bone, 16);
  speckle(g, r, PAL.moon, 10);
  if (r() < 0.12) { // a hairline crack
    let x = Math.floor(r() * T), y = 0;
    while (y < T) { px(g, PAL.moon, x, y); y++; x += r() < 0.5 ? -1 : 1; x = Math.max(0, Math.min(T - 1, x)); }
  }
}

function snow(g, r) {
  px(g, PAL.bone, 0, 0, T, T);
  speckle(g, r, PAL.frost, 22);
  speckle(g, r, '#ffffff', 6);
}

function iceHole(g, r, f = 0) {
  blackWater(g, r, f);
}

function windowTile(g, r, f = 0) {
  wallFace(g, r);
  px(g, PAL.wood, 2, 1, 12, 11);
  px(g, PAL.deep, 3, 2, 10, 9);
  px(g, PAL.moon, 3, 7, 10, 4); // the lake beyond
  px(g, PAL.frost, 3, 6, 10, 1);
  px(g, PAL.wood, 7, 2, 1, 9);
  px(g, PAL.wood, 3, 6, 10, 0);
  const rr = rng(400 + f);
  for (let i = 0; i < 5; i++) px(g, PAL.bone, 3 + Math.floor(rr() * 10), 2 + ((Math.floor(rr() * 9) + f) % 9));
  px(g, PAL.frost, 3, 2, 1, 1);
}

function doorTile(g) {
  px(g, PAL.ink, 1, 0, 14, T);
  px(g, PAL.wood, 2, 1, 12, 15);
  px(g, PAL.shade, 4, 3, 3, 5);
  px(g, PAL.shade, 9, 3, 3, 5);
  px(g, PAL.shade, 4, 10, 3, 4);
  px(g, PAL.shade, 9, 10, 3, 4);
  px(g, PAL.candle, 11, 9, 1, 1);
}

function mirrorTile(g, r) {
  px(g, PAL.dim, 0, 0, T, 12);
  px(g, PAL.deep, 1, 1, 14, 10);
  for (let y = 1; y < 11; y++) if ((y * 7) % 5 === 0) px(g, PAL.moon, 2 + (y % 3), y, 3, 1);
  px(g, PAL.wood, 0, 12, T, 4);
  px(g, PAL.ink, 0, 15, T, 1);
  speckle(g, r, PAL.shade, 3, 1, 1, 14, 10);
}

function barreTile(g, r) {
  wallFace(g, r);
  px(g, PAL.dim, 0, 7, T, 2);
  px(g, PAL.ink, 0, 9, T, 1);
  px(g, PAL.grey, 4, 9, 1, 2);
  px(g, PAL.grey, 12, 9, 1, 2);
}

function curtainTile(g, r) {
  px(g, PAL.red, 0, 0, T, T);
  for (let x = 0; x < T; x += 4) { px(g, '#5e0a10', x, 0, 1, T); px(g, PAL.bright, x + 2, 0, 1, T); }
  speckle(g, r, PAL.ink, 6);
}

function shelfTile(g, r) {
  px(g, PAL.wood, 0, 0, T, T);
  for (let y = 0; y < T; y += 8) {
    px(g, PAL.ink, 0, y + 7, T, 1);
    let x = 1;
    while (x < 15) {
      const w = 1 + Math.floor(r() * 2);
      const c = [PAL.red, PAL.deep, PAL.dim, PAL.shade, PAL.moon][Math.floor(r() * 5)];
      px(g, c, x, y + 1 + Math.floor(r() * 2), w, 6);
      x += w + (r() < 0.2 ? 1 : 0);
    }
  }
}

function voidTile(g) { px(g, '#000000', 0, 0, T, T); }

function doorway(g, r) {
  woodFloor(g, r);
  px(g, PAL.ink, 0, 8, T, 8);
  px(g, PAL.shade, 0, 7, T, 1);
}

function stairs(g) {
  px(g, PAL.ink, 0, 0, T, T);
  for (let y = 0; y < T; y += 4) { px(g, PAL.wood, 1, y, 14, 2); px(g, PAL.grey, 1, y, 14, 1); }
  px(g, PAL.dim, 0, 0, 1, T); px(g, PAL.dim, 15, 0, 1, T);
}

// char -> {paint(g, r, frame), frames}
const DEFS = {
  ' ': { p: voidTile },
  '#': { p: wallTop },
  '=': { p: wallFace },
  '.': { p: woodFloor },
  ',': { p: tileFloor },
  '_': { p: carpet },
  '~': { p: blackWater, frames: 4 },
  '*': { p: ice },
  ':': { p: snow },
  '|': { p: windowTile, frames: 4 },
  '+': { p: doorTile },
  'M': { p: mirrorTile },
  'B': { p: barreTile },
  'S': { p: stageFloor },
  'C': { p: curtainTile },
  'L': { p: shelfTile },
  'O': { p: iceHole, frames: 4 },
  'D': { p: doorway },
  'v': { p: stairs },
};

// Each char gets 3 seeded variants so floors don't look stamped.
const cache = {};
function build(ch, variant, frame) {
  const key = `${ch}:${variant}:${frame}`;
  if (!cache[key]) {
    const d = DEFS[ch];
    cache[key] = paint(T, T, (g) => d.p(g, rng(ch.charCodeAt(0) * 131 + variant * 7919 + 1), frame));
  }
  return cache[key];
}

export const TILE_CHARS = Object.keys(DEFS);

export function tileFrame(ch, t = 0, tx = 0, ty = 0) {
  const d = DEFS[ch] || DEFS[' '];
  const variant = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
  const frame = d.frames ? Math.floor(t * 3 + (variant % 4)) % d.frames : 0;
  return build(DEFS[ch] ? ch : ' ', variant % 3, frame);
}

export const TILES = new Proxy({}, { get: (_, ch) => tileFrame(String(ch)) });

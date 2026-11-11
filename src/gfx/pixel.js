import { CHARS, hexToRgb } from './palette.js';

// Pure: turn rows of palette chars into an RGBA buffer.
export function decodeRows(rows, chars = CHARS) {
  const h = rows.length;
  const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const rgba = new Uint8ClampedArray(w * h * 4);
  const cache = {};
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (!(ch in chars)) throw new Error(`unknown sprite char "${ch}"`);
      const hex = chars[ch];
      if (hex === null) continue;
      const rgb = cache[hex] || (cache[hex] = hexToRgb(hex));
      const i = (y * w + x) * 4;
      rgba[i] = rgb[0]; rgba[i + 1] = rgb[1]; rgba[i + 2] = rgb[2]; rgba[i + 3] = 255;
    }
  }
  return { w, h, rgba };
}

export function newCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export function makeSprite(rows, chars = CHARS) {
  const { w, h, rgba } = decodeRows(rows, chars);
  const c = newCanvas(w, h);
  c.getContext('2d').putImageData(new ImageData(rgba, w, h), 0, 0);
  return c;
}

export function flipX(src) {
  const c = newCanvas(src.width, src.height);
  const g = c.getContext('2d');
  g.translate(src.width, 0);
  g.scale(-1, 1);
  g.drawImage(src, 0, 0);
  return c;
}

// Draw into a fresh canvas with a callback; handy for procedural tiles.
export function paint(w, h, fn) {
  const c = newCanvas(w, h);
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  fn(g, w, h);
  return c;
}

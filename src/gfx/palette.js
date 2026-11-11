// The MUTE SWAN palette. Exact values from the spec (§8) plus darkened shades.
export const PAL = {
  ink: '#0b0a0c',
  deep: '#141a2b',
  moon: '#5b7397',
  frost: '#a9bcd3',
  bone: '#e8e1d3',
  candle: '#f0b45a',
  red: '#8f0f17',
  bright: '#d01f2a',
  shade: '#2a2633',
  dim: '#9a8a70',
  wood: '#3b2a22',
  grey: '#6b5f57',
};

// One-character keys used in string sprites. '.' is transparent.
export const CHARS = {
  '.': null,
  k: PAL.ink,
  b: PAL.deep,
  m: PAL.moon,
  f: PAL.frost,
  w: PAL.bone,
  c: PAL.candle,
  r: PAL.red,
  R: PAL.bright,
  s: PAL.shade,
  d: PAL.dim,
  o: PAL.wood,
  g: PAL.grey,
};

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

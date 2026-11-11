// Characters (16x24, the Prima 16x40) and props, drawn procedurally at pixel level.
import { PAL } from './palette.js';
import { paint, flipX } from './pixel.js';

const K = PAL.ink, B = PAL.deep, M = PAL.moon, F = PAL.frost, W = PAL.bone, C = PAL.candle,
  R = PAL.red, RB = PAL.bright, S = PAL.shade, D = PAL.dim, O = PAL.wood, G = PAL.grey;

const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

// --- Mira: dark bun, pale wet nightgown, bare feet ---------------------------
function mira(g, dir, f) {
  const sway = f === 1 ? -1 : f === 2 ? 1 : 0;
  if (dir === 'down' || dir === 'up') {
    px(g, K, 6, 0, 4, 3); px(g, B, 7, 1, 2, 1);
    px(g, K, 4, 3, 8, 3);
    if (dir === 'down') {
      px(g, W, 5, 6, 6, 4); px(g, K, 4, 6, 1, 4); px(g, K, 11, 6, 1, 4);
      px(g, K, 5, 6, 2, 1); // swept bangs
      px(g, S, 6, 7); px(g, S, 9, 7);
      px(g, M, 6, 8); // a wet streak under the eye
    } else {
      px(g, K, 4, 6, 8, 4);
    }
    px(g, W, 7, 10, 2, 1);
    px(g, F, 5, 11, 6, 1); px(g, F, 4, 12, 8, 5);
    px(g, M, 7, 13, 1, 6);
    px(g, W, 3, 12, 1, 5); px(g, W, 12, 12, 1, 5); px(g, W, 3, 17); px(g, W, 12, 17);
    px(g, F, 3, 17, 10, 2);
    px(g, F, 2 + sway, 19, 12, 2); px(g, M, 2 + sway, 21, 12, 1);
    px(g, M, 4 + sway, 20, 1, 1); px(g, M, 10 + sway, 19, 1, 1);
    if (f === 0) { px(g, W, 5, 22, 2, 1); px(g, W, 9, 22, 2, 1); }
    if (f === 1) { px(g, W, 5, 22, 2, 2); }
    if (f === 2) { px(g, W, 9, 22, 2, 2); }
    px(g, M, 6 + f * 2, 23); // drip
  } else { // right
    px(g, K, 3, 2, 3, 3); px(g, B, 4, 3);
    px(g, K, 5, 3, 6, 3); px(g, K, 5, 6, 3, 4);
    px(g, W, 8, 6, 3, 4); px(g, W, 11, 7); px(g, S, 9, 7);
    px(g, W, 7, 10, 2, 1);
    px(g, F, 5, 11, 6, 6); px(g, M, 6, 12, 1, 6);
    px(g, W, 8, 12, 1, 5); px(g, W, 8, 17);
    px(g, F, 4, 17, 8, 3); px(g, F, 4 + sway, 20, 8, 1); px(g, M, 4 + sway, 21, 8, 1);
    if (f === 0) { px(g, W, 6, 22, 2, 1); px(g, W, 8, 22, 2, 1); }
    if (f === 1) { px(g, W, 4, 22, 2, 1); px(g, W, 10, 22, 2, 1); }
    if (f === 2) { px(g, W, 7, 22, 2, 1); }
    px(g, M, 5 + f, 23);
  }
}

// --- Vesna: ash-blonde messy bob, black coat, red scarf, boots ---------------
function vesna(g, dir, f) {
  const lL = f === 1 ? 1 : 0, lR = f === 2 ? 1 : 0;
  if (dir === 'down' || dir === 'up') {
    px(g, D, 4, 1, 8, 5); px(g, D, 3, 4); px(g, D, 12, 3, 1, 2);
    px(g, W, 6, 1, 2, 1); px(g, W, 9, 2);
    if (dir === 'down') {
      px(g, W, 5, 5, 6, 5); px(g, D, 4, 5, 1, 4); px(g, D, 11, 5, 1, 4); px(g, D, 5, 5, 3, 1);
      px(g, K, 6, 7); px(g, K, 9, 7); px(g, S, 6, 8); px(g, S, 9, 8);
      px(g, R, 7, 9, 2, 1);
    } else {
      px(g, D, 4, 5, 8, 5);
    }
    px(g, R, 5, 10, 6, 1);
    px(g, S, 4, 11, 8, 9); px(g, K, 7, 12, 1, 8); px(g, K, 4, 19, 8, 1);
    px(g, S, 3, 11, 1, 7); px(g, S, 12, 11, 1, 7); px(g, K, 2, 12, 1, 5); px(g, K, 13, 12, 1, 5);
    px(g, W, 3, 18); px(g, W, 12, 18);
    if (dir === 'down') { px(g, R, 9, 11, 1, 4); if (f === 0) px(g, C, 13, 18); }
    px(g, K, 5, 20, 2, 3 - lL); px(g, K, 9, 20, 2, 3 - lR);
    px(g, K, 5, 23 - lL, 2, 1); px(g, K, 9, 23 - lR, 2, 1);
  } else {
    px(g, D, 4, 1, 7, 8); px(g, W, 6, 1, 2, 1); px(g, D, 3, 3);
    px(g, W, 8, 5, 3, 5); px(g, K, 9, 7); px(g, R, 10, 9);
    px(g, R, 6, 10, 5, 1);
    px(g, S, 5, 11, 6, 9); px(g, K, 5, 19, 6, 1);
    px(g, K, 8, 11, 1, 7); px(g, W, 8, 18); if (f === 0) px(g, C, 9, 18);
    px(g, K, 6 - lL, 20, 2, 3); px(g, K, 8 + lR, 20, 2, 3); px(g, K, 6 - lL, 23, 3, 1); px(g, K, 8 + lR, 23, 3, 1);
  }
}

// --- The Prima: faceless mask, swan neck, wet black feather tutu, en pointe --
function prima(g, dir, f, reach = false) {
  const drop = reach ? 4 : 0;
  const curve = (y) => Math.round(Math.sin((y - 5) / 3.2) * (reach ? 2 : 1));
  // neck
  for (let y = 5 + drop; y < 17; y++) { const x = 7 + curve(y); px(g, G, x, y, 2, 1); px(g, W, x, y); }
  // head
  const hx = 6 + curve(5 + drop), hy = drop;
  if (dir === 'up') {
    px(g, K, hx, hy, 4, 5);
  } else if (dir === 'down') {
    px(g, W, hx, hy, 4, 5); px(g, W, hx + 1, hy - 1, 2, 1);
    px(g, K, hx, hy + 2); px(g, K, hx + 3, hy + 2);
    px(g, R, hx, hy + 3); px(g, R, hx + 3, hy + 3, 1, 2);
  } else {
    px(g, W, hx + 1, hy, 4, 5); px(g, W, hx + 5, hy + 2, 2, 1); px(g, W, hx + 7, hy + 3); // long pale "beak"
    px(g, K, hx + 3, hy + 2); px(g, R, hx + 3, hy + 3);
  }
  px(g, K, hx - 1, hy, 1, 2); px(g, K, hx + 4, hy, 1, 2); // feather crown
  // shoulders, bodice
  px(g, K, 5, 17, 6, 1); px(g, K, 6, 18, 4, 6); px(g, S, 7, 19, 1, 4);
  // arms
  if (reach) {
    for (let i = 0; i < 16; i++) { px(g, G, 4 - Math.floor(i / 5), 18 + i); px(g, G, 11 + Math.floor(i / 5), 18 + i); }
    px(g, W, 0, 34, 1, 3); px(g, W, 1, 34, 1, 2); px(g, W, 15, 34, 1, 3); px(g, W, 14, 34, 1, 2);
  } else {
    px(g, G, 4, 18, 1, 13); px(g, G, 11, 18, 1, 13);
    px(g, W, 4, 31, 1, 3); px(g, W, 11, 31, 1, 3);
  }
  // tutu of wet black feathers
  px(g, K, 3, 24, 10, 1); px(g, K, 1, 25, 14, 1); px(g, K, 0, 26, 16, 1);
  for (let x = 1; x < 15; x += 2) px(g, K, x, 27);
  for (const [x, y] of [[2, 25], [6, 26], [10, 25], [13, 26], [4, 26]]) px(g, (x + f) % 3 ? S : M, x, y);
  // legs en pointe
  const lift = f === 1 ? 2 : 0;
  px(g, G, 6, 28, 1, 10 - lift); px(g, W, 6, 38 - lift, 1, 2);
  px(g, G, 9, 28, 1, 10); px(g, W, 9, 38, 1, 2);
  px(g, M, 3 + f * 4, 28); // dripping
}

// --- props -------------------------------------------------------------------
const PROPS = {
  bed: [16, 32, (g) => {
    px(g, O, 0, 0, 16, 5); px(g, K, 0, 5, 16, 1);
    px(g, W, 2, 6, 12, 5); px(g, F, 2, 10, 12, 1);
    px(g, F, 1, 11, 14, 19); px(g, M, 1, 14, 14, 1); px(g, M, 4, 15, 1, 14); px(g, M, 11, 18, 1, 11);
    px(g, M, 3, 22, 3, 1); px(g, O, 0, 30, 16, 2);
  }],
  bed_dark: [16, 32, (g) => {
    px(g, O, 0, 0, 16, 5); px(g, K, 0, 5, 16, 1);
    px(g, W, 2, 6, 12, 5);
    px(g, S, 1, 11, 14, 19); px(g, K, 1, 14, 14, 1); px(g, R, 3, 16, 9, 2); px(g, R, 10, 18, 2, 6);
    px(g, O, 0, 30, 16, 2);
  }],
  candle: [8, 12, (g, f) => {
    px(g, D, 1, 10, 6, 2); px(g, W, 3, 4, 2, 6); px(g, F, 3, 4, 1, 6);
    px(g, C, 3, 1 + f, 2, 3 - f); px(g, W, 3, 2 + f); px(g, RB, 4, 0 + f * 2);
  }, 2],
  candelabra: [16, 24, (g, f) => {
    px(g, D, 7, 8, 2, 14); px(g, D, 4, 22, 8, 2); px(g, D, 2, 8, 12, 1);
    for (const x of [2, 7, 12]) { px(g, W, x, 4, 2, 4); px(g, C, x, 1 + f, 2, 3 - f); px(g, W, x, 2 + f); }
  }, 2],
  piano: [32, 26, (g) => {
    px(g, K, 0, 0, 32, 20); px(g, S, 1, 1, 30, 1); px(g, M, 2, 2, 12, 1); px(g, S, 30, 1, 1, 18);
    px(g, K, 4, 20, 24, 2);
    for (let x = 4; x < 28; x++) px(g, x % 2 ? W : F, x, 22, 1, 3);
    for (const x of [5, 7, 10, 12, 14, 17, 19, 22, 24, 26]) px(g, K, x, 22, 1, 2);
  }],
  bench: [16, 8, (g) => { px(g, K, 0, 0, 16, 5); px(g, S, 1, 1, 14, 1); px(g, K, 1, 5, 1, 3); px(g, K, 14, 5, 1, 3); }],
  wardrobe: [16, 32, (g) => {
    px(g, K, 0, 0, 16, 32); px(g, O, 1, 1, 14, 30); px(g, K, 7, 4, 2, 26);
    px(g, S, 2, 4, 4, 10); px(g, S, 10, 4, 4, 10); px(g, S, 2, 17, 4, 11); px(g, S, 10, 17, 4, 11);
    px(g, C, 6, 16); px(g, C, 9, 16); px(g, D, 0, 0, 16, 1);
  }],
  rack: [32, 24, (g) => {
    px(g, G, 0, 2, 32, 1); px(g, G, 1, 2, 1, 22); px(g, G, 30, 2, 1, 22);
    const cols = [[F, W], [K, S], [F, W], [K, S], [F, W], [K, S]];
    cols.forEach(([a, b], i) => {
      const x = 2 + i * 5;
      px(g, D, x + 2, 3, 1, 2); px(g, a, x + 1, 5, 3, 6);
      px(g, a, x - 1, 11, 7, 2); px(g, b, x, 12, 5, 1); px(g, a, x, 13, 5, 1);
    });
  }],
  mannequin: [16, 24, (g, f) => {
    px(g, D, 7, 17, 2, 6); px(g, D, 4, 23, 8, 1);
    px(g, D, 5, 4, 6, 9); px(g, G, 5, 4, 1, 9);
    px(g, F, 3, 12, 10, 2); px(g, W, 2, 14, 12, 1); px(g, F, 4, 15, 8, 1);
    px(g, D, 6, 0, 4, 4); px(g, D, 7, 3, 2, 1);
    if (f === 1) { px(g, K, 6, 1); px(g, K, 9, 1); px(g, R, 7, 3, 2, 1); } // it turned to look
  }, 2],
  desk: [32, 16, (g) => {
    px(g, K, 0, 0, 32, 14); px(g, O, 1, 1, 30, 12);
    px(g, W, 4, 3, 7, 5); px(g, F, 5, 4, 5, 1); px(g, F, 5, 6, 4, 1);
    px(g, R, 14, 4, 8, 6); px(g, K, 18, 4, 1, 6);
    px(g, D, 25, 2, 3, 3); px(g, C, 26, 3);
    px(g, K, 2, 14, 2, 2); px(g, K, 28, 14, 2, 2);
  }],
  safe: [16, 16, (g, f) => {
    px(g, K, 0, 0, 16, 16); px(g, G, 1, 1, 14, 14); px(g, S, 2, 2, 12, 12);
    if (f === 1) { px(g, K, 2, 2, 12, 12); px(g, G, 13, 2, 2, 12); }
    else { px(g, D, 6, 5, 4, 4); px(g, K, 7, 6, 2, 2); px(g, D, 11, 7, 2, 1); }
  }, 2],
  tub: [32, 16, (g, f) => {
    px(g, W, 0, 1, 32, 14); px(g, F, 0, 13, 32, 2); px(g, K, 2, 3, 28, 10);
    px(g, B, 4, 5 + (f % 2), 6, 1); px(g, M, 18, 8 - (f % 2), 3, 1);
    px(g, D, 1, 15, 2, 1); px(g, D, 29, 15, 2, 1);
  }, 2],
  tub_bubble: [32, 16, (g, f) => {
    PROPS.tub[2](g, f);
    for (let i = 0; i < 4; i++) { const x = 8 + ((i * 7 + f * 3) % 16), y = 5 + ((i * 3 + f) % 6); px(g, M, x, y, 2, 2); px(g, K, x, y); }
  }, 2],
  tub_corpse: [32, 16, (g, f) => {
    PROPS.tub[2](g, f);
    px(g, K, 5, 4, 10, 8); px(g, B, 6, 5, 8, 1);  // hair floating
    px(g, W, 13, 6, 6, 4); px(g, F, 13, 9, 6, 1);  // face up, too far from the shoulders
    px(g, S, 14, 7); px(g, S, 17, 7);
    px(g, W, 18, 8, 2, 1); px(g, W, 20, 7, 2, 1); px(g, F, 21, 6, 2, 1); // feathers stuffed in the mouth
    px(g, W, 19, 4, 8, 2); px(g, G, 19, 4, 8, 1); // the stretched neck over the rim
    px(g, W, 27, 2, 3, 3); // a hand on the rim, holding something
    px(g, C, 28, 1);
    px(g, R, 21, 10, 5, 1); px(g, R, 24, 11, 3, 1); px(g, RB, 22, 10);
  }, 2],
  portrait_l: [16, 16, (g) => portrait(g, -1)],
  portrait_c: [16, 16, (g) => portrait(g, 0)],
  portrait_r: [16, 16, (g) => portrait(g, 1)],
  seat: [16, 16, (g) => {
    px(g, K, 1, 0, 14, 9); px(g, R, 2, 1, 12, 7); px(g, RB, 3, 2, 10, 1);
    px(g, R, 2, 9, 12, 5); px(g, K, 1, 14, 14, 2);
  }],
  musicbox: [16, 16, (g, f) => {
    px(g, K, 2, 8, 12, 8); px(g, O, 3, 9, 10, 6); px(g, C, 3, 9, 10, 1);
    px(g, W, 7, 2, 2, 6); px(g, W, 5 + f, 4, 6, 1); px(g, F, 6, 7, 4, 1); px(g, K, 7, 1, 2, 1);
  }, 2],
  chain: [16, 16, (g) => {
    for (let i = 0; i < 8; i++) { px(g, G, i * 2, 4 + (i % 2), 2, 2); px(g, G, i * 2, 10 - (i % 2), 2, 2); }
    px(g, D, 6, 6, 4, 5); px(g, K, 7, 8, 2, 2); px(g, G, 6, 4, 4, 2);
  }],
  glass: [16, 32, (g) => {
    px(g, F, 0, 0, 16, 32); px(g, W, 1, 1, 14, 30);
    for (let y = 2; y < 30; y += 3) px(g, F, 2 + (y % 5), y, 8, 1);
    px(g, G, 0, 0, 1, 32); px(g, G, 15, 0, 1, 32);
  }],
  note: [8, 8, (g) => { px(g, W, 0, 1, 8, 6); px(g, F, 0, 6, 8, 1); px(g, K, 1, 2, 5, 1); px(g, K, 1, 4, 4, 1); px(g, R, 6, 2); }],
  key: [8, 8, (g) => { px(g, C, 0, 2, 3, 3); px(g, K, 1, 3); px(g, C, 3, 3, 5, 1); px(g, C, 6, 4, 1, 2); px(g, C, 4, 4, 1, 1); }],
  lighter: [8, 8, (g) => { px(g, F, 2, 2, 4, 5); px(g, W, 2, 2, 1, 5); px(g, G, 2, 1, 4, 1); px(g, R, 3, 4, 2, 1); }],
  ribbon: [8, 8, (g) => { px(g, W, 1, 1, 2, 2); px(g, W, 5, 1, 2, 2); px(g, F, 3, 2, 2, 1); px(g, W, 2, 3, 1, 4); px(g, W, 5, 3, 1, 4); px(g, R, 3, 1); }],
  feather: [8, 8, (g) => { for (let i = 0; i < 7; i++) { px(g, W, 1 + i, 6 - i); px(g, F, i, 6 - i); } px(g, G, 0, 7); }],
  paper: [8, 8, (g) => { px(g, W, 1, 1, 6, 7); px(g, F, 2, 3, 4, 1); px(g, F, 2, 5, 3, 1); px(g, M, 4, 6, 2, 1); }],
  playbill: [8, 8, (g) => { px(g, W, 1, 0, 6, 8); px(g, R, 2, 1, 4, 2); px(g, K, 2, 4, 4, 1); px(g, K, 2, 6, 3, 1); }],
  stool: [8, 8, (g) => { px(g, O, 0, 0, 8, 4); px(g, K, 1, 4, 1, 4); px(g, K, 6, 4, 1, 4); }],
  sink: [16, 16, (g) => { px(g, W, 1, 2, 14, 10); px(g, K, 3, 4, 10, 6); px(g, M, 5, 5, 3, 1); px(g, G, 7, 0, 2, 3); px(g, R, 9, 9, 3, 1); }],
  moon: [32, 32, (g) => {
    px(g, G, 15, 0, 2, 4);
    for (let y = 0; y < 26; y++) for (let x = 0; x < 26; x++) {
      const dx = x - 12.5, dy = y - 12.5, d = dx * dx + dy * dy;
      if (d < 156) px(g, d < 100 ? W : F, x + 3, y + 5);
    }
    px(g, F, 10, 12, 3, 2); px(g, F, 18, 20, 4, 2); px(g, D, 14, 16, 2, 1);
  }],
  mask: [16, 24, (g) => {
    px(g, W, 4, 2, 8, 12); px(g, W, 5, 1, 6, 1); px(g, W, 5, 14, 6, 2); px(g, F, 4, 12, 8, 2);
    px(g, K, 5, 6, 2, 2); px(g, K, 9, 6, 2, 2); px(g, K, 7, 11, 2, 1);
    px(g, R, 6, 8, 1, 3); px(g, R, 10, 8, 1, 2);
  }],
  swan: [16, 16, (g) => { px(g, W, 3, 9, 10, 4); px(g, W, 11, 3, 2, 7); px(g, W, 12, 2, 3, 2); px(g, C, 15, 3); px(g, K, 13, 2); px(g, F, 4, 12, 8, 1); }],
};

function portrait(g, look) {
  px(g, C, 0, 0, 16, 16); px(g, D, 1, 1, 14, 14); px(g, B, 2, 2, 12, 12);
  px(g, K, 5, 3, 6, 4); px(g, W, 6, 5, 4, 5); px(g, K, 5, 5, 1, 4); px(g, K, 10, 5, 1, 4);
  px(g, K, 7 + look, 7); px(g, K, 9 + look, 7);
  px(g, S, 4, 10, 8, 4); px(g, W, 7, 10, 2, 1);
}

// --- build everything --------------------------------------------------------
function charSet(fn, frames, w, h) {
  const out = {};
  for (const dir of ['down', 'up', 'right']) {
    out[dir] = [];
    for (let f = 0; f < frames; f++) out[dir].push(paint(w, h, (g) => fn(g, dir, f)));
  }
  out.left = out.right.map(flipX);
  return out;
}

export const SPRITES = {};
export function buildSprites() {
  SPRITES.mira = charSet(mira, 3, 16, 24);
  SPRITES.vesna = charSet(vesna, 3, 16, 24);
  SPRITES.prima = charSet(prima, 2, 16, 40);
  SPRITES.prima.reach = paint(16, 40, (g) => prima(g, 'down', 0, true));
  for (const [name, [w, h, fn, frames = 1]] of Object.entries(PROPS)) {
    const list = [];
    for (let f = 0; f < frames; f++) list.push(paint(w, h, (g) => fn(g, f)));
    SPRITES[name] = list.length === 1 ? list[0] : list;
  }
  return SPRITES;
}

// Frame helper: props with several frames animate at `fps`.
export function propFrame(name, t = 0, fps = 4) {
  const s = SPRITES[name];
  return Array.isArray(s) ? s[Math.floor(t * fps) % s.length] : s;
}

// Darkness with Bayer-dithered falloff around lights, plus a soft colour glow.
import { hexToRgb, PAL } from './palette.js';
import { newCanvas } from './pixel.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const LEVELS = 9;

let W = 320, H = 180;
let buf = null, img = null, cv = null, cg = null;
const lights = [];
const INK = hexToRgb(PAL.ink);

function ensure(w, h) {
  if (cv && W === w && H === h) return;
  W = w; H = h;
  cv = newCanvas(W, H);
  cg = cv.getContext('2d');
  img = cg.createImageData(W, H);
  buf = new Float32Array(W * H);
}

export const Lighting = {
  begin(ctx) { ensure(ctx.canvas.width, ctx.canvas.height); lights.length = 0; },
  // x, y, radius in screen pixels; flicker 0..1
  light(x, y, radius, color = PAL.candle, flicker = 0, strength = 1) {
    const t = performance.now() / 1000;
    const n = flicker ? (Math.sin(t * 11.3 + x) * 0.5 + Math.sin(t * 23.7 + y) * 0.3) * flicker : 0;
    lights.push({ x, y, r: radius * (1 + n * 0.08), color, strength });
  },
  end(ctx, ambient = 0) {
    buf.fill(Math.max(0, Math.min(1, ambient)));
    for (const L of lights) {
      const x0 = Math.max(0, Math.floor(L.x - L.r)), x1 = Math.min(W - 1, Math.ceil(L.x + L.r));
      const y0 = Math.max(0, Math.floor(L.y - L.r)), y1 = Math.min(H - 1, Math.ceil(L.y + L.r));
      const r2 = L.r * L.r;
      for (let y = y0; y <= y1; y++) {
        const dy = y - L.y;
        for (let x = x0; x <= x1; x++) {
          const dx = x - L.x;
          const d2 = dx * dx + dy * dy;
          if (d2 >= r2) continue;
          const k = 1 - d2 / r2;
          buf[y * W + x] += k * k * 1.6 * L.strength;
        }
      }
    }
    const data = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const dark = 1 - Math.min(1, buf[i]);
        const q = Math.min(LEVELS - 1, Math.floor(dark * (LEVELS - 1) + BAYER[(y & 3) * 4 + (x & 3)]));
        const o = i * 4;
        data[o] = INK[0]; data[o + 1] = INK[1]; data[o + 2] = INK[2];
        data[o + 3] = Math.round((q / (LEVELS - 1)) * 255);
      }
    }
    cg.putImageData(img, 0, 0);
    ctx.drawImage(cv, 0, 0);
    // colour glow
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const L of lights) {
      if (!L.color) continue;
      const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r * 0.8);
      const [r, gg, b] = hexToRgb(L.color);
      g.addColorStop(0, `rgba(${r},${gg},${b},${0.16 * L.strength})`);
      g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
    }
    ctx.restore();
  },
};

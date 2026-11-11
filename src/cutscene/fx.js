// Cutscene effects: parallax backdrops, particles, ink-bleed transitions, grain and vignette.
// Everything draws in the 320x180 virtual space on the hi-res UI layer.
import { PAL, rgba } from '../gfx/palette.js';
import { newCanvas } from '../gfx/pixel.js';

const W = 320, H = 180;
const rnd = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

// layer(d, fn): draw fn at parallax depth d (0 = fixed to the screen, 1 = moves with the world)
export function makeLayer(ctx, cam) {
  const base = ctx.getTransform();
  return (d, fn) => {
    ctx.save();
    ctx.setTransform(base);
    const z = 1 + (cam.zoom - 1) * d;
    const cx = 160 + (cam.x - 160) * d, cy = 90 + (cam.y - 90) * d;
    ctx.translate(160, 90);
    ctx.scale(z, z);
    if (d > 0.9) ctx.rotate(((cam.rot || 0) * Math.PI) / 180);
    ctx.translate(-cx + (cam.shakeX || 0) * d, -cy + (cam.shakeY || 0) * d);
    fn(ctx);
    ctx.restore();
  };
}

// ---- backdrops ---------------------------------------------------------------------
function sky(ctx, top = '#07070b', bottom = PAL.deep) {
  const g = ctx.createLinearGradient(0, -40, 0, 140);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(-200, -200, 720, 580);
}
function paperSky(ctx) {
  const g = ctx.createRadialGradient(160, 80, 10, 160, 90, 260);
  g.addColorStop(0, '#f4efe4'); g.addColorStop(0.5, PAL.frost); g.addColorStop(1, PAL.moon);
  ctx.fillStyle = g; ctx.fillRect(-200, -200, 720, 580);
}
function moon(ctx, x = 236, y = 46, r = 24) {
  const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.4);
  g.addColorStop(0, rgba('#ffffff', 0.35)); g.addColorStop(1, rgba('#ffffff', 0));
  ctx.fillStyle = g; ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  ctx.fillStyle = '#f7f3ea'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba(PAL.frost, 0.55);
  for (const [dx, dy, rr] of [[-7, -5, 4], [6, 6, 3], [-2, 9, 2.4]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, rr, 0, Math.PI * 2); ctx.fill(); }
}
function trees(ctx, y, h, seed, color) {
  const r = rnd(seed);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(-200, y + 20);
  for (let x = -200; x <= 520; x += 4) {
    const th = h * (0.4 + r() * 0.6);
    ctx.lineTo(x, y - th); ctx.lineTo(x + 2, y - th * (0.6 + r() * 0.3)); ctx.lineTo(x + 4, y - th * 0.3);
  }
  ctx.lineTo(520, y + 20); ctx.fill();
}
function icePlane(ctx, horizon = 118) {
  const g = ctx.createLinearGradient(0, horizon, 0, 200);
  g.addColorStop(0, '#c9d6e6'); g.addColorStop(1, '#7d93b2');
  ctx.fillStyle = g; ctx.fillRect(-200, horizon, 720, 300);
  ctx.strokeStyle = rgba('#ffffff', 0.35); ctx.lineWidth = 0.4;
  const r = rnd(7);
  for (let i = 0; i < 26; i++) { const x = -150 + r() * 620, y = horizon + 4 + r() * 70; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10 + r() * 30, y + r() * 2); ctx.stroke(); }
  // the moon's path
  ctx.fillStyle = rgba('#ffffff', 0.18);
  for (let y = horizon + 2; y < horizon + 70; y += 3) { const w = 6 + (y - horizon) * 0.6; ctx.fillRect(236 - w / 2, y, w, 1); }
}

export const BACKDROPS = {
  ink: (layer) => layer(0, (c) => { c.fillStyle = PAL.ink; c.fillRect(-200, -200, 720, 580); }),
  white: (layer) => layer(0, (c) => { c.fillStyle = '#f4f1ea'; c.fillRect(-200, -200, 720, 580); }),
  paper: (layer) => { layer(0, paperSky); layer(0.15, (c) => moon(c, 236, 52, 26)); },
  ice: (layer) => {
    layer(0, paperSky);
    layer(0.1, (c) => moon(c));
    layer(0.3, (c) => trees(c, 118, 16, 3, rgba(PAL.moon, 0.7)));
    layer(0.55, (c) => trees(c, 120, 11, 9, PAL.ink));
    layer(1, (c) => icePlane(c));
  },
  night_ice: (layer) => {
    layer(0, (c) => sky(c, '#05060a', '#1a2338'));
    layer(0.08, (c) => { const r = rnd(4); c.fillStyle = PAL.bone; for (let i = 0; i < 70; i++) c.fillRect(r() * 520 - 100, r() * 100, r() < 0.2 ? 1 : 0.6, r() < 0.2 ? 1 : 0.6); });
    layer(0.1, (c) => moon(c, 230, 40, 20));
    layer(0.35, (c) => trees(c, 116, 18, 5, '#0d1220'));
    layer(1, (c) => { icePlane(c); c.fillStyle = rgba('#0b0a0c', 0.35); c.fillRect(-200, 118, 720, 300); });
  },
  roof: (layer) => {
    layer(0, paperSky);
    layer(0.12, (c) => moon(c, 228, 44, 26));
    layer(0.3, (c) => { c.fillStyle = rgba(PAL.moon, 0.75); const r = rnd(12); for (let x = -120; x < 480; x += 22) { const h = 14 + r() * 26; c.fillRect(x, 140 - h, 18, h + 40); c.fillRect(x + 6, 140 - h - 8, 4, 8); } });
    layer(1, (c) => {
      c.fillStyle = PAL.ink;
      c.beginPath(); c.moveTo(-200, 160); c.lineTo(110, 132); c.lineTo(520, 146); c.lineTo(520, 400); c.lineTo(-200, 400); c.fill();
      c.fillRect(262, 102, 15, 40); c.fillRect(259, 98, 21, 6);
    });
  },
  stage: (layer, t) => {
    layer(0, (c) => { c.fillStyle = PAL.ink; c.fillRect(-200, -200, 720, 580); });
    layer(0.35, (c) => {
      // painted Act Two backcloth: a lake and a paper moon on a wire
      c.fillStyle = '#18213a'; c.fillRect(30, 20, 260, 110);
      c.fillStyle = '#2b3b5e'; c.fillRect(30, 92, 260, 38);
      const sway = Math.sin(t * 0.8) * 2;
      c.strokeStyle = PAL.grey; c.lineWidth = 0.4; c.beginPath(); c.moveTo(160 + sway, 0); c.lineTo(160 + sway, 30); c.stroke();
      c.fillStyle = '#efe9dc'; c.beginPath(); c.arc(160 + sway, 44, 14, 0, Math.PI * 2); c.fill();
    });
    layer(1, (c) => {
      const g = c.createLinearGradient(0, 120, 0, 180);
      g.addColorStop(0, '#2a2023'); g.addColorStop(1, '#0b0a0c');
      c.fillStyle = g; c.fillRect(-100, 128, 520, 120);
      // spotlight
      const s = c.createRadialGradient(160, 150, 4, 160, 140, 90);
      s.addColorStop(0, rgba('#fff5e0', 0.55)); s.addColorStop(1, rgba('#fff5e0', 0));
      c.fillStyle = s; c.beginPath(); c.moveTo(140, -20); c.lineTo(180, -20); c.lineTo(250, 170); c.lineTo(70, 170); c.fill();
    });
    layer(0.95, (c) => {
      for (const side of [0, 1]) for (let i = 0; i < 7; i++) {
        c.fillStyle = i % 2 ? PAL.red : '#6b0b12';
        const x = side ? 320 - 8 - i * 8 + Math.sin(t + i) * 0.6 : i * 8 + Math.sin(t + i) * 0.6;
        c.fillRect(x - (side ? 0 : 10), -40, 9, 260);
      }
    });
  },
  under: (layer, t) => {
    layer(0, (c) => { const g = c.createLinearGradient(0, -30, 0, 200); g.addColorStop(0, '#22324f'); g.addColorStop(1, '#020205'); c.fillStyle = g; c.fillRect(-200, -200, 720, 580); });
    layer(0.5, (c) => {
      for (let i = 0; i < 4; i++) {
        const x = 120 + i * 30 + Math.sin(t * 0.4 + i) * 10;
        c.fillStyle = rgba(PAL.frost, 0.06 + 0.03 * Math.sin(t + i));
        c.beginPath(); c.moveTo(x, -10); c.lineTo(x + 18, -10); c.lineTo(x + 70, 200); c.lineTo(x - 30, 200); c.fill();
      }
    });
    layer(1, (c) => {
      c.fillStyle = rgba('#d8e2ef', 0.9); c.fillRect(-200, -60, 720, 62);
      c.fillStyle = '#05060a'; c.beginPath(); c.ellipse(165, 1, 22, 4, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = rgba('#e8eef6', 0.5); c.beginPath(); c.ellipse(165, 2, 18, 3, 0, 0, Math.PI * 2); c.fill();
    });
  },
  bedroom: (layer) => {
    layer(0, (c) => { c.fillStyle = '#0d0e15'; c.fillRect(-200, -200, 720, 580); });
    layer(0.4, (c) => {
      c.fillStyle = '#1c2640'; c.fillRect(196, 26, 70, 60);
      c.fillStyle = rgba(PAL.frost, 0.7); c.fillRect(200, 30, 29, 25); c.fillRect(233, 30, 29, 25); c.fillRect(200, 58, 29, 25); c.fillRect(233, 58, 29, 25);
      c.fillStyle = rgba(PAL.frost, 0.12); c.beginPath(); c.moveTo(196, 86); c.lineTo(266, 86); c.lineTo(230, 170); c.lineTo(80, 170); c.fill();
    });
    layer(1, (c) => {
      c.fillStyle = '#050508'; c.fillRect(60, 132, 150, 10); c.fillRect(60, 120, 8, 40); c.fillRect(202, 126, 8, 34);
      c.fillStyle = rgba(PAL.frost, 0.35); c.fillRect(68, 126, 134, 7);
    });
  },
  shrine: (layer, t) => {
    layer(0, (c) => { c.fillStyle = '#0a090b'; c.fillRect(-200, -200, 720, 580); });
    layer(1, (c) => {
      // the opened wardrobe, the photographs, the candles
      c.fillStyle = '#1e1511'; c.fillRect(120, 20, 120, 140);
      c.fillStyle = '#0a0706'; c.fillRect(126, 26, 108, 128);
      const r = rnd(31);
      for (let i = 0; i < 34; i++) {
        const x = 130 + (i % 9) * 11 + r() * 2, y = 30 + Math.floor(i / 9) * 15 + r() * 3;
        c.save(); c.translate(x + 4, y + 5); c.rotate((r() - 0.5) * 0.3);
        c.fillStyle = '#d9d0bf'; c.fillRect(-4, -5, 8, 10);
        c.fillStyle = '#1a1716'; c.beginPath(); c.arc(0, -1, 1.6, 0, Math.PI * 2); c.fill(); c.fillRect(-1.5, 0.5, 3, 3);
        if (i % 3) { c.strokeStyle = PAL.red; c.lineWidth = 0.5; c.beginPath(); c.moveTo(-3, -4); c.lineTo(3, 3); c.moveTo(3, -4); c.lineTo(-3, 3); c.stroke(); }
        c.restore();
      }
      for (let i = 0; i < 9; i++) {
        const x = 132 + i * 12, y = 150 - (i % 3) * 2;
        c.fillStyle = '#e8e1d3'; c.fillRect(x, y - 6 + (i % 2) * 2, 2.4, 6);
        const f = 1 + Math.sin(t * 12 + i * 2) * 0.25;
        const g = c.createRadialGradient(x + 1.2, y - 8, 0, x + 1.2, y - 8, 14 * f);
        g.addColorStop(0, rgba(PAL.candle, 0.5)); g.addColorStop(1, rgba(PAL.candle, 0));
        c.fillStyle = g; c.fillRect(x - 14, y - 22, 30, 30);
        c.fillStyle = PAL.candle; c.beginPath(); c.ellipse(x + 1.2, y - 8, 0.9, 1.8 * f, 0, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = '#d9d0bf'; c.fillRect(150, 152, 10, 4); c.fillRect(162, 152, 10, 4); // the pointe shoes
      c.fillStyle = '#100c0b'; c.fillRect(-100, 160, 520, 60);
    });
  },
  window: (layer) => {
    layer(0, (c) => { c.fillStyle = PAL.ink; c.fillRect(-200, -200, 720, 580); });
    layer(0.6, (c) => {
      c.save(); c.beginPath(); c.rect(70, 20, 180, 140); c.clip();
      paperSky(c); moon(c, 220, 50, 16); trees(c, 108, 12, 9, PAL.ink); icePlane(c, 110);
      c.restore();
    });
  },
};

export function windowFrame(ctx) {
  // mask everything outside the glass, so a camera push stays inside the window
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(0, 0, 320, 20); ctx.fillRect(0, 160, 320, 20); ctx.fillRect(0, 0, 70, 180); ctx.fillRect(250, 0, 70, 180);
  ctx.fillStyle = PAL.wood;
  ctx.fillRect(64, 14, 192, 6); ctx.fillRect(64, 160, 192, 8); ctx.fillRect(64, 14, 6, 154); ctx.fillRect(250, 14, 6, 154);
  ctx.fillRect(157, 14, 6, 154); ctx.fillRect(64, 86, 192, 4);
  ctx.fillStyle = rgba(PAL.frost, 0.18); ctx.fillRect(70, 20, 34, 9);
}

// ---- particles ---------------------------------------------------------------------
export function createParticles(spec = {}) {
  const r = rnd(spec.seed || 77);
  const snow = Array.from({ length: spec.snow || 0 }, () => ({ x: r() * 360 - 20, y: r() * 200 - 20, z: 0.4 + r() * 1.2, s: r() * 6 }));
  const bubbles = Array.from({ length: spec.bubbles || 0 }, () => ({ x: 100 + r() * 130, y: 60 + r() * 140, v: 6 + r() * 14, s: r() * 6 }));
  const feathers = Array.from({ length: spec.feathers || 0 }, () => ({ x: r() * 320, y: r() * 200 - 200, v: 4 + r() * 6, rot: r() * 6, s: r() * 6 }));
  const puffs = [];
  const shards = [];
  return {
    spec,
    burst(x, y, n = 18) { for (let i = 0; i < n; i++) shards.push({ x, y, vx: (r() - 0.5) * 140, vy: -r() * 120, life: 1.2 + r() * 0.6, rot: r() * 6, vr: (r() - 0.5) * 12 }); },
    puff(x, y) { puffs.push({ x, y, life: 0, max: 1.6 }); },
    update(dt, t) {
      const wind = spec.wind ?? 12;
      for (const p of snow) { p.y += (10 + p.z * 12) * dt; p.x += (wind * p.z + Math.sin(t * 1.3 + p.s) * 4) * dt; if (p.y > 190) { p.y = -10; p.x = r() * 360 - 20; } if (p.x > 340) p.x -= 360; }
      for (const b of bubbles) { b.y -= b.v * dt; b.x += Math.sin(t * 3 + b.s) * 6 * dt; if (b.y < 4) { b.y = 190; b.x = 100 + r() * 130; } }
      for (const f of feathers) { f.y += f.v * dt; f.x += Math.sin(t + f.s) * 10 * dt; f.rot += dt * Math.sin(t * 0.7 + f.s); if (f.y > 200) { f.y = -10; f.x = r() * 320; } }
      for (const p of puffs) p.life += dt;
      for (let i = puffs.length - 1; i >= 0; i--) if (puffs[i].life > puffs[i].max) puffs.splice(i, 1);
      for (const s of shards) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt; s.rot += s.vr * dt; s.life -= dt; }
      for (let i = shards.length - 1; i >= 0; i--) if (shards[i].life <= 0) shards.splice(i, 1);
    },
    draw(ctx, layer) {
      layer(1, (c) => {
        for (const p of puffs) {
          const k = p.life / p.max;
          c.fillStyle = rgba('#ffffff', 0.35 * (1 - k));
          c.beginPath(); c.arc(p.x + k * 6, p.y - k * 4, 1.2 + k * 5, 0, Math.PI * 2); c.fill();
        }
        for (const s of shards) {
          c.save(); c.translate(s.x, s.y); c.rotate(s.rot);
          c.fillStyle = rgba('#eef3fa', Math.min(1, s.life));
          c.beginPath(); c.moveTo(-2, 0); c.lineTo(0, -1.2); c.lineTo(2.4, 0.4); c.lineTo(0, 1); c.fill();
          c.restore();
        }
        for (const b of bubbles) { c.strokeStyle = rgba(PAL.frost, 0.6); c.lineWidth = 0.4; c.beginPath(); c.arc(b.x, b.y, 0.8 + (b.s % 1.5), 0, Math.PI * 2); c.stroke(); }
        for (const f of feathers) {
          c.save(); c.translate(f.x, f.y); c.rotate(f.rot);
          c.fillStyle = rgba('#f6f2ea', 0.85); c.beginPath(); c.ellipse(0, 0, 3.6, 1, 0, 0, Math.PI * 2); c.fill();
          c.strokeStyle = rgba(PAL.grey, 0.8); c.lineWidth = 0.3; c.beginPath(); c.moveTo(-4, 0); c.lineTo(4, 0); c.stroke();
          c.restore();
        }
      });
      layer(1.25, (c) => {
        for (const p of snow) {
          c.fillStyle = rgba('#ffffff', 0.35 + p.z * 0.35);
          c.beginPath(); c.arc(p.x, p.y, 0.35 + p.z * 0.5, 0, Math.PI * 2); c.fill();
        }
      });
    },
  };
}

// ---- ink-bleed transition, grain, vignette ---------------------------------------------
let noiseField = null, inkCanvas = null, inkImg = null, grainCanvas = null;
function ensureInk() {
  if (noiseField) return;
  const w = 80, h = 45;
  const r = rnd(1234);
  const coarse = Array.from({ length: 12 * 8 }, () => r());
  noiseField = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const gx = (x / w) * 11, gy = (y / h) * 7;
    const ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
    const v = (a, b) => coarse[Math.min(7, b) * 12 + Math.min(11, a)];
    const s = (k) => k * k * (3 - 2 * k);
    const top = v(ix, iy) + (v(ix + 1, iy) - v(ix, iy)) * s(fx);
    const bot = v(ix, iy + 1) + (v(ix + 1, iy + 1) - v(ix, iy + 1)) * s(fx);
    noiseField[y * w + x] = (top + (bot - top) * s(fy)) * 0.8 + r() * 0.2;
  }
  inkCanvas = newCanvas(w, h);
  inkImg = inkCanvas.getContext('2d').createImageData(w, h);
}

// p: 0 = clear, 1 = all ink
export function drawInk(ctx, p) {
  if (p <= 0) return;
  ensureInk();
  const d = inkImg.data;
  for (let i = 0; i < noiseField.length; i++) {
    const a = Math.max(0, Math.min(1, (p * 1.25 - noiseField[i]) / 0.08));
    d[i * 4] = 11; d[i * 4 + 1] = 10; d[i * 4 + 2] = 12; d[i * 4 + 3] = a * 255;
  }
  inkCanvas.getContext('2d').putImageData(inkImg, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(inkCanvas, 0, 0, W, H);
  ctx.restore();
}

export function grainAndVignette(ctx, { grain = 0.14, vignette = 0.7 } = {}) {
  if (vignette > 0) {
    const g = ctx.createRadialGradient(160, 90, 60, 160, 90, 200);
    g.addColorStop(0, rgba(PAL.ink, 0)); g.addColorStop(1, rgba(PAL.ink, vignette));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (grain > 0) {
    if (!grainCanvas) {
      grainCanvas = [0, 1, 2].map(() => {
        const c = newCanvas(640, 360);
        const g2 = c.getContext('2d');
        const im = g2.createImageData(640, 360);
        for (let i = 0; i < 640 * 360; i++) { const v = Math.random() < 0.5 ? 40 : 215; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = Math.random() < 0.3 ? 255 : 0; }
        g2.putImageData(im, 0, 0);
        return c;
      });
    }
    ctx.save();
    ctx.globalAlpha = grain * 0.45;
    ctx.globalCompositeOperation = 'overlay';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(grainCanvas[Math.floor(performance.now() / 60) % 3], 0, 0, W, H);
    ctx.restore();
  }
}

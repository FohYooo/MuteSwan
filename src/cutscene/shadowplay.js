// Shadow-puppet cutscenes: paper-cut silhouettes on moonlit paper, with timed subtitles.
import { Input } from '../core/input.js';
import { Font } from '../gfx/font.js';
import { PAL, rgba } from '../gfx/palette.js';
import { Audio } from '../audio/synth.js';
import { Post } from '../gfx/post.js';
import { modal } from '../ui/common.js';
import { SPEAKER_COLORS } from '../ui/common.js';

const W = 320, H = 180;

// ---- backgrounds ------------------------------------------------------------
export function paper(ctx, { moon = true, tint = PAL.bone } = {}) {
  const g = ctx.createRadialGradient(W / 2, H * 0.45, 20, W / 2, H / 2, 220);
  g.addColorStop(0, tint);
  g.addColorStop(0.55, PAL.frost);
  g.addColorStop(1, PAL.moon);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (moon) {
    ctx.fillStyle = rgba('#ffffff', 0.55);
    ctx.beginPath(); ctx.arc(232, 52, 26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(PAL.moon, 0.35); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(232, 52, 31, 0, Math.PI * 2); ctx.stroke();
  }
}

export const BG = {
  moon: (ctx) => paper(ctx),
  ice: (ctx) => {
    paper(ctx);
    ctx.fillStyle = rgba(PAL.frost, 0.9); ctx.fillRect(0, 118, W, 62);
    ctx.fillStyle = rgba(PAL.moon, 0.5); ctx.fillRect(0, 118, W, 1.5);
    ctx.fillStyle = PAL.ink; // far treeline
    for (let x = 0; x < W; x += 5) { const h = 5 + ((x * 31) % 9); ctx.fillRect(x, 118 - h, 5, h); }
  },
  roof: (ctx) => {
    paper(ctx);
    ctx.fillStyle = PAL.ink;
    ctx.beginPath(); ctx.moveTo(0, 150); ctx.lineTo(120, 128); ctx.lineTo(330, 140); ctx.lineTo(330, 190); ctx.lineTo(0, 190); ctx.fill();
    ctx.fillRect(250, 104, 14, 34); ctx.fillRect(247, 100, 20, 6);
  },
  stage: (ctx) => {
    ctx.fillStyle = PAL.ink; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, 140, 10, W / 2, 120, 140);
    g.addColorStop(0, rgba(PAL.bone, 0.95)); g.addColorStop(0.6, rgba(PAL.frost, 0.5)); g.addColorStop(1, rgba(PAL.ink, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PAL.red;
    for (const side of [0, 1]) {
      for (let i = 0; i < 6; i++) {
        const x = side ? W - 10 - i * 7 : i * 7;
        ctx.globalAlpha = 0.9 - i * 0.1; ctx.fillRect(x, 0, 8, H);
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = rgba('#ffffff', 0.7);
    ctx.beginPath(); ctx.arc(W / 2, 40, 18, 0, Math.PI * 2); ctx.fill();
  },
  under: (ctx, t = 0) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1d2a44'); g.addColorStop(1, '#030308');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rgba(PAL.frost, 0.12); // light from the hole above
    ctx.beginPath(); ctx.moveTo(140, 0); ctx.lineTo(180, 0); ctx.lineTo(230, H); ctx.lineTo(90, H); ctx.fill();
    ctx.fillStyle = rgba(PAL.frost, 0.35);
    for (let i = 0; i < 30; i++) ctx.fillRect((i * 47 + t * 3) % W, (H - ((i * 29 + t * 9) % H)), 1, 1);
    ctx.fillStyle = rgba(PAL.frost, 0.6); ctx.fillRect(0, 0, W, 3);
  },
  ink: (ctx) => { ctx.fillStyle = PAL.ink; ctx.fillRect(0, 0, W, H); },
  white: (ctx) => { ctx.fillStyle = '#f4f1ea'; ctx.fillRect(0, 0, W, H); },
  window: (ctx) => {
    ctx.fillStyle = PAL.ink; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.rect(70, 20, 180, 140); ctx.clip();
    BG.ice(ctx);
    ctx.restore();
    ctx.fillStyle = PAL.wood;
    ctx.fillRect(64, 14, 192, 6); ctx.fillRect(64, 160, 192, 8); ctx.fillRect(64, 14, 6, 154); ctx.fillRect(250, 14, 6, 154); ctx.fillRect(157, 14, 6, 154); ctx.fillRect(64, 86, 192, 4);
    ctx.fillStyle = rgba(PAL.frost, 0.25); ctx.fillRect(70, 20, 30, 8);
  },
};

// ---- silhouettes --------------------------------------------------------------
// Dancer en pointe. pose: stand | arms_up | arabesque | reach | fall | sit | bow
export function dancer(ctx, x, y, s = 1, opts = {}) {
  const { pose = 'stand', color = PAL.ink, alpha = 1, flip = false, tutu = true, bun = true, scarf = false, outlined = false } = opts;
  // pale paper-cuts get a thin dark edge so they read against moonlit paper
  if (color !== PAL.ink && !outlined && alpha > 0.7) {
    for (const [ox, oy] of [[-0.7, 0], [0.7, 0], [0, -0.7], [0, 0.7]]) dancer(ctx, x + ox, y + oy, s, { ...opts, color: PAL.shade, scarf: false, outlined: true, alpha: alpha * 0.8 });
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const limb = (pts, w = 2.2) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke(); };
  if (pose === 'sit') {
    ctx.beginPath(); ctx.arc(0, -30, 5, 0, Math.PI * 2); ctx.fill();
    if (bun) { ctx.beginPath(); ctx.arc(-3, -35, 2.6, 0, Math.PI * 2); ctx.fill(); }
    limb([0, -25, 1, -10], 6); limb([1, -10, 12, -9, 14, 4], 3); limb([0, -22, 8, -14], 2);
    if (scarf) { ctx.fillStyle = PAL.bright; ctx.fillRect(-3, -26, 6, 2); }
    ctx.restore(); return;
  }
  if (pose === 'fall') ctx.rotate(0.9);
  if (pose === 'bow') ctx.rotate(0.15);
  // legs
  if (pose === 'arabesque') { limb([0, -14, 0, 0], 2.2); limb([0, -14, 16, -20], 2.2); }
  else if (pose === 'fall') { limb([0, -14, -4, 0], 2.2); limb([0, -14, 5, -1], 2.2); }
  else { limb([-1, -14, -1, 0], 2.2); limb([1, -14, 2, -1], 2.2); }
  // tutu
  if (tutu) {
    ctx.beginPath(); ctx.ellipse(0, -15, 11, 3, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = -10; i <= 10; i += 4) { ctx.beginPath(); ctx.moveTo(i, -15); ctx.lineTo(i + 1.5, -12); ctx.lineTo(i + 3, -15); ctx.fill(); }
  }
  // torso and neck
  ctx.beginPath(); ctx.moveTo(-3, -15); ctx.lineTo(-2.5, -27); ctx.lineTo(2.5, -27); ctx.lineTo(3, -15); ctx.fill();
  limb([0, -27, 0, -31], 1.6);
  // head
  const hy = pose === 'bow' ? -33 : -34;
  ctx.beginPath(); ctx.arc(pose === 'bow' ? 2 : 0, hy, 3.6, 0, Math.PI * 2); ctx.fill();
  if (bun) { ctx.beginPath(); ctx.arc(-2.5, hy - 3, 2, 0, Math.PI * 2); ctx.fill(); }
  // arms
  if (pose === 'arms_up') { limb([-2, -26, -8, -36, -3, -44]); limb([2, -26, 8, -36, 3, -44]); }
  else if (pose === 'arabesque') { limb([-2, -26, -14, -30]); limb([2, -26, 14, -33]); }
  else if (pose === 'reach') { limb([2, -26, 12, -26, 20, -24]); limb([-2, -26, -8, -18]); }
  else if (pose === 'fall') { limb([-2, -26, -10, -38]); limb([2, -26, 10, -40]); }
  else if (pose === 'bow') { limb([-2, -26, -10, -16]); limb([2, -26, 10, -16]); }
  else { limb([-2, -26, -9, -18, -12, -14]); limb([2, -26, 9, -18, 12, -14]); }
  if (scarf) { ctx.strokeStyle = PAL.bright; limb([-3, -27, 3, -27, 4, -20], 1.6); }
  ctx.restore();
}

// The Prima: tall, a neck too long, arms to the knees.
export function primaShape(ctx, x, y, s = 1, { bend = 0, reach = 0, alpha = 1 } = {}) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000'; ctx.strokeStyle = '#000'; ctx.lineCap = 'round';
  const limb = (pts, w = 1.6) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke(); };
  limb([-1, -22, -1, 0], 1.4); limb([1, -22, 1, 0], 1.4);
  ctx.beginPath(); ctx.ellipse(0, -22, 16, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  for (let i = -15; i <= 15; i += 3) { ctx.beginPath(); ctx.moveTo(i, -22); ctx.lineTo(i + 1, -17); ctx.lineTo(i + 2.5, -22); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(-3, -22); ctx.lineTo(-3, -34); ctx.lineTo(3, -34); ctx.lineTo(3, -22); ctx.fill();
  // neck: a long S
  ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, -34);
  ctx.bezierCurveTo(-8 - bend * 4, -50, 10 + bend * 10, -62, 4 + bend * 22, -72 + bend * 18); ctx.stroke();
  const hx = 4 + bend * 22, hy = -72 + bend * 18;
  ctx.beginPath(); ctx.ellipse(hx, hy, 3.5, 5, bend, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba('#ffffff', 0.85); ctx.beginPath(); ctx.ellipse(hx + 0.6, hy + 0.5, 2.2, 3.4, bend, 0, Math.PI * 2); ctx.fill(); // the mask
  ctx.fillStyle = '#000'; ctx.fillRect(hx - 1.2, hy, 0.9, 1.2); ctx.fillRect(hx + 1.2, hy, 0.9, 1.2);
  ctx.fillStyle = PAL.bright; ctx.fillRect(hx - 1.2, hy + 1.3, 0.6, 2.5);
  // arms, too long
  const r = reach * 18;
  limb([-3, -32, -9 - r * 0.3, -18 - r, -11 - r * 0.6, -4 - r * 1.4]);
  limb([3, -32, 9 + r * 0.3, -18 - r, 11 + r * 0.6, -4 - r * 1.4]);
  ctx.restore();
}

export function crack(ctx, x, y, k, seed = 3, color = PAL.ink) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 0.9;
  for (let b = 0; b < 7; b++) {
    let px = x, py = y;
    const ang = rnd() * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(px, py);
    const n = Math.floor(8 * k);
    for (let i = 0; i < n; i++) { px += Math.cos(ang + (rnd() - 0.5)) * 7; py += Math.sin(ang + (rnd() - 0.5)) * 2.5; ctx.lineTo(px, py); }
    ctx.stroke();
  }
  ctx.restore();
}

export function hole(ctx, x, y, rx = 22, ry = 6) {
  ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

export function swanFlight(ctx, x, y, s, t, color = '#ffffff') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
  const f = Math.sin(t * 6) * 8;
  ctx.beginPath(); ctx.ellipse(0, 0, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-3, 0); ctx.quadraticCurveTo(-8, -10 - f, -20, -6 - f); ctx.lineTo(-4, 1); ctx.fill();
  ctx.beginPath(); ctx.moveTo(2, 0); ctx.quadraticCurveTo(6, -10 - f, 18, -8 - f); ctx.lineTo(4, 1); ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = color; ctx.beginPath(); ctx.moveTo(8, -1); ctx.lineTo(18, -3); ctx.stroke();
  ctx.restore();
}

export const lerp = (a, b, k) => a + (b - a) * Math.max(0, Math.min(1, k));

// ---- engine -------------------------------------------------------------------
// A shot: {dur, bg, cam: [{t, x, y, zoom, rot, shake}], cast: [{id, kind: 'dancer'|'prima', style, keys}],
//          fx: {snow, wind, bubbles, feathers, breath: [ids], shards: [{t, x, y}]}, under(c, t, k), over(c, t, k),
//          frame(ui), lines: [[at, text, speaker]], sfx: [[at, name]], music, post}
// Drawn on the hi-res UI layer so the paper-cuts stay smooth at any size.
import { samplePose, solveRig, drawPuppet, createPhysics, stepPhysics } from './puppet.js';
import { BACKDROPS, makeLayer, createParticles, drawInk, grainAndVignette } from './fx.js';

const DEFAULT_CAM = { x: 160, y: 90, zoom: 1, rot: 0, shake: 0 };

function sampleCam(keys, t) {
  if (!keys || !keys.length) return { ...DEFAULT_CAM };
  const p = samplePose(keys.map((k) => ({ ...DEFAULT_CAM, ...k })), t);
  const sh = p.shake || 0;
  return { ...p, shakeX: sh ? (Math.random() - 0.5) * sh * 4 : 0, shakeY: sh ? (Math.random() - 0.5) * sh * 3 : 0 };
}

export function runPlay(shots, { skippable = true } = {}) {
  let i = -1;
  let t = 0;
  let total = 0;
  let skipHold = 0;
  let ink = 1;
  let leaving = false;
  let scene = null;
  const fired = new Set();
  function begin(n) {
    i = n; t = 0; leaving = false;
    const s = shots[i];
    if (!s) return;
    scene = { phys: {}, parts: createParticles(s.fx || {}), breathT: {} };
    for (const c of s.cast || []) scene.phys[c.id] = createPhysics();
    if (s.music !== undefined) Audio.music(s.music, 1200);
    // settle the physics before the first frame
    for (let k = 0; k < 30; k++) step(1 / 60, 0);
  }
  function step(dt, tt) {
    const s = shots[i];
    for (const c of s.cast || []) {
      if (c.kind === 'prima') continue;
      const pose = samplePose(c.keys, tt);
      stepPhysics(scene.phys[c.id], solveRig(pose), dt, s.fx?.wind ?? 0);
      if (s.fx?.breath?.includes(c.id)) {
        scene.breathT[c.id] = (scene.breathT[c.id] ?? Math.random()) + dt;
        if (scene.breathT[c.id] > 1.5) { scene.breathT[c.id] = 0; const r = solveRig(pose); scene.parts.puff(r.head.x + 3, r.head.y + 1); }
      }
    }
    for (const sh of s.fx?.shards || []) { const k = `${i}:${sh.t}`; if (tt >= sh.t && !fired.has(k)) { fired.add(k); scene.parts.burst(sh.x, sh.y, sh.n || 18); } }
    scene.parts.update(dt, tt);
  }
  begin(0);
  return modal({
    opaque: true,
    update(dt) {
      const s = shots[i];
      if (!s) { this.close(); return; }
      total += dt;
      if (!leaving) t += dt;
      for (const [at, name] of s.sfx || []) { const k = `${i}:${at}:${name}`; if (t >= at && !fired.has(k)) { fired.add(k); Audio.sfx(name); } }
      step(dt, t);
      if (skippable && Input.down('back')) { skipHold += dt; if (skipHold > 0.9) { this.close(); return; } } else skipHold = 0;
      if (!leaving && Input.pressed('ok') && total > 0.3) {
        const later = (s.lines || []).map((l) => l[0]).filter((at) => at > t + 0.05).sort((a, b) => a - b)[0];
        if (later !== undefined) t = later; else leaving = true;
      }
      if (t >= s.dur) leaving = true;
      if (leaving) {
        ink = Math.min(1, ink + dt * (s.cut ? 8 : 2.2));
        if (ink >= 1) { begin(i + 1); if (!shots[i]) this.close(); }
      } else ink = Math.max(0, ink - dt * 2.2);
    },
    draw(ctx, ui) {
      const s = shots[i];
      ctx.fillStyle = PAL.ink; ctx.fillRect(0, 0, W, H);
      if (!s) return;
      const k = Math.min(1, t / s.dur);
      const cam = sampleCam(s.cam, t);
      ui.save();
      const layer = makeLayer(ui, cam);
      (BACKDROPS[s.bg] || BACKDROPS.ink)(layer, t);
      if (s.under) layer(1, (c) => s.under(c, t, k, scene));
      for (const c of s.cast || []) {
        layer(c.depth ?? 1, (g) => {
          const p = samplePose(c.keys, t);
          if (c.kind === 'prima') primaShape(g, p.x, p.y, p.s ?? 1, { bend: p.bend || 0, reach: p.reach || 0, alpha: p.alpha ?? 1 });
          else drawPuppet(g, p, c.style || {}, scene.phys[c.id], t);
        });
      }
      if (s.over) layer(1, (c) => s.over(c, t, k, scene));
      scene.parts.draw(ui, layer);
      ui.restore();
      if (s.frame) s.frame(ui, t, k);
      grainAndVignette(ui, { grain: 0.16, vignette: 0.75, ...(s.post || {}) });
      drawInk(ui, ink);
      // subtitles
      const lines = (s.lines || []).filter((l) => l[0] <= t);
      const cur = lines[lines.length - 1];
      if (cur && ink < 0.6) {
        const [at, text, speaker] = cur;
        const a = Math.min(1, (t - at) / 0.4) * (1 - ink);
        ui.fillStyle = rgba(PAL.ink, 0.5 * a); ui.fillRect(0, 146, 320, 34);
        if (speaker) Font.draw(ui, speaker, 160, 149, { size: 5.5, font: 'title', align: 'center', color: SPEAKER_COLORS[speaker] || PAL.candle, alpha: a, spacing: 0.6 });
        Font.draw(ui, text, 160, speaker ? 157 : 153, { size: 7, italic: !speaker, align: 'center', wrap: 280, color: speaker ? PAL.bone : PAL.frost, alpha: a, lineH: 9 });
      }
      if (skipHold > 0) Font.draw(ui, 'hold X to skip', 312, 4, { size: 4.5, align: 'right', color: PAL.grey, alpha: Math.min(1, skipHold * 2) });
    },
  });
}

// Rigged shadow puppets: a jointed dancer driven by eased pose keyframes, with spring
// tutus and hair and a verlet-chain scarf. The maths here is pure (and tested); drawing
// takes a canvas context.
import { PAL, rgba } from '../gfx/palette.js';

// ---- easing & interpolation -----------------------------------------------------
export const EASE = {
  linear: (k) => k,
  inOut: (k) => 0.5 - Math.cos(Math.PI * k) / 2,
  out: (k) => 1 - (1 - k) ** 3,
  in: (k) => k ** 3,
  outBack: (k) => { const c = 1.7; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; },
};

export function lerpAngle(a, b, k) {
  let d = ((b - a + 540) % 360) - 180;
  if (d === -180 && b > a) d = 180;
  return a + d * k;
}
const lerp = (a, b, k) => a + (b - a) * k;

export const JOINTS = ['torso', 'neck', 'head', 'lArm', 'lFore', 'rArm', 'rFore', 'lThigh', 'lShin', 'rThigh', 'rShin'];
const BODY = { x: 160, y: 140, rot: 0, scale: 1, spin: 0, lift: 0, alpha: 1 };

// Angles in degrees. Limbs hang at 0; positive swings them toward the front (the way she faces).
export const POSES = {
  stand: { torso: 0, neck: 0, head: 0, lArm: 10, lFore: 6, rArm: -10, rFore: -6, lThigh: 3, lShin: 0, rThigh: -3, rShin: 0 },
  first: { torso: 0, neck: 0, head: 6, lArm: 22, lFore: 38, rArm: -22, rFore: -38, lThigh: 2, lShin: 0, rThigh: -2, rShin: 0 },
  arms_up: { torso: -3, neck: -6, head: -8, lArm: 150, lFore: 62, rArm: -150, rFore: -62, lThigh: 2, lShin: 0, rThigh: -2, rShin: 0 },
  arms_open: { torso: 0, neck: 0, head: 0, lArm: 88, lFore: 12, rArm: -88, rFore: -12, lThigh: 3, lShin: 0, rThigh: -3, rShin: 0 },
  arabesque: { torso: 18, neck: -8, head: -10, lArm: 112, lFore: 4, rArm: -70, rFore: -4, lThigh: 0, lShin: 0, rThigh: -98, rShin: -4 },
  attitude: { torso: 8, neck: -4, head: -8, lArm: 150, lFore: 30, rArm: -80, rFore: -10, lThigh: 0, lShin: 0, rThigh: -80, rShin: -70 },
  passe: { torso: 0, neck: 0, head: -4, lArm: 160, lFore: 30, rArm: -160, rFore: -30, lThigh: 0, lShin: 0, rThigh: 70, rShin: -130 },
  plie: { torso: 0, neck: 0, head: 0, lArm: 70, lFore: 20, rArm: -70, rFore: -20, lThigh: 30, lShin: -55, rThigh: -30, rShin: 55 },
  reach: { torso: 10, neck: 0, head: -6, lArm: 95, lFore: 4, rArm: -30, rFore: -10, lThigh: 18, lShin: 0, rThigh: -14, rShin: 0 },
  reach_low: { torso: 40, neck: -10, head: -20, lArm: 60, lFore: 4, rArm: 20, rFore: 0, lThigh: 30, lShin: -40, rThigh: -20, rShin: 10 },
  bow: { torso: 45, neck: 20, head: 15, lArm: 30, lFore: 30, rArm: 0, rFore: 20, lThigh: 0, lShin: 0, rThigh: -10, rShin: 0 },
  kneel: { torso: 6, neck: 10, head: 10, lArm: 30, lFore: 40, rArm: 10, rFore: 30, lThigh: 90, lShin: -90, rThigh: 0, rShin: -95 },
  kneel_pray: { torso: 14, neck: 24, head: 16, lArm: 70, lFore: 100, rArm: 60, rFore: 110, lThigh: 90, lShin: -90, rThigh: 0, rShin: -95 },
  sit: { torso: -4, neck: 0, head: 4, lArm: 30, lFore: 20, rArm: 10, rFore: 30, lThigh: 90, lShin: -95, rThigh: 84, rShin: -88 },
  sit_lean: { torso: 16, neck: 14, head: 12, lArm: 50, lFore: 30, rArm: 20, rFore: 40, lThigh: 90, lShin: -95, rThigh: 84, rShin: -88 },
  embrace: { torso: 6, neck: 10, head: 14, lArm: 84, lFore: 70, rArm: 70, rFore: 80, lThigh: 4, lShin: 0, rThigh: -4, rShin: 0 },
  grief: { torso: 22, neck: 26, head: 20, lArm: 120, lFore: 120, rArm: 110, rFore: 130, lThigh: 10, lShin: -10, rThigh: -8, rShin: 6 },
  fall: { torso: -10, neck: -20, head: -20, lArm: 170, lFore: 10, rArm: -140, rFore: -30, lThigh: 20, lShin: -30, rThigh: -40, rShin: 20 },
  float: { torso: -6, neck: -14, head: -10, lArm: 140, lFore: 20, rArm: -120, rFore: -30, lThigh: 14, lShin: -30, rThigh: -18, rShin: 24 },
  curl: { torso: 30, neck: 30, head: 20, lArm: 80, lFore: 120, rArm: 60, rFore: 130, lThigh: 110, lShin: -140, rThigh: 100, rShin: -130 },
  lie: { torso: 0, neck: 0, head: 6, lArm: 6, lFore: 10, rArm: -4, rFore: 0, lThigh: 2, lShin: 4, rThigh: -2, rShin: 2 },
  watch: { torso: 10, neck: 18, head: 18, lArm: 40, lFore: 70, rArm: 20, rFore: 60, lThigh: 90, lShin: -95, rThigh: 84, rShin: -88 },
  smoke: { torso: -4, neck: -6, head: -10, lArm: 110, lFore: 130, rArm: 10, rFore: 30, lThigh: 90, lShin: -95, rThigh: 84, rShin: -88 },
};

// keys: [{t, pose: name | object, ease, ...overrides}]
export function samplePose(keys, t) {
  const full = (k) => ({ ...BODY, ...(typeof k.pose === 'string' ? POSES[k.pose] : k.pose || {}), ...strip(k) });
  if (t <= keys[0].t) return full(keys[0]);
  const last = keys[keys.length - 1];
  if (t >= last.t) return full(last);
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
  const a = full(keys[i]), b = full(keys[i + 1]);
  const k = (EASE[keys[i + 1].ease || 'inOut'] || EASE.inOut)((t - keys[i].t) / (keys[i + 1].t - keys[i].t));
  const out = {};
  for (const key of Object.keys(a)) {
    if (typeof a[key] !== 'number') { out[key] = k < 0.5 ? a[key] : b[key]; continue; }
    out[key] = JOINTS.includes(key) || key === 'rot' ? lerpAngle(a[key], b[key] ?? a[key], k) : lerp(a[key], b[key] ?? a[key], k);
  }
  return out;
}
function strip(k) { const { t, pose, ease, ...rest } = k; return rest; }

// ---- physics ---------------------------------------------------------------------
export function createSpring(stiffness = 80, damping = 9, value = 0) {
  return {
    value, vel: 0,
    step(target, dt) {
      this.vel += (stiffness * (target - this.value) - damping * this.vel) * dt;
      this.value += this.vel * dt;
      return this.value;
    },
  };
}

export function createChain(n, seg, anchor) {
  const points = Array.from({ length: n }, (_, i) => ({ x: anchor.x, y: anchor.y + i * seg, px: anchor.x, py: anchor.y + i * seg }));
  return {
    points,
    step(a, dt, { gravity = 260, wind = 0, drag = 0.985 } = {}) {
      points[0].x = a.x; points[0].y = a.y; points[0].px = a.x; points[0].py = a.y;
      for (let i = 1; i < n; i++) {
        const p = points[i];
        const vx = (p.x - p.px) * drag, vy = (p.y - p.py) * drag;
        p.px = p.x; p.py = p.y;
        p.x += vx + wind * dt * dt * (0.6 + 0.4 * Math.sin(i * 1.7));
        p.y += vy + gravity * dt * dt;
      }
      for (let it = 0; it < 8; it++) {
        for (let i = 1; i < n; i++) {
          const a0 = points[i - 1], b0 = points[i];
          const dx = b0.x - a0.x, dy = b0.y - a0.y;
          const d = Math.hypot(dx, dy) || 1e-6;
          const diff = (d - seg) / d;
          if (i === 1) { b0.x -= dx * diff; b0.y -= dy * diff; } else {
            a0.x += dx * diff * 0.5; a0.y += dy * diff * 0.5;
            b0.x -= dx * diff * 0.5; b0.y -= dy * diff * 0.5;
          }
        }
        points[0].x = a.x; points[0].y = a.y;
      }
    },
  };
}

// ---- the rig ------------------------------------------------------------------------
const SEG = { thigh: 9, shin: 8, foot: 2.6, torso: 12.5, neck: 3.2, head: 3.7, upper: 7.8, fore: 7, shoulder: 2.4, hip: 1.5 };
const vec = (deg) => { const r = (deg * Math.PI) / 180; return { x: Math.sin(r), y: -Math.cos(r) }; };
const add = (p, v, len) => ({ x: p.x + v.x * len, y: p.y + v.y * len });

// Positions of every joint; (x, y) is the floor under her. Grounded unless lifted.
export function solveRig(p) {
  const s = p.scale ?? 1;
  const R = p.rot || 0;
  const hip0 = { x: 0, y: -(SEG.thigh + SEG.shin + SEG.foot) * s };
  const T = R + p.torso;
  const shoulder = add(hip0, vec(T), SEG.torso * s);
  const N = T + p.neck;
  const neckTop = add(shoulder, vec(N), SEG.neck * s);
  const head = add(neckTop, vec(N + p.head), SEG.head * s * 0.9);
  const perp = vec(T + 90);
  const lSh = add(shoulder, perp, -SEG.shoulder * s), rSh = add(shoulder, perp, SEG.shoulder * s);
  // limbs hang at 180; "toward the front" is negative rotation for a figure facing right
  const lUA = T + 180 - p.lArm, rUA = T + 180 - p.rArm;
  const lElbow = add(lSh, vec(lUA), SEG.upper * s), rElbow = add(rSh, vec(rUA), SEG.upper * s);
  const lHand = add(lElbow, vec(lUA - p.lFore), SEG.fore * s), rHand = add(rElbow, vec(rUA - p.rFore), SEG.fore * s);
  const hperp = vec(R + 90);
  const lHip = add(hip0, hperp, -SEG.hip * s), rHip = add(hip0, hperp, SEG.hip * s);
  const lTA = R + 180 - p.lThigh, rTA = R + 180 - p.rThigh;
  const lKnee = add(lHip, vec(lTA), SEG.thigh * s), rKnee = add(rHip, vec(rTA), SEG.thigh * s);
  const lAnkle = add(lKnee, vec(lTA - p.lShin), SEG.shin * s), rAnkle = add(rKnee, vec(rTA - p.rShin), SEG.shin * s);
  const lFoot = add(lAnkle, vec(lTA - p.lShin), SEG.foot * s), rFoot = add(rAnkle, vec(rTA - p.rShin), SEG.foot * s);
  const pts = { hip: hip0, shoulder, neckTop, head, lSh, rSh, lElbow, rElbow, lHand, rHand, lHip, rHip, lKnee, rKnee, lAnkle, rAnkle, lFoot, rFoot };
  // ground: lowest point of the legs touches the floor, unless the body is rotated past 45° (lying, falling, floating)
  const lowest = Math.max(lFoot.y, rFoot.y, lKnee.y, rKnee.y, lAnkle.y, rAnkle.y);
  const dy = Math.abs(R) > 45 ? 0 : -lowest;
  const out = { T, N, s };
  for (const [k, v] of Object.entries(pts)) out[k] = { x: p.x + v.x, y: p.y + v.y + dy - (p.lift || 0) };
  return out;
}

// ---- drawing ------------------------------------------------------------------------
function limb(ctx, a, b, w0, w1) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1e-6;
  const nx = -dy / d, ny = dx / d;
  ctx.beginPath();
  ctx.moveTo(a.x + nx * w0, a.y + ny * w0);
  ctx.lineTo(b.x + nx * w1, b.y + ny * w1);
  ctx.lineTo(b.x - nx * w1, b.y - ny * w1);
  ctx.lineTo(a.x - nx * w0, a.y - ny * w0);
  ctx.fill();
  ctx.beginPath(); ctx.arc(a.x, a.y, w0, 0, Math.PI * 2); ctx.arc(b.x, b.y, w1, 0, Math.PI * 2); ctx.fill();
}

// Physics state for one puppet across frames.
export function createPhysics() {
  return { tutu: createSpring(70, 6), hairX: createSpring(50, 5), hairY: createSpring(50, 5), scarf: null, last: null };
}

export function stepPhysics(phys, rig, dt, wind = 0) {
  if (!dt) return;
  const hip = rig.hip;
  if (phys.last) {
    const vx = (hip.x - phys.last.x) / dt, vy = (hip.y - phys.last.y) / dt;
    phys.tutu.vel += Math.min(60, Math.abs(vx) * 0.04 + Math.abs(vy) * 0.05);
    phys.hairX.step(-vx * 0.03 + wind * 0.002, dt);
    phys.hairY.step(-vy * 0.02, dt);
  }
  phys.tutu.step(0, dt);
  phys.last = { x: hip.x, y: hip.y };
  const anchor = { x: rig.neckTop.x * 0.6 + rig.shoulder.x * 0.4, y: rig.neckTop.y * 0.6 + rig.shoulder.y * 0.4 };
  if (!phys.scarf) phys.scarf = createChain(6, 2.2 * rig.s, anchor);
  phys.scarf.step(anchor, dt, { gravity: 160, wind: 220 + wind * 3 });
}

// style: {color, alpha, tutu, bun, hair: 'bob', scarf, ghost}
export function drawPuppet(ctx, pose, style = {}, phys = null, t = 0) {
  // pale paper-cuts get a dark edge so they read against moonlit paper
  if (!style._edge && (style.ghost || (style.color && style.color !== PAL.ink))) {
    for (const [ox, oy] of [[-0.45, 0], [0.45, 0], [0, -0.45], [0, 0.45]]) {
      drawPuppet(ctx, { ...pose, x: pose.x + ox, y: pose.y + oy }, { ...style, _edge: true, ghost: false, color: style.ghost ? '#26314a' : PAL.shade, alpha: (style.alpha ?? 1) * (style.ghost ? 0.35 : 0.8), scarf: false }, null, t);
    }
  }
  const r = solveRig(pose);
  const s = r.s;
  const color = style.ghost ? PAL.frost : style.color || PAL.ink;
  const alpha = (style.alpha ?? 1) * (pose.alpha ?? 1) * (style.ghost ? 0.55 + Math.sin(t * 7) * 0.08 : 1);
  ctx.save();
  // pirouette: squash horizontally through the turn; spin 0.5 = facing the other way
  const sx = Math.cos((pose.spin || 0) * Math.PI * 2);
  ctx.translate(r.hip.x, 0);
  ctx.scale(Math.sign(sx || 1) * Math.max(0.12, Math.abs(sx)), 1);
  ctx.translate(-r.hip.x, 0);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  if (style.ghost) { ctx.shadowColor = rgba(PAL.frost, 0.8); ctx.shadowBlur = 4; }
  const w = (v) => v * s;
  // far side first
  limb(ctx, r.lHip, r.lKnee, w(1.5), w(1.1)); limb(ctx, r.lKnee, r.lAnkle, w(1.1), w(0.7)); limb(ctx, r.lAnkle, r.lFoot, w(0.7), w(0.35));
  limb(ctx, r.lSh, r.lElbow, w(0.95), w(0.75)); limb(ctx, r.lElbow, r.lHand, w(0.75), w(0.45));
  // torso: narrow waist, wider ribs
  const perp = vec(r.T + 90);
  ctx.beginPath();
  ctx.moveTo(r.hip.x - perp.x * w(2.2), r.hip.y - perp.y * w(2.2));
  ctx.lineTo(r.shoulder.x - perp.x * w(2.9), r.shoulder.y - perp.y * w(2.9));
  ctx.lineTo(r.shoulder.x + perp.x * w(2.9), r.shoulder.y + perp.y * w(2.9));
  ctx.lineTo(r.hip.x + perp.x * w(2.2), r.hip.y + perp.y * w(2.2));
  ctx.fill();
  limb(ctx, r.shoulder, r.neckTop, w(0.9), w(0.8));
  // tutu: a disc of feathers that flutters
  if (style.tutu !== false) {
    const fl = phys ? phys.tutu.value : 0;
    const rad = w(11) * (1 + Math.max(-0.2, Math.min(0.35, fl * 0.02)));
    const ang = ((r.T - (pose.rot || 0)) * Math.PI) / 180 + ((pose.rot || 0) * Math.PI) / 180;
    ctx.save();
    ctx.translate(r.hip.x, r.hip.y - w(1));
    ctx.rotate(ang);
    ctx.beginPath(); ctx.ellipse(0, 0, rad, w(2.6), 0, 0, Math.PI * 2); ctx.fill();
    for (let i = -10; i <= 10; i++) {
      const x = (i / 10) * rad;
      const wave = Math.sin(t * 9 + i * 1.3) * fl * 0.04;
      ctx.beginPath(); ctx.moveTo(x - w(1), w(1.6)); ctx.lineTo(x + w(0.3), w(3.4) + wave * w(2) + (i % 2) * w(0.6)); ctx.lineTo(x + w(1.2), w(1.6)); ctx.fill();
    }
    ctx.restore();
  }
  // near side
  limb(ctx, r.rHip, r.rKnee, w(1.5), w(1.1)); limb(ctx, r.rKnee, r.rAnkle, w(1.1), w(0.7)); limb(ctx, r.rAnkle, r.rFoot, w(0.7), w(0.35));
  // head, bun, hair
  ctx.beginPath(); ctx.ellipse(r.head.x, r.head.y, w(3.1), w(3.6), (r.N * Math.PI) / 180, 0, Math.PI * 2); ctx.fill();
  if (style.bun !== false && style.hair !== 'bob') {
    const b = add(r.head, vec(r.N - 140), w(3.4));
    ctx.beginPath(); ctx.arc(b.x, b.y, w(2), 0, Math.PI * 2); ctx.fill();
  }
  if (style.hair === 'bob') {
    const hx = phys ? phys.hairX.value : 0, hy = phys ? phys.hairY.value : 0;
    ctx.beginPath();
    ctx.ellipse(r.head.x - w(0.4), r.head.y - w(0.8), w(3.8), w(3.4), (r.N * Math.PI) / 180, 0, Math.PI * 2);
    ctx.fill();
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(r.head.x + w(i * 2.2), r.head.y);
      ctx.quadraticCurveTo(r.head.x + w(i * 2.6 + hx * 0.6), r.head.y + w(3.6), r.head.x + w(i * 2.4 + hx), r.head.y + w(4.6 + hy * 0.3));
      ctx.lineTo(r.head.x + w(i * 2.2 + 1), r.head.y);
      ctx.fill();
    }
  }
  limb(ctx, r.rSh, r.rElbow, w(0.95), w(0.75)); limb(ctx, r.rElbow, r.rHand, w(0.75), w(0.45));
  ctx.shadowBlur = 0;
  // the red scarf, alive in the wind
  if (style.scarf && phys?.scarf) {
    const pts = phys.scarf.points;
    ctx.strokeStyle = PAL.bright; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 1; i < pts.length; i++) {
      ctx.lineWidth = w(1.6 - (i / pts.length) * 0.9);
      ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
    }
    ctx.fillStyle = PAL.bright;
    ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, w(1.4), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  return r;
}

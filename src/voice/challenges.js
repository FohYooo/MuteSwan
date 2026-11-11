// FREEZE / HUSH / NOOO / RUN-for-her screens. They feed mic frames, recognized words
// and keys into the pure challenge core, and paint the moment.
import { createChallenge } from './challenge-core.js';
import { Voice } from './mic.js';
import { Input } from '../core/input.js';
import { Scenes } from '../core/scenes.js';
import { Font } from '../gfx/font.js';
import { PAL, rgba } from '../gfx/palette.js';
import { Audio } from '../audio/synth.js';
import { Store } from '../story/state.js';

const DEFAULT_TH = { shoutDb: -20, quietDb: -50 };

// Distance makes the voice "fade": yells must be louder.
export function adjustThresholds(th, shoutShift = 0) { return { ...th, shoutDb: th.shoutDb + shoutShift }; }

// Peak loudness / time of the last finished challenge (the Ledger compares them).
export let lastStats = null;
let paused = () => false;
export function setPauseSource(fn) { paused = fn; }

const COPY = {
  freeze: { title: 'RUN', sub: 'Her body will not move. Say it for her.', mic: 'YELL  “RUN!”  THREE TIMES', keys: 'TYPE   R  U  N   THREE TIMES' },
  runfor: { title: 'RUN', sub: 'Say it for her. The way she said it for you.', mic: 'YELL  “RUN!”  THREE TIMES', keys: 'TYPE   R  U  N   THREE TIMES' },
  hush: { title: 'hush', sub: 'Do not make a sound.', mic: 'stay completely silent', keys: 'hold SPACE to hold your breath — let go when she is gone' },
  noo: { title: 'NO', sub: 'Do not let her go under.', mic: 'SCREAM  “NOOOOOO”  AND DO NOT STOP', keys: 'hold N and keep tapping O' },
};

function scrawl(ui, text, x, y, a, size = 16) {
  ui.save();
  ui.translate(x, y);
  ui.rotate(-0.08 + (x % 7) * 0.02);
  Font.draw(ui, text, 0, 0, { font: 'hand', size, color: PAL.bright, alpha: a, shadow: true, align: 'center' });
  ui.restore();
}

function play(kind, { windowMs, world = null, onTick = null, crackAt = 0, fx = null, shoutShift = 0 } = {}) {
  const settings = Store().loadSettings();
  const keys = settings.keyboardMode || Voice.status.mic !== 'ok';
  const thresholds = adjustThresholds(settings.calib || DEFAULT_TH, shoutShift);
  let peakDb = -100;
  const core = createChallenge({
    kind, windowMs, thresholds, mode: settings.voiceCheck, wordsAvailable: Voice.status.words === 'ok', input: keys ? 'keys' : 'mic',
  });
  const words = [];
  let level = -100;
  let lastMarks = 0;
  let endT = 0;
  let t = 0;
  let crackT = 0; // prologue: the third RUN cracks and nothing comes out
  const savedFx = world ? { ...world.fx } : null;
  if (world && fx) Object.assign(world.fx, fx);
  const offF = Voice.onFrame((f) => { level = f.db; if (!paused()) { core.frame(f); peakDb = Math.max(peakDb, f.db); } });
  const offW = Voice.onWord((w) => {
    if (paused()) return;
    core.word(w.word);
    if ((kind === 'noo' && w.word === 'no') || (kind !== 'noo' && kind !== 'hush' && w.word === 'run')) {
      words.push({ text: w.word === 'no' ? 'NO' : 'RUN', x: 60 + Math.random() * 200, y: 70 + Math.random() * 40, t: 0 });
    }
  });
  Audio.duck(true, kind === 'hush' ? 0 : 0.15);
  if (kind !== 'hush') Audio.heartbeat(kind === 'noo' ? 120 : 140);

  return new Promise((resolve) => {
    const scene = {
      modal: true,
      update(dt) {
        if (paused()) return;
        t += dt;
        const st = core.state();
        if (!st.result) {
          for (const ch of Input.typed) core.key(ch);
          if (Input.keyPressed('Space')) core.key('space-down');
          if (Input.keyReleased('Space')) core.key('space-up');
          if (Input.keyPressed('KeyN')) core.key('N-down');
          if (Input.keyReleased('KeyN')) core.key('N-up');
          if (Input.keyPressed('KeyO')) core.key('O');
          core.tick(dt * 1000);
        }
        const s2 = core.state();
        if (crackAt) {
          if (!crackT && (s2.marks >= crackAt || s2.timeLeft < s2.windowMs * 0.3)) { crackT = t; Audio.sfx('ice_crack'); }
          if (crackT && t - crackT > 2.4) { finish(false); return; }
          if (crackT) { if (world) world.fx.shake = 0.6; return; }
        }
        if (s2.marks > lastMarks) {
          Audio.sfx('scream_mark');
          if (keys) words.push({ text: 'RUN', x: 70 + lastMarks * 90, y: 80, t: 0 });
          lastMarks = s2.marks;
        }
        for (const w of words) w.t += dt;
        if (world) {
          const p = s2.timeLeft / s2.windowMs;
          if (kind === 'freeze' || kind === 'runfor') { world.fx.desaturate = Math.min(1, 0.4 + (1 - p) * 0.8); world.fx.vignette = 0.9; world.fx.shake = s2.result ? 0 : 0.15 + (1 - p) * 0.3; world.fx.redPulse = 0.15 + Math.max(0, Math.sin(t * 9)) * 0.25; }
          if (kind === 'noo') { world.fx.redPulse = s2.screaming ? 0.35 : 0.1; world.fx.shake = s2.screaming ? 0.5 : 0.1; }
        }
        onTick?.(s2, dt);
        if (s2.result) {
          if (!endT) { endT = t; if (s2.result === 'lose') Audio.sfx('fail'); }
          if (t - endT > 0.7) finish(s2.result === 'win');
        }
      },
      draw(ctx, ui) {
        const st = core.state();
        const c = COPY[kind];
        const pulse = 0.6 + Math.sin(t * 8) * 0.4;
        if (kind === 'hush') {
          // inside the wardrobe: darkness with a slit of light
          ui.fillStyle = PAL.ink;
          ui.fillRect(0, 0, 148, 180); ui.fillRect(172, 0, 148, 180);
          ui.fillStyle = rgba(PAL.ink, 0.55); ui.fillRect(148, 0, 24, 180);
          Font.draw(ui, c.sub, 74, 60, { size: 7, italic: true, align: 'center', color: PAL.frost, wrap: 120 });
          Font.draw(ui, keys ? c.keys : c.mic, 246, 60, { size: 6, align: 'center', color: PAL.grey, wrap: 120 });
          ui.fillStyle = rgba(PAL.bone, 0.15); ui.fillRect(40, 130, 240, 4);
          ui.fillStyle = st.progress > 0.6 ? PAL.bright : PAL.moon; ui.fillRect(40, 130, 240 * st.progress, 4);
          Font.draw(ui, 'noise', 40, 136, { size: 5, color: PAL.grey, shadow: false });
          if (keys) {
            ui.fillStyle = rgba(PAL.frost, 0.2); ui.fillRect(40, 146, 240, 2);
            ui.fillStyle = st.holding ? PAL.frost : PAL.grey; ui.fillRect(40, 146, 240 * st.breath, 2);
            Font.draw(ui, st.holding ? 'holding your breath' : 'breathing', 40, 150, { size: 5, color: PAL.grey, shadow: false });
          }
          return;
        }
        if (kind === 'noo') {
          // the water rises as time runs out
          const p = 1 - st.timeLeft / st.windowMs;
          const wy = 180 - p * 120;
          const g = ui.createLinearGradient(0, wy, 0, 180);
          g.addColorStop(0, rgba(PAL.deep, 0.0)); g.addColorStop(0.15, rgba(PAL.deep, 0.55)); g.addColorStop(1, rgba(PAL.ink, 0.85));
          ui.fillStyle = g; ui.fillRect(0, wy, 320, 180 - wy);
          Font.draw(ui, 'N' + 'O'.repeat(1 + Math.floor(st.progress * 9)), 160, 22, { size: 22 + st.progress * 8, font: 'title', align: 'center', color: PAL.bright, alpha: st.screaming ? 1 : 0.55 });
          Font.draw(ui, c.sub, 160, 56, { size: 7, italic: true, align: 'center', color: PAL.frost });
          ui.fillStyle = rgba(PAL.bone, 0.15); ui.fillRect(30, 150, 260, 7);
          ui.fillStyle = rgba(PAL.bright, 0.35); ui.fillRect(30, 150, 260 * Math.min(1, st.progress + st.pending), 7);
          ui.fillStyle = PAL.bright; ui.fillRect(30, 150, 260 * st.progress, 7);
          Font.draw(ui, keys ? c.keys : c.mic, 160, 160, { size: 6, align: 'center', color: PAL.bone, alpha: pulse });
        } else {
          // FREEZE and RUN-for-her
          ui.fillStyle = rgba(PAL.ink, 0.25); ui.fillRect(0, 0, 320, 180);
          Font.draw(ui, c.sub, 160, 22, { size: 7, italic: true, align: 'center', color: PAL.frost });
          for (let i = 0; i < 3; i++) {
            const x = 70 + i * 90, y = 92;
            ui.strokeStyle = rgba(PAL.bone, 0.5); ui.lineWidth = 0.6;
            ui.strokeRect(x - 30, y - 16, 60, 32);
            if (i < st.marks) scrawl(ui, 'RUN', x, y - 12, 1, 20);
            if (crackT && i === crackAt) {
              ui.strokeStyle = PAL.bright; ui.lineWidth = 0.8; ui.beginPath();
              const k = Math.min(1, (t - crackT) * 2);
              ui.moveTo(x - 30, y - 4); ui.lineTo(x - 30 + 20 * k, y + 3); ui.lineTo(x - 30 + 38 * k, y - 8); ui.lineTo(x - 30 + 60 * k, y + 6); ui.stroke();
            }
          }
          if (crackT) Font.draw(ui, 'No sound came out.', 160, 118, { size: 8, italic: true, align: 'center', color: PAL.bone, alpha: Math.min(1, (t - crackT) * 1.5) });
          Font.draw(ui, keys ? c.keys : c.mic, 160, 138, { size: 7.5, font: 'title', align: 'center', color: PAL.bright, alpha: pulse, spacing: 1 });
          if (!keys) Font.draw(ui, '(or type R U N)', 160, 158, { size: 5, align: 'center', color: PAL.grey, shadow: false });
          ui.fillStyle = PAL.bright;
          ui.fillRect(160 - 120 * (st.timeLeft / st.windowMs), 152, 240 * (st.timeLeft / st.windowMs), 1.2);
        }
        if (!keys) {
          // live level meter so the player sees the game hearing them
          const lv = Math.max(0, Math.min(1, (level + 80) / 80));
          ui.fillStyle = rgba(PAL.bone, 0.12); ui.fillRect(4, 40, 3, 100);
          ui.fillStyle = PAL.candle; ui.fillRect(4, 140 - lv * 100, 3, lv * 100);
        }
        for (const w of words) if (w.t < 1.4) scrawl(ui, w.text, w.x, w.y, 1 - w.t / 1.4, 14);
      },
    };
    function finish(won) {
      lastStats = { kind, won, input: keys ? 'keys' : 'mic', peakDb, timeMs: core.clock() };
      offF(); offW();
      Audio.duck(false);
      Audio.heartbeat(0);
      if (world && savedFx) Object.assign(world.fx, savedFx);
      Scenes.pop(scene);
      resolve(won);
    }
    Scenes.push(scene);
  });
}

export const freeze = (o = {}) => play('freeze', { windowMs: 5000, ...o });
export const hush = (o = {}) => play('hush', { windowMs: 8000, ...o });
export const noo = (o = {}) => play('noo', { windowMs: 14000, ...o });
export const runFor = (o = {}) => play('runfor', { windowMs: 6000, ...o });
export const challenge = (kind, o = {}) => ({ freeze, hush, noo, runfor: runFor }[kind])(o);

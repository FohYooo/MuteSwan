import { startLoop } from './core/loop.js';
import { Input } from './core/input.js';
import { Scenes } from './core/scenes.js';
import { PAL } from './gfx/palette.js';
import { Audio } from './audio/synth.js';
import { Voice } from './voice/mic.js';
import { Font } from './gfx/font.js';
import { buildSprites } from './gfx/sprites.js';
import { createWorld } from './world/world-scene.js';
import * as UI from './ui/index.js';
import { Store } from './story/state.js';
import { challenge, setPauseSource } from './voice/challenges.js';
import { shadowplay } from './cutscene/plays.js';
import { wrongEnd } from './ui/wrongend.js';
import { ending } from './ui/ending.js';
import { createRunner } from './story/runner.js';

export const G = {
  W: 320,
  H: 180,
  canvas: document.getElementById('screen'),
  ctx: null,
  params: new URLSearchParams(location.search),
  paused: false,
  time: 0,
};
G.ctx = G.canvas.getContext('2d');
G.ctx.imageSmoothingEnabled = false;
G.uiCanvas = document.getElementById('ui');
G.ui = G.uiCanvas.getContext('2d');
G.muted = G.params.get('mute') === '1';
G.debug = G.params.get('debug') === '1';

function fit() {
  const s = Math.max(1, Math.floor(Math.min(innerWidth / G.W, innerHeight / G.H)));
  G.canvas.style.width = `${G.W * s}px`;
  G.canvas.style.height = `${G.H * s}px`;
  G.scale = s;
  const dpr = devicePixelRatio || 1;
  G.uiCanvas.width = G.W * s * dpr;
  G.uiCanvas.height = G.H * s * dpr;
  G.uiCanvas.style.width = `${G.W * s}px`;
  G.uiCanvas.style.height = `${G.H * s}px`;
  G.uiScale = s * dpr;
}
addEventListener('resize', fit);
fit();

addEventListener('blur', () => { G.paused = true; Input.clear(); });
addEventListener('focus', () => { G.paused = false; });

Input.attach(window);
setPauseSource(() => G.paused);
Audio.init({ muted: G.muted });

function update(dt, manual = false) {
  if (G.manual && !manual) return; // debug: MS.step owns time
  if (G.paused) { Input.endFrame(); return; }
  G.time += dt;
  Scenes.update(dt);
  Input.endFrame();
}

function draw() {
  const ctx = G.ctx;
  const ui = G.ui;
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(0, 0, G.W, G.H);
  ui.setTransform(1, 0, 0, 1, 0, 0);
  ui.clearRect(0, 0, G.uiCanvas.width, G.uiCanvas.height);
  ui.setTransform(G.uiScale, 0, 0, G.uiScale, 0, 0);
  ui.imageSmoothingEnabled = false;
  Scenes.draw(ctx, ui);
  if (G.paused) {
    ui.fillStyle = 'rgba(11,10,12,0.7)';
    ui.fillRect(0, 0, G.W, G.H);
    Font.draw(ui, 'paused', G.W / 2, G.H / 2, { align: 'center', size: 10, color: PAL.frost });
  }
}

if (G.debug) {
  const key = (code, type) => window.dispatchEvent(new KeyboardEvent(type, { code, key: code.startsWith('Key') ? code.slice(3).toLowerCase() : code }));
  window.MS = {
    G, Scenes, Input, audio: Audio, voice: Voice, ui: UI, store: Store(), challenge, scene: shadowplay, wrong: wrongEnd, end: ending,
    // deterministic stepping for automated playtests (works while the pane is hidden)
    step(sec = 1 / 60) { G.manual = true; G.paused = false; const n = Math.max(1, Math.round(sec * 60)); for (let i = 0; i < n; i++) update(1 / 60, true); draw(); },
    live() { G.manual = false; },
    // async stepping: lets story/door continuations run between frames
    async play(sec = 1 / 60) {
      G.manual = true; G.paused = false;
      const n = Math.max(1, Math.round(sec * 60));
      for (let i = 0; i < n; i++) { update(1 / 60, true); for (let k = 0; k < 8; k++) await null; }
      draw();
    },
    async press(code, sec = 0.05) { key(code, 'keydown'); await this.play(sec); key(code, 'keyup'); await this.play(1 / 60); },
    down(code) { key(code, 'keydown'); },
    up(code) { key(code, 'keyup'); },
    hold(code, sec) { key(code, 'keydown'); this.step(sec); key(code, 'keyup'); this.step(1 / 60); },
    tap(code) { key(code, 'keydown'); this.step(1 / 60); key(code, 'keyup'); this.step(1 / 60); },
    async typeA(text) { for (const ch of text) { window.dispatchEvent(new KeyboardEvent('keydown', { code: `Key${ch.toUpperCase()}`, key: ch })); await this.play(1 / 60); window.dispatchEvent(new KeyboardEvent('keyup', { code: `Key${ch.toUpperCase()}`, key: ch })); } await this.play(1 / 60); },
    type(text) { for (const ch of text) { window.dispatchEvent(new KeyboardEvent('keydown', { code: `Key${ch.toUpperCase()}`, key: ch })); this.step(1 / 60); window.dispatchEvent(new KeyboardEvent('keyup', { code: `Key${ch.toUpperCase()}`, key: ch })); } this.step(1 / 60); },
  };
}

async function mainFlow() {
  buildSprites();
  const store = Store();
  Audio.setVolume(store.loadSettings().volume);
  if (G.debug && G.params.get('start')) {
    const { PRESETS } = await import('./debug/presets.js');
    const runner = createRunner({ store });
    window.MS.runner = runner;
    await runner.debugStart(PRESETS[G.params.get('start')]);
  }
  if (!G.params.has('skipwarn')) await UI.warning();
  for (;;) {
    const choice = await UI.title({ endings: store.endingsSeen(), hasSave: !!store.loadCheckpoint(), electron: !!window.MS_ELECTRON });
    if (choice === 'Settings') { await UI.settings(store, { onRecalibrate: () => UI.calibrate(store), onKeyboardOff: () => Voice.init() }); continue; }
    if (choice === 'Quit') { window.MS_ELECTRON?.quit(); continue; }
    const runner = createRunner({ store });
    if (G.debug) window.MS.runner = runner;
    await runner.start(choice === 'Continue');
  }
}

if (G.params.get('scene') === 'gallery') {
  import('./debug/gallery.js').then((m) => Scenes.push(m.galleryScene()));
} else if (G.params.get('scene') === 'poses') {
  import('./debug/poses.js').then((m) => Scenes.push(m.posesScene()));
} else if (G.debug && G.params.get('room')) {
  // debug: drop straight into a room with free-roaming flags
  buildSprites();
  const flags = {};
  const world = createWorld({ getFlag: (f) => !!flags[f] });
  world.enter(G.params.get('room'), G.params.get('spawn'));
  Scenes.push(world);
  Object.assign(window.MS, { world, flags, jump: (room, spawn) => world.enter(room, spawn), chase: (goal, from) => world.startChase({ goal, from }) });
} else {
  mainFlow();
}

startLoop({ update, draw });

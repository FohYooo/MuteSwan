// Tests for the whole-branch review findings (each failed before its fix).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { key, step, press, clearScenes } from './helpers/keys.js';
import { Input } from '../src/core/input.js';
import { Scenes } from '../src/core/scenes.js';
import { startChase } from '../src/world/prima.js';
import { Room } from '../src/world/room.js';
import { ROOMS } from '../src/world/maps.js';
import { Player } from '../src/world/player.js';
import { createWorld } from '../src/world/world-scene.js';
import { hush } from '../src/voice/challenges.js';
import { createChallenge } from '../src/voice/challenge-core.js';
import { wrongEnd } from '../src/ui/wrongend.js';
import { judgeYell } from '../src/ui/calibrate.js';
import { createVoice } from '../src/voice/mic.js';
import { stepLoop } from '../src/core/loop.js';
import { Store } from '../src/story/state.js';
import { settings } from '../src/ui/settings.js';
import { title } from '../src/ui/title.js';

const memStorage = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

// 1. Wrong End during a chase
test('cancelChase ends a running chase and restores the hooks', async () => {
  const world = { player: new Player(), hooks: { tick: null, enter: null }, actors: [], fade: 0, room: new Room(ROOMS.corridor), chasing: false, control: true };
  world.player.place(10, 4, 'down');
  const p = startChase(world, { goal: 'costume', from: { x: 3, y: 4 } });
  assert.equal(world.chasing, true);
  world.cancelChase();
  assert.equal(await p, 'cancelled');
  assert.equal(world.chasing, false);
  assert.equal(world.hooks.tick, null);
  assert.ok(!world.actors.some((a) => a.id === 'prima'));
});

test('while chasing, only doors can be interacted with', () => {
  const w = createWorld();
  w.enter('corridor', 'dorm');
  const calls = [];
  w.on('interact', (x) => { calls.push(x); });
  w.player.place(7, 2, 'up'); // facing the window at (7,1)
  w.chasing = true;
  w.interact();
  assert.equal(calls.length, 0);
  w.chasing = false;
  w.interact();
  assert.equal(calls.length, 1);
});

// 2. HUSH brightness
test('hush brightens the world only while hiding', async () => {
  clearScenes();
  const world = { fx: { ambient: null, desaturate: 0, vignette: 0.6 } };
  let done = null;
  hush({ windowMs: 200, world, fx: { ambient: 0.32 } }).then((r) => { done = r; });
  assert.equal(world.fx.ambient, 0.32);
  for (let i = 0; i < 200 && done === null; i++) await step(1);
  assert.notEqual(done, null);
  assert.equal(world.fx.ambient, null);
});

// 3. A Wrong End offers a way out
test('a Wrong End can switch to keyboard play', async () => {
  clearScenes();
  let r = null;
  wrongEnd('breath', { keyboardOption: true }).then((v) => { r = v; });
  await step(150);
  await press('ArrowDown');
  await press('KeyZ');
  await step(2);
  assert.equal(r, 'keys');
});

test('a Wrong End can go back to the title', async () => {
  clearScenes();
  let r = null;
  wrongEnd('caught', { keyboardOption: true }).then((v) => { r = v; });
  await step(150);
  await press('ArrowDown'); await press('ArrowDown');
  await press('KeyZ');
  await step(2);
  assert.equal(r, 'title');
});

test('Try again is still the default on a Wrong End', async () => {
  clearScenes();
  let r = null;
  wrongEnd('caught', { keyboardOption: false }).then((v) => { r = v; });
  await step(150);
  await press('KeyZ');
  await step(2);
  assert.equal(r, 'retry');
});

// 4. Calibration that never heard a yell
test('judgeYell rejects a silent stream after the retries', () => {
  assert.equal(judgeYell({ floorDb: -100, speechDb: -100 }, -100, 2).verdict, 'unheard');
});
test('judgeYell rejects a yell below floor+15 after the retries', () => {
  assert.equal(judgeYell({ floorDb: -70, speechDb: -60 }, -58, 2).verdict, 'unheard');
  assert.equal(judgeYell({ floorDb: -70, speechDb: -60 }, -58, 0).verdict, 'retry');
});
test('judgeYell accepts a real yell', () => {
  const j = judgeYell({ floorDb: -68, speechDb: -30 }, -7, 0);
  assert.equal(j.verdict, 'ok');
  assert.equal(j.yellDb, -7);
});

// 5. Recalibrating must not stack microphone sources
function fakeAudio(sources) {
  globalThis.AudioContext = class {
    constructor() { this.sampleRate = 48000; this.state = 'running'; this.destination = {}; this.currentTime = 0; }
    createScriptProcessor() { return { connect: (n) => n, onaudioprocess: null }; }
    createGain() { return { gain: { value: 1 }, connect: (n) => n }; }
    createMediaStreamSource(stream) { const s = { stream, connect() {}, disconnect() { s.off = true; } }; sources.push(s); return s; }
    resume() { return Promise.resolve(); }
  };
}
test('initialising the mic twice reuses the live stream', async () => {
  const sources = []; fakeAudio(sources);
  let calls = 0;
  const track = { readyState: 'live', stop() { track.readyState = 'ended'; } };
  const gum = async () => { calls++; return { getAudioTracks: () => [track], getTracks: () => [track] }; };
  const v = createVoice();
  await v.init({ getUserMedia: gum });
  await v.init({ getUserMedia: gum });
  assert.equal(calls, 1);
  assert.equal(sources.length, 1);
  delete globalThis.AudioContext;
});
test('if the old track ended, init replaces and disconnects the old source', async () => {
  const sources = []; fakeAudio(sources);
  const tracks = [];
  const gum = async () => { const t = { readyState: 'live', stop() { t.readyState = 'ended'; } }; tracks.push(t); return { getAudioTracks: () => [t], getTracks: () => [t] }; };
  const v = createVoice();
  await v.init({ getUserMedia: gum });
  tracks[0].readyState = 'ended';
  await v.init({ getUserMedia: gum });
  assert.equal(sources.length, 2);
  assert.equal(sources[0].off, true);
  delete globalThis.AudioContext;
});

// 7. Holding O is not a scream
test('keyboard NOOO ignores auto-repeated o characters', () => {
  const ch = createChallenge({ kind: 'noo', windowMs: 14000, thresholds: { shoutDb: -18, quietDb: -52 }, input: 'keys' });
  ch.key('N-down');
  for (let t = 0; t < 6000; t += 20) { ch.key('o'); ch.tick(20); }
  assert.notEqual(ch.state().result, 'win');
});
test('Input does not record auto-repeated keys as typed', async () => {
  clearScenes();
  key('KeyO', 'keydown', { key: 'o' });
  const first = Input.typed.length;
  key('KeyO', 'keydown', { key: 'o', repeat: true });
  assert.equal(Input.typed.length, first);
  key('KeyO', 'keyup');
  Input.endFrame();
});

// 8. Letting go when she is gone
test('keyboard HUSH: letting go in the last 1.5 s is safe', () => {
  const ch = createChallenge({ kind: 'hush', windowMs: 8000, thresholds: { shoutDb: -18, quietDb: -52 }, input: 'keys' });
  ch.key('space-down');
  for (let t = 0; t < 6600; t += 20) ch.tick(20);
  ch.key('space-up');
  for (let t = 0; t < 1600; t += 20) ch.tick(20);
  assert.equal(ch.state().result, 'win');
});

// 9. Turning keyboard mode off asks for the microphone
test('settings: turning keyboard mode off calls onKeyboardOff', async () => {
  clearScenes();
  const store = Store(memStorage());
  store.saveSettings({ keyboardMode: true });
  let called = 0;
  let closed = false;
  settings(store, { onKeyboardOff: () => { called++; } }).then(() => { closed = true; });
  await step(2);
  await press('ArrowDown'); // keyboard row
  await press('ArrowRight');
  await step(2);
  assert.equal(store.loadSettings().keyboardMode, false);
  assert.equal(called, 1);
  await press('KeyX'); await step(2);
  assert.ok(closed);
});

// 10. One error must not stop the game; bad settings are coerced
test('loop keeps updating after an update throws', () => {
  let n = 0;
  const orig = console.error; console.error = () => {};
  let st = { acc: 0, last: 0 };
  for (let i = 1; i <= 10; i++) st = stepLoop(st, i * (1000 / 60), () => { n++; if (n === 2) throw new Error('boom'); });
  console.error = orig;
  assert.ok(n >= 9, `only ${n} updates`);
});
test('settings are coerced to valid values', () => {
  const mem = memStorage();
  mem.setItem('muteswan.settings', JSON.stringify({ volume: 'abc', voiceCheck: 'weird', calib: { shoutDb: 'x', quietDb: -50 }, keyboardMode: 'yes' }));
  const s = Store(mem).loadSettings();
  assert.equal(s.volume, 0.8);
  assert.equal(s.voiceCheck, 'normal');
  assert.equal(s.calib, null);
  assert.equal(s.keyboardMode, false);
  mem.setItem('muteswan.settings', JSON.stringify({ volume: 5 }));
  assert.equal(Store(mem).loadSettings().volume, 1);
});

// 11. New night over a save asks first
test('title: New night over a saved night asks for confirmation', async () => {
  clearScenes();
  let r = null;
  title({ hasSave: true }).then((v) => { r = v; });
  await step(50);
  await press('ArrowDown'); // New night
  await press('KeyZ');
  await step(5);
  assert.equal(r, null, 'must not start without confirming');
  await press('ArrowDown'); // Back
  await press('KeyZ');
  await step(5);
  assert.equal(r, null);
  await press('KeyZ'); // New night again
  await step(5);
  await press('KeyZ'); // confirm
  await step(5);
  assert.equal(r, 'New night');
});

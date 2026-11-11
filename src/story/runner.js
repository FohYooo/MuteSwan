// Builds the script context S and wires the world to the story: interactions, doors,
// room entry, checkpoints, Wrong End restarts and endings.
import { createWorld } from '../world/world-scene.js';
import { Scenes } from '../core/scenes.js';
import * as UI from '../ui/index.js';
import { codepad } from '../ui/codepad.js';
import { freeze, hush, noo, runFor } from '../voice/challenges.js';
import { shadowplay } from '../cutscene/plays.js';
import { wrongEnd } from '../ui/wrongend.js';
import { ending as endingScreen } from '../ui/ending.js';
import { EVENTS, ON_ENTER, onDoor, prologue } from './script.js';
import { ITEMS } from './lines.js';
import { createState, give, has, take, Store } from './state.js';
import { recordChoice, addDevotion, addDistance, effectiveTiers, tickIdle, tickLinger, compareVoice, candleStyle } from './ledger.js';
import * as Challenges from '../voice/challenges.js';
import { SPRITES } from '../gfx/sprites.js';
import { L } from './lines.js';
import { Audio } from '../audio/synth.js';
import { Voice } from '../voice/mic.js';
import { modal } from '../ui/common.js';

class Restart extends Error {}
class Ended extends Error {}

const lerp = (a, b, k) => a + (b - a) * Math.max(0, Math.min(1, k));

function waitScene(ms) {
  let t = 0;
  return modal({ update(dt) { t += dt * 1000; if (t >= ms) this.close(); } });
}

export function createRunner({ store = Store() } = {}) {
  let state = createState();
  let finished = null;
  const done = new Promise((r) => { finished = r; });
  const world = createWorld({ getFlag: (f) => !!state.flags[f] });

  const tiers = () => effectiveTiers(state.ledger);
  const keysMode = () => store.loadSettings().keyboardMode || Voice.status.mic !== 'ok';
  // Distance makes the voice fade and the window shorter (spec §13.3)
  const voiceAdjust = (kind, windowMs) => {
    const t = tiers();
    let w = windowMs;
    if (kind === 'freeze') { if (t.dist >= 2 && keysMode()) w -= 1000; if (t.dist >= 3) w -= 1000; }
    return { windowMs: Math.max(3000, w), shoutShift: t.dist >= 2 ? 4 : 0 };
  };
  const HER_HAND = ['Only me.', 'Nobody else. Ever.', 'You belong to me.', 'Say it. Say you are mine.'];
  const tileCenter = (x, y) => ({ x: x * 16 + 8, y: y * 16 + 14 });
  const along = (a, k) => { const p = tileCenter(lerp(a.from[0], a.to[0], k), lerp(a.from[1], a.to[1], k)); return p; };

  const S = {
    get state() { return state; },
    world,
    flag(n, v) { if (v !== undefined) state.flags[n] = v; return !!state.flags[n]; },
    has: (i) => has(state, i),
    give: (i) => give(state, i),
    take: (i) => take(state, i),
    care(tag, n = 1) { if (tag === 'dev') addDevotion(state.ledger, n); else addDistance(state.ledger, n); },
    tiers,
    say: (speaker, text) => UI.say(speaker, text),
    async lines(list) {
      for (const item of list) {
        if (Array.isArray(item)) await UI.say(item[0], item[1]);
        else await UI.say(null, item);
      }
    },
    async write(options, opts) {
      const t = tiers();
      if (t.performing && !state.flags.perf_called) { state.flags.perf_called = true; await S.lines(L.performing_vesna); }
      let n = 0;
      const shown = options.map((o) => {
        const opt = typeof o === 'string' ? { text: o } : { ...o };
        // devotion tier 3: her red handwriting has rewritten the caring line
        if (t.dev >= 3 && opt.tag === 'dev') { opt.text = HER_HAND[(state.ledger.devotion + n++) % HER_HAND.length]; opt.hand = 'vesna'; }
        return opt;
      });
      const i = await UI.write(shown, opts);
      if (shown[i]?.tag) recordChoice(state.ledger, shown[i].tag);
      return i;
    },
    choose: (options, opts) => UI.choose(options, opts),
    wait: (ms) => waitScene(ms),
    async freeze({ windowMs, crackAt, approach } = {}) {
      const a = approach && world.actor(approach.id);
      const adj = crackAt ? { windowMs, shoutShift: 0 } : voiceAdjust('freeze', windowMs);
      const won = await freeze({ ...adj, crackAt, world, onTick: a ? (st) => Object.assign(a, along(approach, 1 - st.timeLeft / st.windowMs)) : null });
      const st = Challenges.lastStats;
      if (!crackAt && st?.input === 'mic' && st.peakDb > -100) (state.voiceSelf = state.voiceSelf || []).push(st.peakDb);
      return won;
    },
    async hush({ windowMs, route } = {}) {
      const a = route && world.actor(route.id);
      const pts = route?.points || [];
      return hush({
        windowMs, world,
        fx: { ambient: 0.32 }, // the slit in the wardrobe door must show her passing
        onTick: a ? (st) => {
          const k = (1 - st.timeLeft / st.windowMs) * (pts.length - 1);
          const i = Math.min(pts.length - 2, Math.floor(k));
          const p = along({ from: pts[i], to: pts[i + 1] }, k - i);
          a.dir = pts[i + 1][0] < pts[i][0] ? 'left' : pts[i + 1][0] > pts[i][0] ? 'right' : pts[i + 1][1] < pts[i][1] ? 'up' : 'down';
          a.anim += 0.15; a.moving = true;
          Object.assign(a, p);
        } : null,
      });
    },
    async noo({ windowMs, sink } = {}) {
      const a = sink && world.actor(sink.id);
      const won = await noo({ ...voiceAdjust('noo', windowMs), world, onTick: a ? (st) => { if (!st.result) Object.assign(a, along(sink, 1 - st.timeLeft / st.windowMs)); } : null });
      // did you scream louder for her than for yourself?
      const st = Challenges.lastStats;
      const self = state.voiceSelf || [];
      if (st?.input === 'mic' && self.length) compareVoice(state.ledger, self.reduce((x, y) => x + y, 0) / self.length, st.peakDb);
      return won;
    },
    runFor: ({ windowMs } = {}) => runFor({ ...voiceAdjust('runfor', windowMs), world }),
    play: (id) => shadowplay(id),
    async wrong(id) {
      store.recordWrongEnd(id);
      world.cancelChase?.();
      world.fx.desaturate = 0; world.fx.shake = 0; world.fx.redPulse = 0;
      const choice = await wrongEnd(id, { keyboardOption: !store.loadSettings().keyboardMode });
      if (choice === 'title') throw new Ended('title');
      if (choice === 'keys') store.saveSettings({ keyboardMode: true });
      throw new Restart(id);
    },
    async ending(id) {
      store.recordEnding(id);
      store.clearCheckpoint();
      await endingScreen(id);
      throw new Ended(id);
    },
    addActor(cfg) { const a = world.addActor(cfg); if (cfg.event) a.event = cfg.event; return a; },
    actorSet(id, props) { const a = world.actor(id); if (a) Object.assign(a, props); },
    walk: (id, tx, ty, speed) => world.walkTo(id, tx, ty, speed),
    remove: (id) => world.removeActor(id),
    walkPlayer: (tx, ty) => world.walkTo('player', tx, ty, 1.2),
    placePlayer: (tx, ty, dir) => world.player.place(tx, ty, dir),
    playerTile: () => [world.player.tx, world.player.ty],
    hidePlayer(b) { world.player.hidden = b; },
    music: (name) => Audio.music(name),
    sfx: (name) => Audio.sfx(name),
    toast: (text) => world.toast(text),
    codepad: (n) => codepad(n),
    chase: (goal, from, delay = 1.0) => world.startChase({ goal, from, delay, speedMult: tiers().dev >= 2 ? 1.08 : 1 }),
    checkpoint() {
      const p = world.player;
      state.room = world.room.id;
      state.pos = { x: p.tx, y: p.ty, dir: p.dir };
      store.saveCheckpoint(state);
    },
    goto: (room, spawn) => world.enter(room, spawn),
    fadeIn: () => world.fadeTo(0, 3),
  };

  async function dispatch(fn) {
    try {
      await fn();
    } catch (e) {
      if (e instanceof Restart) return restore();
      if (e instanceof Ended) return finish();
      console.error(e);
    }
  }

  function restore() {
    const cp = store.loadCheckpoint();
    if (!cp) { finish(); return; }
    state = cp;
    if ((state.windowLooks || 0) >= 2) state.windowLooks = 1;
    world.actors = [];
    world.player.hidden = false;
    world.player.walk = null;
    world.cancelChase?.();
    Object.assign(world.fx, { desaturate: 0, shake: 0, redPulse: 0, ambient: null, tint: null });
    world.fade = 1;
    world.enter(cp.room, cp.pos || cp.spawn);
  }

  function finish() {
    Scenes.pop(world);
    Audio.music(null);
    finished();
  }

  world.on('interact', (what) => dispatch(async () => {
    if (what.obj?.event) return EVENTS[what.obj.event]?.(S, what);
    if (what.actor?.event) return EVENTS[what.actor.event]?.(S, what);
    if (what.tileEvent) return EVENTS[what.tileEvent]?.(S, what);
    if (what.door) return world.tryDoor(what.door);
  }));
  world.on('door', async (door) => {
    try { return await onDoor(S, door, { chasing: world.chasing }); } catch (e) { console.error(e); return false; }
  });
  world.on('enter', (roomId) => {
    if (world.chasing) return;
    state.room = roomId;
    S.checkpoint();
    world.run(() => dispatch(async () => {
      await world.fadeTo(0, 3);
      const t = tiers();
      if (t.dev >= 3 && !state.flags.keepsakes_taken && (S.has('lighter') || S.has('ribbon'))) {
        state.flags.keepsakes_taken = true;
        S.take('lighter'); S.take('ribbon');
        await S.lines(L.keepsakes_taken);
      }
      await ON_ENTER[roomId]?.(S);
      haunt(roomId);
    }));
  });

  // The Ledger made visible: who waits in the doorways
  function haunt(roomId) {
    const t = tiers();
    const p = world.player;
    if (t.dev >= 2 && !world.actor('vesna') && roomId !== 'lake' && Math.random() < 0.6) {
      world.addActor({ id: 'v_door', sprite: 'vesna', x: Math.max(1, p.tx - 1), y: p.ty, dir: 'right', alpha: 0.55, light: { r: 28 } });
      world.walkTo('v_door', Math.max(1, p.tx - 4), p.ty, 0.45).then(() => world.removeActor('v_door'));
    }
    if (t.dist >= 3 && roomId === 'corridor') world.addActor({ id: 'prima_far', sprite: 'prima', x: 38, y: 4, dir: 'left', alpha: 0.85 });
  }
  world.candleStyle = () => candleStyle(tiers());
  world.mirrorExtras = () => {
    const t = tiers();
    const p = world.player;
    const out = [];
    if (t.dev >= 1 && !world.actor('vesna')) out.push({ x: p.x + 9, y: p.y + 10, sprite: () => SPRITES.vesna.down[0] });
    if (t.performing) out.push({ x: p.x, y: p.y, sprite: () => SPRITES.mask });
    return out;
  };
  let lastTiers = { dev: 0, dist: 0, performing: false };
  world.on('tick', (dt) => {
    if (world.chasing || !world.room) return;
    const ms = dt * 1000;
    const p = world.player;
    if (world.canAct() && Scenes.top() === world && !p.moving && !p.walk) tickIdle(state.ledger, ms); // doing nothing is a choice
    const v = world.actor('vesna');
    if (v && !v.hidden && (v.alpha ?? 1) >= 0.5 && Math.hypot(v.x - p.x, v.y - p.y) < 56) tickLinger(state.ledger, world.room.id, ms);
    const far = world.actor('prima_far');
    if (far && Math.hypot(far.x - p.x, far.y - p.y) < 96) { world.removeActor('prima_far'); Audio.sfx('sting'); }
    const t = tiers();
    world.ambientShift = candleStyle(t).ambientShift;
    if (t.dev > lastTiers.dev && L.tier_dev[t.dev]) world.toast(L.tier_dev[t.dev]);
    if (t.dist > lastTiers.dist && L.tier_dist[t.dist]) world.toast(L.tier_dist[t.dist]);
    if (t.performing && !lastTiers.performing) world.toast(L.performing);
    lastTiers = t;
  });
  world.on('inventory', () => UI.openInventory(state.inv.map((id) => ({ id, ...ITEMS[id] }))));
  world.on('menu', async () => {
    const c = await UI.choose(['Resume', 'What Mira carries', 'Settings', 'Quit to title'], { prompt: 'The night waits.' });
    if (c === 1) await UI.openInventory(state.inv.map((id) => ({ id, ...ITEMS[id] })));
    if (c === 2) await UI.settings(store, { onRecalibrate: () => UI.calibrate(store), onKeyboardOff: keyboardOff });
    if (c === 3) finish();
  });

  Voice.onStatus((st) => {
    if (st.mic === 'none' && !store.loadSettings().keyboardMode) world.toast('The microphone is gone. Type R-U-N, hold Space, hold N and tap O.');
  });
  const keyboardOff = () => Voice.init().then((r) => { if (r.mic === 'ok') Voice.loadWords(); });

  async function ensureVoice() {
    const st = store.loadSettings();
    if (st.keyboardMode) return;
    if (!st.calib) { await UI.calibrate(store); return; }
    if (Voice.status.mic !== 'ok') await Voice.init();
    if (Voice.status.mic === 'ok') Voice.loadWords();
  }

  return {
    world, S, done,
    get state() { return state; },
    async start(resume = false) {
      await ensureVoice();
      Scenes.push(world);
      const cp = resume ? store.loadCheckpoint() : null;
      if (cp) { state = cp; world.enter(cp.room, cp.pos || cp.spawn); return done; }
      state = createState();
      store.clearCheckpoint();
      await dispatch(() => prologue(S));
      world.fade = 1;
      world.enter('dorm', 'bed');
      return done;
    },
    // debug: start at a chapter preset
    async debugStart(p) {
      await ensureVoice();
      Scenes.push(world);
      state = createState();
      Object.assign(state.flags, p.flags);
      p.inv.forEach((i) => give(state, i));
      state.ledger.devotion = p.devotion || 0;
      world.enter(p.room, p.spawn);
      return done;
    },
    // debug: jump anywhere with flags
    jump(room, spawn, flags = {}, inv = []) { Object.assign(state.flags, flags); inv.forEach((i) => give(state, i)); world.enter(room, spawn); },
  };
}

// The explorable world: draws a room with its objects and actors, lights it,
// moves Mira, and reports interactions and doors to the story.
import { ROOMS } from './maps.js';
import { Room, TS } from './room.js';
import { Player, Walker } from './player.js';
import { tileFrame } from '../gfx/tiles.js';
import { SPRITES, propFrame } from '../gfx/sprites.js';
import { Lighting } from '../gfx/lighting.js';
import { Post } from '../gfx/post.js';
import { Font } from '../gfx/font.js';
import { PAL } from '../gfx/palette.js';
import { Input } from '../core/input.js';
import { Audio } from '../audio/synth.js';
import { startChase } from './prima.js';

const W = 320, H = 180;
const DIR_V = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

function walkerSprite(w) {
  const set = SPRITES[w.sprite];
  if (!set) return null;
  if (w.pose && set[w.pose]) return set[w.pose];
  const frames = set[w.dir] || set.down;
  return frames[Math.min(w.frame, frames.length - 1)];
}

export function createWorld({ getFlag = () => false } = {}) {
  const world = {
    opaque: true,
    room: null,
    player: new Player(),
    actors: [],
    time: 0,
    cam: { x: 0, y: 0 },
    fx: { desaturate: 0, shake: 0, redPulse: 0, vignette: 0.6, grain: 0.12, ambient: null, tint: null },
    fade: 1,
    fadeTarget: 0,
    fadeSpeed: 3,
    control: true,
    busy: 0,
    banner: { text: '', t0: 0 },
    hooks: { interact: null, door: null, enter: null, inventory: null, tick: null, menu: null },
    candle: () => getFlag('has_candle'),
    getFlag,

    on(name, fn) { this.hooks[name] = fn; return this; },
    startChase(opts) { return startChase(this, opts); },
    toast(text) { this.toastMsg = { text, t0: performance.now() }; },
    toastMsg: null,
    musicOverride: null,
    chasing: false,

    enter(roomId, spawn = null) {
      const def = ROOMS[roomId];
      this.room = new Room(def, getFlag);
      const s = typeof spawn === 'object' && spawn ? spawn : def.spawns[spawn] || Object.values(def.spawns)[0];
      this.player.place(s.x, s.y, s.dir || 'down');
      this.actors = this.actors.filter((a) => a.persist);
      this.banner = { text: def.name, t0: performance.now() };
      this.snapCamera();
      Audio.music(this.musicOverride || def.music);
      this.fade = Math.max(this.fade, 0.6);
      this.fadeTarget = 0;
      this.hooks.enter?.(roomId);
    },

    // ---- actors ----------------------------------------------------------
    addActor({ id, sprite, x, y, dir = 'down', reflects = true, light = null, mirrorOnly = false, alpha = 1, persist = false, solid = false }) {
      this.removeActor(id);
      const a = new Walker(sprite);
      Object.assign(a, { id, reflects, light, mirrorOnly, alpha, persist, solid });
      a.place(x, y, dir);
      this.actors.push(a);
      return a;
    },
    actor(id) { return this.actors.find((a) => a.id === id) || null; },
    removeActor(id) { this.actors = this.actors.filter((a) => a.id !== id); },

    // Straight-line scripted walk (x first, then y). speed in px/frame at 60 fps.
    walkTo(who, tx, ty, speed = 1.0) {
      const a = who === 'player' ? this.player : this.actor(who);
      if (!a) return Promise.resolve();
      const gx = tx * TS + 8, gy = ty * TS + 14;
      return new Promise((resolve) => { a.walk = { gx, gy, speed, resolve }; });
    },

    stepWalk(a, dt) {
      const w = a.walk;
      if (!w) return;
      const sp = w.speed * 60 * dt;
      const dx = w.gx - a.x, dy = w.gy - a.y;
      if (Math.abs(dx) > 0.5) { a.x += Math.sign(dx) * Math.min(sp, Math.abs(dx)); a.dir = dx < 0 ? 'left' : 'right'; a.step(dt, true); }
      else if (Math.abs(dy) > 0.5) { a.x = w.gx; a.y += Math.sign(dy) * Math.min(sp, Math.abs(dy)); a.dir = dy < 0 ? 'up' : 'down'; a.step(dt, true); }
      else { a.x = w.gx; a.y = w.gy; a.step(dt, false); a.walk = null; w.resolve(); }
    },

    fadeTo(v, speed = 3) {
      if (this.fade === v) { this.fadeTarget = v; return Promise.resolve(); }
      this.fadeTarget = v;
      this.fadeSpeed = speed;
      return new Promise((resolve) => { this.fadeDone = resolve; });
    },

    snapCamera() {
      const r = this.room;
      const rw = r.w * TS, rh = r.h * TS;
      const cx = this.player.x - W / 2, cy = this.player.y - 12 - H / 2;
      this.cam.x = rw <= W ? (rw - W) / 2 : Math.max(0, Math.min(rw - W, cx));
      this.cam.y = rh <= H ? (rh - H) / 2 : Math.max(0, Math.min(rh - H, cy));
    },

    // Run an async story hook while blocking player control.
    async run(fn) {
      this.busy++;
      try { await fn(); } finally { this.busy = Math.max(0, this.busy - 1); }
    },

    // during a chase the story event is still awaiting it, so the player keeps control
    canAct() { return this.control && (this.busy === 0 || this.chasing) && this.fade < 0.05; },

    // ---- per frame -----------------------------------------------------------
    update(dt) {
      this.time += dt;
      if (this.fade !== this.fadeTarget) {
        const d = this.fadeSpeed * dt;
        this.fade = this.fade < this.fadeTarget ? Math.min(this.fadeTarget, this.fade + d) : Math.max(this.fadeTarget, this.fade - d);
        if (this.fade === this.fadeTarget && this.fadeDone) { const f = this.fadeDone; this.fadeDone = null; f(); }
      }
      if (!this.room) return;
      for (const a of this.actors) this.stepWalk(a, dt);
      if (this.player.walk) this.stepWalk(this.player, dt);
      this.hooks.tick?.(dt);
      if (this.canAct()) {
        const res = this.player.update(dt, Input, this.room);
        if (res.moved) {
          this.player.stepTimer -= dt;
          if (this.player.stepTimer <= 0) { Audio.sfx('step'); this.player.stepTimer = res.running ? 0.22 : 0.36; }
        }
        // walk-in exits ('D', 'v') and push-into doors ('+')
        const under = this.room.doorAt(this.player.tx, this.player.ty);
        if (under) this.tryDoor(under);
        else if (res.pushTile) {
          const tiles = [res.pushTile, ...(this.player.pushAlt || [])];
          const d = tiles.map(([x, y]) => this.room.doorAt(x, y)).find(Boolean);
          if (d) this.tryDoor(d);
        }
        if (Input.pressed('ok')) this.interact();
        else if (Input.pressed('inv') && this.hooks.inventory) this.run(() => this.hooks.inventory());
        else if (Input.pressed('back') && this.hooks.menu && !this.chasing) this.run(() => this.hooks.menu());
      } else if (!this.player.walk) {
        this.player.step(dt, false);
      }
      this.snapCamera();
    },

    tryDoor(door) {
      this.run(async () => {
        const go = this.hooks.door ? await this.hooks.door(door) : !this.room.doorLocked(door);
        if (!go) {
          // step back off the threshold so the door does not retrigger
          const [dx, dy] = DIR_V[this.player.dir];
          this.player.x -= dx * 4; this.player.y -= dy * 4;
          return;
        }
        Audio.sfx('door');
        await this.fadeTo(1, 5);
        this.enter(door.to, door.spawn);
      });
    },

    interact() {
      const p = this.player;
      const [fx, fy] = p.facingTile();
      const target = this.room.objectAt(fx, fy) || this.room.objectAt(p.tx, p.ty);
      const [dx, dy] = DIR_V[p.dir];
      const px = p.x + dx * 12, py = p.y + dy * 12;
      const actor = this.actors.find((a) => a.event && !a.hidden && Math.hypot(a.x - px, a.y - py) < 16);
      let what = null;
      if (this.chasing) {
        // mid-chase only doors respond: no reading windows with her behind you
        const door = this.room.doorAt(fx, fy);
        if (door && this.hooks.interact) this.run(() => this.hooks.interact({ door }));
        return;
      }
      if (actor) what = { actor };
      else if (target) what = { obj: target };
      else {
        const ch = this.room.tile(fx, fy);
        const ev = this.room.def.tileEvents?.[ch];
        const door = this.room.doorAt(fx, fy);
        if (door) what = { door };
        else if (ev) what = { tileEvent: ev, tx: fx, ty: fy };
      }
      if (what && this.hooks.interact) this.run(() => this.hooks.interact(what));
    },

    // ---- drawing -----------------------------------------------------------
    objSprite(o) {
      if (o.sprite === 'portrait') {
        const dx = this.player.x - (o.x * TS + 8);
        return SPRITES[dx < -28 ? 'portrait_l' : dx > 28 ? 'portrait_r' : 'portrait_c'];
      }
      const s = SPRITES[o.sprite];
      if (!Array.isArray(s)) return s;
      if (o.turns) {
        const vx = o.x * TS + 8 - this.player.x, vy = o.y * TS + 12 - this.player.y;
        const [fx, fy] = DIR_V[this.player.dir];
        return s[vx * fx + vy * fy < 0 ? 1 : 0];
      }
      if (o.frameIf) return s[getFlag(o.frameIf) ? 1 : 0];
      return propFrame(o.sprite, this.time, 3);
    },

    objRect(o, sprite) {
      const fx = o.x * TS, fy = o.y * TS, fw = (o.w || 1) * TS, fh = (o.h || 1) * TS;
      return { x: Math.round(fx + (fw - sprite.width) / 2), y: fy + fh - sprite.height - (o.lift || 0), bottom: fy + fh + (o.lift ? 0.5 : 0) };
    },

    draw(ctx, ui) {
      if (!this.room) return;
      const r = this.room;
      const cx = Math.round(this.cam.x), cy = Math.round(this.cam.y);
      const t = this.time;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const tx0 = Math.floor(cx / TS), ty0 = Math.floor(cy / TS);
      for (let ty = ty0; ty <= ty0 + 12; ty++) {
        for (let tx = tx0; tx <= tx0 + 21; tx++) {
          if (tx < 0 || ty < 0 || tx >= r.w || ty >= r.h) continue;
          ctx.drawImage(tileFrame(r.tile(tx, ty), t, tx, ty), tx * TS - cx, ty * TS - cy);
        }
      }
      const objs = r.objects();
      // wall objects first
      for (const o of objs) {
        if (!o.wall || !o.sprite) continue;
        const s = this.objSprite(o);
        if (!s) continue;
        const rc = this.objRect(o, s);
        ctx.drawImage(s, rc.x - cx, rc.y - cy);
      }
      this.drawMirrors(ctx, cx, cy, objs);
      // floor objects, actors and Mira, sorted by their feet
      const list = [];
      for (const o of objs) {
        if (o.wall || o.mirrorOnly || !o.sprite) continue;
        const s = this.objSprite(o);
        if (!s) continue;
        const rc = this.objRect(o, s);
        list.push({ y: rc.bottom, draw: () => { ctx.globalAlpha = o.alpha ?? 1; ctx.drawImage(s, rc.x - cx, rc.y - cy); ctx.globalAlpha = 1; } });
      }
      for (const a of [...this.actors, this.player]) {
        if (a.hidden || a.mirrorOnly) continue;
        const s = walkerSprite(a);
        if (!s) continue;
        list.push({ y: a.y, draw: () => { ctx.globalAlpha = a.alpha ?? 1; ctx.drawImage(s, Math.round(a.x - s.width / 2) - cx, Math.round(a.y - s.height + 1) - cy); ctx.globalAlpha = 1; } });
      }
      list.sort((a, b) => a.y - b.y).forEach((d) => d.draw());

      // light
      Lighting.begin(ctx);
      const p = this.player;
      if (!p.hidden) {
        const cs = this.candleStyle?.() || { r: 72, color: PAL.candle };
        if (this.candle()) Lighting.light(p.x - cx, p.y - 14 - cy, cs.r, cs.color, 1);
        else Lighting.light(p.x - cx, p.y - 12 - cy, 26, null, 0, 0.7);
      }
      for (const o of objs) {
        if (!o.light) continue;
        Lighting.light((o.x + (o.w || 1) / 2) * TS - cx, (o.y + (o.h || 1) / 2) * TS - 4 - cy, o.light.r, o.light.color || PAL.candle, o.light.color ? 0 : 1, o.light.strength || 1);
      }
      for (const a of this.actors) if (a.light && !a.hidden) Lighting.light(a.x - cx, a.y - 14 - cy, a.light.r, a.light.color || PAL.candle, 1);
      for (let ty = ty0; ty <= ty0 + 12; ty++) {
        for (let tx = tx0; tx <= tx0 + 21; tx++) {
          if (r.tile(tx, ty) === '|') Lighting.light(tx * TS + 8 - cx, ty * TS + 22 - cy, 44, PAL.moon, 0, 0.55);
        }
      }
      Lighting.end(ctx, Math.max(0, (this.fx.ambient ?? r.def.ambient) + (this.ambientShift || 0)));
      if (this.fx.tint) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = this.fx.tint; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      Post.apply(ctx, this.fx);

      if (this.fade > 0) { ctx.fillStyle = `rgba(11,10,12,${this.fade})`; ctx.fillRect(0, 0, W, H); }

      if (this.toastMsg) {
        const tt = (performance.now() - this.toastMsg.t0) / 1000;
        const life = 1.6 + this.toastMsg.text.length * 0.045;
        if (tt < life) Font.draw(ui, this.toastMsg.text, W / 2, 26, { align: 'center', size: 7, italic: true, wrap: 280, color: PAL.bone, alpha: Math.min(1, (life - tt) * 2, tt * 3) });
      }
      // room name banner
      const bt = (performance.now() - this.banner.t0) / 1000;
      if (this.banner.text && bt < 3.2) {
        const a = bt < 0.6 ? bt / 0.6 : bt > 2.4 ? Math.max(0, (3.2 - bt) / 0.8) : 1;
        Font.draw(ui, `— ${this.banner.text} —`, W / 2, 12, { align: 'center', size: 7, italic: true, color: PAL.frost, alpha: a });
      }
    },

    // Mirrors show actors in front of them (Mira does not reflect) and mirror-only things.
    drawMirrors(ctx, cx, cy, objs) {
      const r = this.room;
      const ty = 1;
      if (!r.rows[ty].includes('M')) return;
      const glassTop = ty * TS + 1, glassBottom = ty * TS + 11;
      const things = [];
      for (const a of [...this.actors, this.player]) {
        if (a.hidden || a.reflects === false) continue;
        things.push({ x: a.x, y: a.y, sprite: () => { const set = SPRITES[a.sprite]; const d = OPPOSITE[a.dir] || 'down'; return a.pose && set[a.pose] ? set[a.pose] : (set[d] || set.down)[Math.min(a.frame, 2)]; } });
      }
      for (const o of objs) if (o.mirrorOnly && o.sprite) things.push({ x: (o.x + 0.5) * TS, y: (o.y + 1) * TS, sprite: () => this.objSprite(o), small: true });
      things.push(...(this.mirrorExtras?.() || [])); // the Ledger: who the glass keeps
      ctx.save();
      ctx.beginPath();
      for (let tx = 0; tx < r.w; tx++) if (r.tile(tx, ty) === 'M') ctx.rect(tx * TS + 1 - cx, glassTop - cy, 14, 10);
      ctx.clip();
      for (const th of things) {
        const d = th.y - glassBottom;
        if (d < 0 || d > 5 * TS) continue;
        const s = th.sprite();
        if (!s) continue;
        const k = th.small ? 0.8 : Math.max(0.42, 0.78 - d / 200);
        const w = s.width * k, h = s.height * k;
        const top = th.small ? glassBottom - h - 1 + Math.min(3, d / 40) : glassTop + 1 + d / 40;
        ctx.globalAlpha = 0.85;
        ctx.drawImage(s, Math.round(th.x - w / 2 - cx), Math.round(top - cy), Math.round(w), Math.round(h));
      }
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = PAL.moon;
      for (let tx = 0; tx < r.w; tx++) if (r.tile(tx, ty) === 'M') ctx.fillRect(tx * TS + 1 - cx, glassTop - cy, 14, 10);
      ctx.restore();
    },
  };
  return world;
}

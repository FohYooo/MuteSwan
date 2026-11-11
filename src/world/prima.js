// The Prima: a stalker that paths to Mira on the tile grid and follows her through doors.
import { Walker } from './player.js';
import { TS } from './room.js';
import { Audio } from '../audio/synth.js';

// 4-neighbour BFS. The target tile may be solid (she reaches into where Mira stands).
export function bfsPath(isSolid, w, h, from, to) {
  if (from.x === to.x && from.y === to.y) return [{ x: from.x, y: from.y }];
  const key = (x, y) => y * w + x;
  const prev = new Map([[key(from.x, from.y), null]]);
  const q = [from];
  while (q.length) {
    const c = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = c.x + dx, ny = c.y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const k = key(nx, ny);
      if (prev.has(k)) continue;
      const isGoal = nx === to.x && ny === to.y;
      if (!isGoal && isSolid(nx, ny)) continue;
      prev.set(k, c);
      if (isGoal) {
        const path = [{ x: nx, y: ny }];
        let p = c;
        while (p) { path.unshift({ x: p.x, y: p.y }); p = prev.get(key(p.x, p.y)); }
        return path;
      }
      q.push({ x: nx, y: ny });
    }
  }
  return null;
}

export class Prima extends Walker {
  constructor(speedMult = 1) {
    super('prima');
    this.id = 'prima';
    this.speed = 1.9 * speedMult;
    this.path = null;
    this.repath = 0;
    this.click = 0;
    this.reflects = true;
    this.light = { r: 26, color: '#a9bcd3' }; // a cold wet sheen so she reads in the dark
  }

  update(dt, room, player) {
    this.repath -= dt;
    if (this.repath <= 0) {
      this.repath = 0.25;
      this.path = bfsPath((x, y) => room.isSolid(x, y), room.w, room.h, { x: this.tx, y: this.ty }, { x: player.tx, y: player.ty });
      if (this.path) this.path.shift();
    }
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    this.pose = dist < 34 ? 'reach' : null;
    let moving = false;
    const sp = this.speed * 60 * dt;
    const target = this.path && this.path.length ? { x: this.path[0].x * TS + 8, y: this.path[0].y * TS + 14 } : (dist < 40 ? { x: player.x, y: player.y } : null);
    if (target) {
      const dx = target.x - this.x, dy = target.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d <= sp) { this.x = target.x; this.y = target.y; this.path?.shift(); } else { this.x += (dx / d) * sp; this.y += (dy / d) * sp; }
      if (Math.abs(dx) > Math.abs(dy)) this.dir = dx < 0 ? 'left' : 'right'; else this.dir = dy < 0 ? 'up' : 'down';
      moving = d > 0.5;
    }
    this.step(dt, moving);
    if (moving) {
      this.click -= dt;
      if (this.click <= 0) { Audio.sfx('click_pointe'); this.click = 0.3; }
    }
  }

  catches(player) { return Math.abs(player.x - this.x) < 9 && Math.abs(player.y - this.y) < 7; }
}

// Run a chase in the world until Mira reaches `goal` (a room id) or is caught.
// from: {x, y} tile where the Prima starts (defaults to two tiles behind Mira).
export function startChase(world, { goal, from = null, enterDelay = 2.0, music = 'chase', delay = 0, speedMult = 1 } = {}) {
  return new Promise((resolve) => {
    const p = world.player;
    const prevTick = world.hooks.tick;
    const prevEnter = world.hooks.enter;
    let prima = new Prima(speedMult);
    let respawn = null;
    let done = false;
    let stagger = delay; // the scream staggers her before she gives chase
    const place = (tx, ty) => { prima.place(tx, ty, 'down'); world.actors = world.actors.filter((a) => a.id !== 'prima'); world.actors.push(prima); };
    const start = from || { x: p.tx, y: Math.min(world.room.h - 2, p.ty + 2) };
    place(start.x, start.y);
    p.canRun = true;
    world.chasing = true;
    world.control = true;
    const prevMusic = world.room.def.music;
    world.musicOverride = music;
    Audio.music(music, 300);

    const finish = (outcome) => {
      if (done) return;
      done = true;
      world.hooks.tick = prevTick;
      world.hooks.enter = prevEnter;
      world.actors = world.actors.filter((a) => a.id !== 'prima');
      p.canRun = false;
      world.chasing = false;
      world.cancelChase = null;
      world.musicOverride = null;
      Audio.music(world.room.def.music || prevMusic, 2000);
      resolve(outcome);
    };

    // a Wrong End during the chase (or anything else) can end it from outside
    world.cancelChase = () => finish('cancelled');

    world.hooks.enter = (roomId) => {
      prevEnter?.(roomId);
      if (roomId === goal) { Audio.sfx('door'); finish('escaped'); return; }
      Audio.music(music, 100);
      const entry = { x: p.tx, y: p.ty };
      prima = new Prima(speedMult);
      respawn = { t: enterDelay, at: entry };
    };

    world.hooks.tick = (dt) => {
      prevTick?.(dt);
      if (done) return;
      if (respawn) {
        respawn.t -= dt;
        if (respawn.t <= 0) { place(respawn.at.x, respawn.at.y); respawn = null; Audio.sfx('sting'); }
        return;
      }
      if (world.fade > 0.05) return;
      if (stagger > 0) { stagger -= dt; prima.pose = 'reach'; return; }
      prima.update(dt, world.room, p);
      if (prima.catches(p)) finish('caught');
    };
  });
}

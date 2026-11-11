// A room instance: tiles, visible objects (flag-aware), doors and collision.
import { isSolidChar } from './maps.js';

export const TS = 16;

export class Room {
  constructor(def, getFlag = () => false) {
    this.def = def;
    this.id = def.id;
    this.rows = def.rows;
    this.w = def.rows[0].length;
    this.h = def.rows.length;
    this.getFlag = getFlag;
  }

  tile(tx, ty) {
    if (ty < 0 || ty >= this.h || tx < 0 || tx >= this.w) return '#';
    return this.rows[ty][tx];
  }

  visible(o) {
    if (o.hideIf && this.getFlag(o.hideIf)) return false;
    if (o.showIf && !this.getFlag(o.showIf)) return false;
    return true;
  }

  objects() { return this.def.objects.filter((o) => this.visible(o)); }

  covers(o, tx, ty) {
    return tx >= o.x && tx < o.x + (o.w || 1) && ty >= o.y && ty < o.y + (o.h || 1);
  }

  objectsAt(tx, ty) { return this.objects().filter((o) => this.covers(o, tx, ty) && !o.mirrorOnly); }

  // The topmost visible object at a tile that has an event (mirror-only items included: you reach for them).
  objectAt(tx, ty) {
    const list = this.objects().filter((o) => this.covers(o, tx, ty) && o.event);
    return list[list.length - 1] || null;
  }

  doorAt(tx, ty) { return this.def.doors.find((d) => d.x === tx && d.y === ty) || null; }

  doorLocked(d) { return !!d.lock && !this.getFlag(d.lock); }

  isSolid(tx, ty) {
    const ch = this.tile(tx, ty);
    if (isSolidChar(ch)) return true;
    const d = this.doorAt(tx, ty);
    if (d && this.doorLocked(d)) return true;
    return this.objects().some((o) => o.solid && !o.wall && this.covers(o, tx, ty));
  }

  isSolidPx(x, y) { return this.isSolid(Math.floor(x / TS), Math.floor(y / TS)); }
}

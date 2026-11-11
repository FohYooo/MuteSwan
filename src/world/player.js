// Mira (or any walking actor). x, y are the feet centre in room pixels.
import { TS } from './room.js';

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const CYCLE = [1, 0, 2, 0];

export class Walker {
  constructor(sprite = 'mira') {
    this.sprite = sprite;
    this.x = 0; this.y = 0;
    this.dir = 'down';
    this.anim = 0;
    this.moving = false;
  }

  place(tx, ty, dir = this.dir) {
    this.x = tx * TS + 8;
    this.y = ty * TS + 14;
    this.dir = dir;
  }

  get tx() { return Math.floor(this.x / TS); }
  get ty() { return Math.floor((this.y - 3) / TS); }
  get frame() { return this.moving ? CYCLE[Math.floor(this.anim) % 4] : 0; }

  step(dt, moving) {
    this.moving = moving;
    if (moving) this.anim += dt * 7; else this.anim = 0;
  }
}

export class Player extends Walker {
  constructor() {
    super('mira');
    this.reflects = false; // Mira has no reflection: she drowned
    this.walkSpeed = 1.4;
    this.runSpeed = 2.3;
    this.canRun = false;
    this.frozen = false;
    this.halfW = 5;
    this.footH = 6;
    this.stepTimer = 0;
  }

  blocked(room, x, y) {
    const l = x - this.halfW, r = x + this.halfW - 1, t = y - this.footH, b = y - 1;
    return room.isSolidPx(l, t) || room.isSolidPx(r, t) || room.isSolidPx(l, b) || room.isSolidPx(r, b);
  }

  // Returns {pushTile: [tx, ty] | null, moved}
  update(dt, input, room) {
    if (this.frozen) { this.step(dt, false); return { pushTile: null, moved: false }; }
    let ix = 0, iy = 0;
    if (input.down('left')) ix -= 1;
    if (input.down('right')) ix += 1;
    if (input.down('up')) iy -= 1;
    if (input.down('down')) iy += 1;
    if (!ix && !iy) { this.step(dt, false); return { pushTile: null, moved: false }; }
    if (iy && (!ix || this.dir === 'up' || this.dir === 'down')) this.dir = iy < 0 ? 'up' : 'down';
    if (ix && (!iy || this.dir === 'left' || this.dir === 'right')) this.dir = ix < 0 ? 'left' : 'right';
    const running = this.canRun && input.down('run');
    let sp = (running ? this.runSpeed : this.walkSpeed) * 60 * dt;
    if (ix && iy) sp *= 0.7071;
    let pushTile = null;
    this.pushAlt = null;
    let moved = false;
    const nx = this.x + ix * sp;
    if (ix && !this.blocked(room, nx, this.y)) { this.x = nx; moved = true; } else if (ix) {
      pushTile = [Math.floor((this.x + ix * (this.halfW + 2)) / TS), Math.floor((this.y - 3) / TS)];
    }
    const ny = this.y + iy * sp;
    if (iy && !this.blocked(room, this.x, ny)) { this.y = ny; moved = true; } else if (iy) {
      const ty = Math.floor((this.y - 3 + iy * (this.footH + 2)) / TS);
      // the centre first, then either edge of her feet: doors are one tile wide
      pushTile = [Math.floor(this.x / TS), ty];
      this.pushAlt = [[Math.floor((this.x - this.halfW) / TS), ty], [Math.floor((this.x + this.halfW - 1) / TS), ty]];
    }
    this.step(dt * (running ? 1.6 : 1), moved);
    return { pushTile, moved, running };
  }

  facingTile() {
    const [dx, dy] = DIRS[this.dir];
    return [Math.floor((this.x + dx * 12) / TS), Math.floor((this.y - 4 + dy * 12) / TS)];
  }
}

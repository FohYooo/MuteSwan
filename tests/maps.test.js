import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROOMS, SOLID, isSolidChar } from '../src/world/maps.js';

const IDS = ['dorm', 'corridor', 'rehearsal', 'costume', 'office', 'bath', 'theatre', 'lake'];

function footprint(o) {
  const out = [];
  for (let dy = 0; dy < (o.h || 1); dy++) for (let dx = 0; dx < (o.w || 1); dx++) out.push([o.x + dx, o.y + dy]);
  return out;
}

function blockedSet(room) {
  const s = new Set();
  for (const o of room.objects) if (o.solid) for (const [x, y] of footprint(o)) s.add(`${x},${y}`);
  return s;
}

function walkable(room, x, y, blocked) {
  if (y < 0 || y >= room.rows.length || x < 0 || x >= room.rows[0].length) return false;
  return !isSolidChar(room.rows[y][x]) && !blocked.has(`${x},${y}`);
}

test('all eight rooms exist', () => {
  assert.deepEqual(Object.keys(ROOMS).sort(), [...IDS].sort());
});

test('every room has rows of equal width', () => {
  for (const r of Object.values(ROOMS)) {
    const w = r.rows[0].length;
    r.rows.forEach((row, i) => assert.equal(row.length, w, `${r.id} row ${i}`));
    assert.ok(r.rows.length >= 9, `${r.id} too short`);
  }
});

test('every door leads to an existing room and spawn', () => {
  for (const r of Object.values(ROOMS)) {
    for (const d of r.doors) {
      assert.ok(ROOMS[d.to], `${r.id} door to ${d.to}`);
      assert.ok(ROOMS[d.to].spawns[d.spawn], `${r.id} -> ${d.to}.${d.spawn}`);
    }
  }
});

test('spawns stand on free floor', () => {
  for (const r of Object.values(ROOMS)) {
    const blocked = blockedSet(r);
    for (const [name, s] of Object.entries(r.spawns)) assert.ok(walkable(r, s.x, s.y, blocked), `${r.id}.${name} at ${s.x},${s.y}`);
  }
});

test('floor objects sit on walkable tiles and wall objects on walls', () => {
  for (const r of Object.values(ROOMS)) {
    for (const o of r.objects) {
      for (const [x, y] of footprint(o)) {
        const ch = r.rows[y]?.[x];
        assert.ok(ch !== undefined, `${r.id}.${o.id} out of bounds`);
        if (o.wall) assert.ok(isSolidChar(ch), `${r.id}.${o.id} wall object on floor '${ch}'`);
        else assert.ok(!isSolidChar(ch), `${r.id}.${o.id} on solid '${ch}' at ${x},${y}`);
      }
    }
  }
});

test('from every spawn the player can reach every door of the room', () => {
  for (const r of Object.values(ROOMS)) {
    const blocked = blockedSet(r);
    for (const [name, s] of Object.entries(r.spawns)) {
      const seen = new Set([`${s.x},${s.y}`]);
      const q = [[s.x, s.y]];
      while (q.length) {
        const [x, y] = q.shift();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = `${x + dx},${y + dy}`;
          if (!seen.has(k) && walkable(r, x + dx, y + dy, blocked)) { seen.add(k); q.push([x + dx, y + dy]); }
        }
      }
      for (const d of r.doors) {
        const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${d.x + dx},${d.y + dy}`));
        assert.ok(near, `${r.id}: spawn ${name} cannot reach door to ${d.to} at ${d.x},${d.y}`);
      }
    }
  }
});

test('solid tile set includes walls and water', () => {
  for (const ch of ['#', '=', '|', '+', 'M', '~', 'O']) assert.ok(SOLID.includes(ch));
  for (const ch of ['.', ',', '_', '*', ':', 'S', 'D', 'v']) assert.ok(!SOLID.includes(ch));
});

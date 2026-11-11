import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bfsPath } from '../src/world/prima.js';

function gridSolid(rows) {
  return (x, y) => y < 0 || y >= rows.length || x < 0 || x >= rows[0].length || rows[y][x] === '#';
}

test('bfsPath walks around an L-shaped wall in 7 steps', () => {
  const rows = ['...', '##.', '...'];
  const p = bfsPath(gridSolid(rows), 3, 3, { x: 0, y: 2 }, { x: 0, y: 0 });
  assert.equal(p.length, 7);
  assert.deepEqual(p[0], { x: 0, y: 2 });
  assert.deepEqual(p[6], { x: 0, y: 0 });
});

test('bfsPath returns null when walled off', () => {
  const rows = ['...', '###', '...'];
  assert.equal(bfsPath(gridSolid(rows), 3, 3, { x: 0, y: 2 }, { x: 0, y: 0 }), null);
});

test('bfsPath from a tile to itself is just that tile', () => {
  assert.deepEqual(bfsPath(gridSolid(['...']), 3, 1, { x: 1, y: 0 }, { x: 1, y: 0 }), [{ x: 1, y: 0 }]);
});

test('bfsPath can end on a solid target tile (the player stands where she reaches)', () => {
  const rows = ['.#'];
  const p = bfsPath(gridSolid(rows), 2, 1, { x: 0, y: 0 }, { x: 1, y: 0 });
  assert.deepEqual(p, [{ x: 0, y: 0 }, { x: 1, y: 0 }]);
});

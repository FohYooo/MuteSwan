import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepLoop } from '../src/core/loop.js';

test('loop clamps dt to 50ms', () => {
  let n = 0;
  let st = { acc: 0, last: 0 };
  st = stepLoop(st, 16.7, () => n++);
  n = 0;
  st = stepLoop(st, 16.7 + 10000, () => n++);
  assert.ok(n <= 3, `expected at most 3 updates, got ${n}`);
});

test('steady 16.7ms frames give one update each', () => {
  let n = 0;
  let st = { acc: 0, last: 0 };
  let t = 0;
  for (let i = 0; i < 60; i++) { t += 1000 / 60; st = stepLoop(st, t, () => n++); }
  assert.ok(n >= 59 && n <= 60, `got ${n}`);
});

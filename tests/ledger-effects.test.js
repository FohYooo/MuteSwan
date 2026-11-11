import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step, press, clearScenes } from './helpers/keys.js';
import { write } from '../src/ui/notebook.js';
import { candleStyle } from '../src/story/ledger.js';
import { adjustThresholds } from '../src/voice/challenges.js';
import { Prima } from '../src/world/prima.js';

test('a struck-out notebook line cannot be chosen', async () => {
  clearScenes();
  let r = null;
  write([{ text: 'Stop her.', struck: true }, { text: 'Come with me.' }]).then((v) => { r = v; });
  await step(30);
  await press('ArrowUp'); // tries to move onto the struck line
  await press('KeyZ');
  await step(90);
  assert.equal(r, 1);
});

test('a blank page can only be closed', async () => {
  clearScenes();
  let r = null;
  write([{ text: ' ', blank: true }]).then((v) => { r = v; });
  await step(30);
  await press('KeyZ');
  await step(90);
  assert.equal(r, 0);
});

test('the candle shows the ledger: redder with devotion, smaller and bluer with distance', () => {
  const base = candleStyle({ dev: 0, dist: 0, performing: false });
  assert.equal(base.r, 72);
  const dev = candleStyle({ dev: 1, dist: 0, performing: false });
  assert.notEqual(dev.color, base.color);
  assert.equal(dev.r, 72);
  const dist = candleStyle({ dev: 0, dist: 1, performing: false });
  assert.equal(dist.r, 54);
  assert.ok(dist.ambientShift < 0);
});

test('distance tier 2 makes yells need 4 dB more', () => {
  assert.deepEqual(adjustThresholds({ shoutDb: -18, quietDb: -52 }, 4), { shoutDb: -14, quietDb: -52 });
  assert.deepEqual(adjustThresholds({ shoutDb: -18, quietDb: -52 }, 0), { shoutDb: -18, quietDb: -52 });
});

test('devotion tier 2 makes the Prima 8% faster', () => {
  assert.ok(Math.abs(new Prima(1.08).speed - 1.9 * 1.08) < 1e-9);
  assert.equal(new Prima().speed, 1.9);
});

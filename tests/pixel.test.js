import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeRows } from '../src/gfx/pixel.js';

test('decodeRows maps palette chars to rgba and dots to transparent', () => {
  const img = decodeRows(['k.', '.w']);
  assert.equal(img.w, 2);
  assert.equal(img.h, 2);
  assert.deepEqual([...img.rgba.slice(0, 4)], [11, 10, 12, 255]);
  assert.equal(img.rgba[7], 0);
  assert.deepEqual([...img.rgba.slice(12, 16)], [232, 225, 211, 255]);
});

test('decodeRows throws on an unknown sprite char', () => {
  assert.throws(() => decodeRows(['kZ']), /unknown sprite char/);
});

test('decodeRows pads short rows with transparency', () => {
  const img = decodeRows(['kk', 'k']);
  assert.equal(img.w, 2);
  assert.equal(img.rgba[15], 0);
});

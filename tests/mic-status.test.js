import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVoice } from '../src/voice/mic.js';

const reject = (name) => () => Promise.reject(Object.assign(new Error(name), { name }));

test('voice status falls back to keys when getUserMedia rejects', async () => {
  const v = createVoice();
  assert.deepEqual(await v.init({ getUserMedia: reject('NotAllowedError') }), { mic: 'denied' });
  assert.equal(v.status.mic, 'denied');
  const v2 = createVoice();
  assert.deepEqual(await v2.init({ getUserMedia: reject('NotFoundError') }), { mic: 'none' });
});

test('voice init without any mediaDevices reports none', async () => {
  const v = createVoice();
  assert.deepEqual(await v.init({ getUserMedia: null }), { mic: 'none' });
});

test('recognizer load failure reports words:failed', async () => {
  const v = createVoice();
  await v.loadWords('missing.tar.gz', { createModel: () => Promise.reject(new Error('404')) });
  assert.equal(v.status.words, 'failed');
});

test('fake words and frames reach subscribers', async () => {
  const v = createVoice();
  const words = [];
  const frames = [];
  v.onWord((w) => words.push(w.word));
  const off = v.onFrame((f) => frames.push(f));
  v.fake.word('run');
  await v.fake.level(-5, 60, true, { instant: true });
  off();
  await v.fake.level(-5, 60, true, { instant: true });
  assert.deepEqual(words, ['run']);
  assert.equal(frames.length, 3);
  assert.equal(frames[0].db, -5);
  assert.equal(frames[0].voiced, true);
});

test('instant fake frames are spaced exactly 20 ms apart across calls', async () => {
  const v = createVoice();
  const ts = [];
  v.onFrame((f) => ts.push(f.t));
  await v.fake.level(-5, 20, true, { instant: true });
  await v.fake.level(-5, 40, true, { instant: true });
  assert.deepEqual(ts.slice(1).map((t, i) => t - ts[i]), [20, 20]);
});

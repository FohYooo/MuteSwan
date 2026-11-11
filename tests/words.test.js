import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffWords } from '../src/voice/words.js';

test('diffWords emits each new word once as partial results grow', () => {
  let r = diffWords({ run: 0, no: 0 }, 'run run');
  assert.deepEqual(r.words, ['run', 'run']);
  r = diffWords(r.counts, 'run run run');
  assert.deepEqual(r.words, ['run']);
  r = diffWords(r.counts, '[unk] no');
  assert.deepEqual(r.words, ['no']);
});

test('diffWords does not re-emit when a partial hypothesis shrinks and regrows', () => {
  let r = diffWords({ run: 0, no: 0 }, 'run run');
  r = diffWords(r.counts, 'run');
  assert.deepEqual(r.words, []);
  r = diffWords(r.counts, 'run run');
  assert.deepEqual(r.words, []);
});

test('diffWords ignores other words and empty text', () => {
  assert.deepEqual(diffWords({ run: 0, no: 0 }, '').words, []);
  assert.deepEqual(diffWords({ run: 0, no: 0 }, '[unk] [unk]').words, []);
});

test('the vosk script resolves from the module, not the page', async () => {
  const { VOSK_SRC } = await import('../src/voice/words.js');
  const root = new URL('../', import.meta.url).href;
  assert.equal(VOSK_SRC, root + 'vendor/vosk.js');
});

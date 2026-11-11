import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createChallenge } from '../src/voice/challenge-core.js';

const TH = { shoutDb: -18, quietDb: -52 };

// Advance a challenge by ms, feeding mic frames at the given level every 20 ms.
function run(ch, ms, db = null, voiced = true) {
  for (let t = 0; t < ms; t += 20) {
    if (db !== null) ch.frame({ t: ch.clock(), db, voiced });
    ch.tick(20);
  }
}

function typeRun(ch) { for (const c of 'run') ch.key(c); }

test('freeze is won by typing run three times', () => {
  const ch = createChallenge({ kind: 'freeze', windowMs: 5000, thresholds: TH, mode: 'normal', wordsAvailable: true, input: 'keys' });
  typeRun(ch); run(ch, 300); typeRun(ch); run(ch, 300); typeRun(ch); run(ch, 20);
  assert.equal(ch.state().marks, 3);
  assert.equal(ch.state().result, 'win');
});

test('freeze with only two runs is lost when time runs out', () => {
  const ch = createChallenge({ kind: 'freeze', windowMs: 5000, thresholds: TH, mode: 'normal', wordsAvailable: true, input: 'keys' });
  typeRun(ch); typeRun(ch);
  run(ch, 5100);
  assert.equal(ch.state().marks, 2);
  assert.equal(ch.state().result, 'lose');
});

test('freeze is won by three shouted runs from the mic', () => {
  const ch = createChallenge({ kind: 'freeze', windowMs: 5000, thresholds: TH, mode: 'normal', wordsAvailable: true, input: 'mic' });
  for (let i = 0; i < 3; i++) { run(ch, 200, -50); run(ch, 200, -8); ch.word('run'); }
  run(ch, 200, -50);
  assert.equal(ch.state().result, 'win');
});

test('challenge timer ignores time while paused', () => {
  const ch = createChallenge({ kind: 'freeze', windowMs: 5000, thresholds: TH, mode: 'normal', wordsAvailable: true, input: 'mic' });
  const before = ch.state().timeLeft;
  for (let i = 0; i < 500; i++) ch.frame({ t: i * 20, db: -60, voiced: false }); // 10 s of frames, no ticks
  assert.equal(ch.state().timeLeft, before);
  assert.equal(ch.state().result, null);
});

test('hush is survived by 8 s of silence', () => {
  const ch = createChallenge({ kind: 'hush', windowMs: 8000, thresholds: TH, mode: 'normal', wordsAvailable: true, input: 'mic' });
  run(ch, 8100, TH.quietDb - 10, false);
  assert.equal(ch.state().result, 'win');
});

test('hush is lost to a 1.5 s noise', () => {
  const ch = createChallenge({ kind: 'hush', windowMs: 8000, thresholds: TH, mode: 'normal', wordsAvailable: true, input: 'mic' });
  run(ch, 1000, TH.quietDb - 10, false);
  run(ch, 1500, -10, true);
  assert.equal(ch.state().result, 'lose');
});

test('hush on the keyboard: holding Space the whole time survives', () => {
  const ch = createChallenge({ kind: 'hush', windowMs: 8000, thresholds: TH, mode: 'normal', wordsAvailable: true, input: 'keys' });
  ch.key('space-down');
  run(ch, 8100);
  assert.equal(ch.state().result, 'win');
});

test('hush on the keyboard: never holding your breath gives you away', () => {
  const ch = createChallenge({ kind: 'hush', windowMs: 8000, thresholds: TH, mode: 'normal', wordsAvailable: true, input: 'keys' });
  run(ch, 8100);
  assert.equal(ch.state().result, 'lose');
});

test('noo on the keyboard: N held and O tapped every 200 ms for 5.2 s wins', () => {
  const ch = createChallenge({ kind: 'noo', windowMs: 14000, thresholds: TH, mode: 'normal', wordsAvailable: true, input: 'keys' });
  ch.key('N-down');
  for (let t = 0; t < 5200; t += 200) { ch.key('O'); run(ch, 200); }
  assert.equal(ch.state().result, 'win');
});

test('noo on the keyboard: tapping O every 400 ms is not a scream', () => {
  const ch = createChallenge({ kind: 'noo', windowMs: 14000, thresholds: TH, mode: 'normal', wordsAvailable: true, input: 'keys' });
  ch.key('N-down');
  for (let t = 0; t < 14200; t += 400) { ch.key('O'); run(ch, 400); }
  assert.equal(ch.state().result, 'lose');
});

test('noo from the mic needs no word when words are unavailable', () => {
  const ch = createChallenge({ kind: 'noo', windowMs: 14000, thresholds: TH, mode: 'normal', wordsAvailable: false, input: 'mic' });
  run(ch, 5200, -10, true);
  assert.equal(ch.state().result, 'win');
});

test('noo from the mic with words needs the word no', () => {
  const ch = createChallenge({ kind: 'noo', windowMs: 14000, thresholds: TH, mode: 'normal', wordsAvailable: true, input: 'mic' });
  run(ch, 300, -10, true);
  ch.word('no');
  run(ch, 5000, -10, true);
  assert.equal(ch.state().result, 'win');
});

test('a finished challenge does not change its result', () => {
  const ch = createChallenge({ kind: 'freeze', windowMs: 1000, thresholds: TH, mode: 'off', wordsAvailable: false, input: 'keys' });
  run(ch, 1100);
  assert.equal(ch.state().result, 'lose');
  typeRun(ch); typeRun(ch); typeRun(ch);
  assert.equal(ch.state().result, 'lose');
});

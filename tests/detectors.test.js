import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveThresholds, createShoutDetector, createRunMarks, createSustainMeter,
  createQuietMeter, pitchOf, createTypedRun,
} from '../src/voice/detectors.js';

// [[durationMs, db, voiced], ...] -> 20 ms frames starting at t = 0
function frames(spec) {
  const out = [];
  let t = 0;
  for (const [ms, db, voiced = true] of spec) {
    for (let i = 0; i < ms / 20; i++) { out.push({ t, db, voiced }); t += 20; }
  }
  return out;
}

test('deriveThresholds puts the shout line 60% of the way from speech to yell', () => {
  assert.deepEqual(deriveThresholds({ floorDb: -60, speechDb: -30, yellDb: -10 }), { shoutDb: -18, quietDb: -52 });
});

test('deriveThresholds clamps to floor+15', () => {
  const t = deriveThresholds({ floorDb: -40, speechDb: -36, yellDb: -34 });
  assert.equal(t.shoutDb, -25);
  assert.equal(t.quietDb, -32);
});

test('shout detector finds three separated shouts', () => {
  const d = createShoutDetector({ shoutDb: -18 });
  const fr = frames([[200, -50], [200, -10], [200, -50], [200, -10], [200, -50], [200, -10], [200, -50]]);
  const events = fr.map((f) => d.push(f)).filter(Boolean);
  assert.equal(events.length, 3);
  assert.equal(events[0].t1 - events[0].t0, 200);
});

test('shout detector ignores a 60 ms blip', () => {
  const d = createShoutDetector({ shoutDb: -18 });
  const events = frames([[100, -50], [60, -10], [300, -50]]).map((f) => d.push(f)).filter(Boolean);
  assert.equal(events.length, 0);
});

test('shout detector ignores a 1200 ms shout', () => {
  const d = createShoutDetector({ shoutDb: -18 });
  const events = frames([[100, -50], [1200, -10], [300, -50]]).map((f) => d.push(f)).filter(Boolean);
  assert.equal(events.length, 0);
});

test('runMarks with words unavailable counts shouts only', () => {
  const m = createRunMarks({ mode: 'normal', wordsAvailable: false });
  m.addShout(); m.addShout(); m.addShout();
  assert.equal(m.marks(), 3);
});

test('runMarks normal mode needs two of three shouts recognized as run', () => {
  const m = createRunMarks({ mode: 'normal', wordsAvailable: true });
  m.addShout(); m.addShout(); m.addShout();
  m.addWord('run');
  assert.equal(m.marks(), 2);
  m.addWord('run');
  assert.equal(m.marks(), 3);
});

test('runMarks strict mode needs every shout recognized', () => {
  const m = createRunMarks({ mode: 'strict', wordsAvailable: true });
  m.addShout(); m.addShout(); m.addShout();
  m.addWord('run'); m.addWord('run');
  assert.equal(m.marks(), 2);
});

test('runMarks off mode counts shouts and caps at three', () => {
  const m = createRunMarks({ mode: 'off', wordsAvailable: true });
  for (let i = 0; i < 5; i++) m.addShout();
  assert.equal(m.marks(), 3);
});

test('runMarks never counts the word no', () => {
  const m = createRunMarks({ mode: 'strict', wordsAvailable: true });
  m.addShout(); m.addShout();
  m.addWord('no'); m.addWord('no');
  assert.equal(m.marks(), 0);
});

test('sustain meter fills after 5 s of continuous scream', () => {
  const s = createSustainMeter({ shoutDb: -18, needWord: false });
  frames([[5000, -10]]).forEach((f) => s.push(f));
  assert.ok(s.value() >= 0.99, String(s.value()));
});

test('sustain meter forgives a 200 ms breath', () => {
  const s = createSustainMeter({ shoutDb: -18, needWord: false });
  frames([[2000, -10], [200, -50], [3000, -10]]).forEach((f) => s.push(f));
  assert.ok(s.value() >= 0.99, String(s.value()));
});

test('sustain meter drains after a 600 ms silence', () => {
  const s = createSustainMeter({ shoutDb: -18, needWord: false });
  frames([[2000, -10], [600, -50], [3000, -10]]).forEach((f) => s.push(f));
  assert.ok(s.value() < 0.99, String(s.value()));
});

test('sustain meter with needWord stays empty without the word', () => {
  const s = createSustainMeter({ shoutDb: -18, needWord: true });
  frames([[5000, -10]]).forEach((f) => s.push(f));
  assert.equal(s.value(), 0);
});

test('sustain meter credits the scream retroactively once no is heard', () => {
  const s = createSustainMeter({ shoutDb: -18, needWord: true });
  frames([[5000, -10]]).forEach((f, i) => { s.push(f); if (i === 20) s.addWord('no'); });
  assert.ok(s.value() >= 0.99, String(s.value()));
});

test('sustain meter ignores loud unvoiced noise', () => {
  const s = createSustainMeter({ shoutDb: -18, needWord: false });
  frames([[5000, -10, false]]).forEach((f) => s.push(f));
  assert.equal(s.value(), 0);
});

test('quiet meter fills on noise above quietDb', () => {
  const q = createQuietMeter({ quietDb: -52 });
  frames([[1200, -47]]).forEach((f) => q.push(f));
  assert.equal(q.value(), 1);
});

test('quiet meter stays empty below quietDb', () => {
  const q = createQuietMeter({ quietDb: -52 });
  frames([[1200, -57]]).forEach((f) => q.push(f));
  assert.equal(q.value(), 0);
});

test('pitchOf finds 220 Hz in a sine', () => {
  const sr = 48000;
  const x = new Float32Array(2048);
  for (let i = 0; i < x.length; i++) x[i] = Math.sin((2 * Math.PI * 220 * i) / sr) * 0.5;
  const p = pitchOf(x, sr);
  assert.ok(Math.abs(p.hz - 220) < 5, `hz ${p.hz}`);
  assert.ok(p.confidence > 0.8, `conf ${p.confidence}`);
});

test('pitchOf reports low confidence on white noise', () => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const x = new Float32Array(2048).map(() => rnd() * 0.5);
  assert.ok(pitchOf(x, 48000).confidence < 0.5);
});

test('pitchOf on silence is unvoiced', () => {
  assert.equal(pitchOf(new Float32Array(2048), 48000).confidence, 0);
});

test('typed run counter counts run sequences case-insensitively', () => {
  const r = createTypedRun();
  let n = 0;
  for (const ch of 'rurunxrunRUN') n = r.push(ch);
  assert.equal(n, 3);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, give, has, take, Store } from '../src/story/state.js';
import { createLedger } from '../src/story/ledger.js';

function memStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

test('createState starts in the dormitory with nothing', () => {
  const s = createState();
  assert.deepEqual(s, { flags: {}, ledger: createLedger(), inv: [], windowLooks: 0, room: 'dorm', spawn: 'bed' });
});

test('inventory give/has/take without duplicates', () => {
  const s = createState();
  give(s, 'candle'); give(s, 'candle');
  assert.deepEqual(s.inv, ['candle']);
  assert.ok(has(s, 'candle'));
  take(s, 'candle');
  assert.ok(!has(s, 'candle'));
});

test('a save round-trip keeps flags, bond and inventory', () => {
  const st = Store(memStorage());
  const s = createState();
  s.flags.read_note = true; s.ledger.devotion = 3; give(s, 'lighter'); s.room = 'office'; s.spawn = 'door';
  st.saveCheckpoint(s);
  const back = st.loadCheckpoint();
  assert.deepEqual(back, s);
  assert.notEqual(back, s);
});

test('loadCheckpoint returns null on malformed JSON', () => {
  const mem = memStorage();
  mem.setItem('muteswan.checkpoint', '{not json');
  assert.equal(Store(mem).loadCheckpoint(), null);
});

test('loadCheckpoint returns null on a save with the wrong shape', () => {
  const mem = memStorage();
  mem.setItem('muteswan.checkpoint', JSON.stringify({ room: 'nowhere', flags: 5 }));
  assert.equal(Store(mem).loadCheckpoint(), null);
});

test('a throwing storage never throws and gives defaults', () => {
  const bad = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } };
  const st = Store(bad);
  assert.doesNotThrow(() => st.saveCheckpoint(createState()));
  assert.equal(st.loadCheckpoint(), null);
  assert.equal(st.loadSettings().voiceCheck, 'normal');
  assert.deepEqual(st.endingsSeen(), []);
  assert.doesNotThrow(() => st.recordEnding('thaw'));
});

test('missing storage gives defaults', () => {
  const st = Store(undefined);
  assert.equal(st.loadCheckpoint(), null);
  assert.equal(st.loadSettings().volume, 0.8);
});

test('settings merge saved values over defaults', () => {
  const st = Store(memStorage());
  st.saveSettings({ voiceCheck: 'strict', calib: { shoutDb: -20, quietDb: -50 } });
  const s = st.loadSettings();
  assert.equal(s.voiceCheck, 'strict');
  assert.equal(s.keyboardMode, false);
  assert.deepEqual(s.calib, { shoutDb: -20, quietDb: -50 });
});

test('endings and wrong ends are recorded once each', () => {
  const st = Store(memStorage());
  st.recordEnding('thaw'); st.recordEnding('thaw'); st.recordEnding('swan_song');
  assert.deepEqual(st.endingsSeen(), ['thaw', 'swan_song']);
  st.recordWrongEnd('caught');
  assert.deepEqual(st.wrongEndsSeen(), ['caught']);
});

test('an old save without a ledger loads with an empty one', () => {
  const mem = { m: new Map(), getItem(k) { return this.m.get(k) ?? null; }, setItem(k, v) { this.m.set(k, v); }, removeItem() {} };
  mem.setItem('muteswan.checkpoint', JSON.stringify({ flags: {}, bond: 2, inv: [], room: 'dorm', spawn: 'bed' }));
  assert.deepEqual(Store(mem).loadCheckpoint().ledger, createLedger());
});

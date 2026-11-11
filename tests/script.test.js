import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROOMS } from '../src/world/maps.js';
import { EVENTS, ON_ENTER } from '../src/story/script.js';
import { L } from '../src/story/lines.js';
import { createLedger, addDevotion, addDistance, effectiveTiers } from '../src/story/ledger.js';

function stub({ dev = 0, dist = 0, writes = [0], noo = true, runFor = true, flags = {} } = {}) {
  const calls = [];
  const ledger = createLedger();
  addDevotion(ledger, dev); addDistance(ledger, dist);
  const state = { flags: { ...flags }, ledger, inv: [], windowLooks: 0, room: 'lake', spawn: 'shore' };
  let w = 0;
  const S = {
    calls, state,
    flag(n, v) { if (v !== undefined) state.flags[n] = v; return !!state.flags[n]; },
    has: (i) => state.inv.includes(i), give: (i) => state.inv.push(i), take() {},
    care(tag, n = 1) { if (tag === 'dev') addDevotion(ledger, n); else addDistance(ledger, n); },
    tiers: () => effectiveTiers(ledger),
    async say() {}, async lines() {}, async wait() {},
    writes: [],
    async write(options) { S.writes.push(options); return writes[Math.min(w++, writes.length - 1)]; },
    async choose() { return 0; },
    async noo() { calls.push('noo'); return noo; },
    async runFor() { calls.push('runFor'); return runFor; },
    async freeze() { return true; }, async hush() { return true; },
    async play(id) { calls.push(`play:${id}`); },
    async wrong(id) { calls.push(`wrong:${id}`); },
    async ending(id) { calls.push(`ending:${id}`); },
    addActor() { return {}; }, async walk() {}, remove() {}, async walkPlayer() {}, hidePlayer() {},
    music() {}, sfx() {}, checkpoint() {}, fx() {}, async chase() { return 'escaped'; }, goto() {},
  };
  return S;
}

test('every event referenced by a room exists', () => {
  for (const r of Object.values(ROOMS)) {
    const ids = [...r.objects.map((o) => o.event).filter(Boolean), ...Object.values(r.tileEvents || {})];
    for (const id of ids) assert.equal(typeof EVENTS[id], 'function', `${r.id}: missing event ${id}`);
  }
});

test('every room has an on-enter script', () => {
  for (const id of Object.keys(ROOMS)) assert.equal(typeof ON_ENTER[id], 'function', id);
});

test('every L.key used by the script exists in lines.js', () => {
  const src = readFileSync(new URL('../src/story/script.js', import.meta.url), 'utf8');
  const keys = [...src.matchAll(/\bL\.([A-Za-z0-9_]+)/g)].map((m) => m[1]);
  assert.ok(keys.length > 40, `only ${keys.length} line keys found`);
  for (const k of keys) assert.ok(k in L, `lines.js has no ${k}`);
});

test('finale: stop her, scream, run, more devotion -> Swan Song', async () => {
  const S = stub({ dev: 8, dist: 2, writes: [0] });
  await EVENTS.finale(S);
  assert.deepEqual(S.calls.filter((c) => c.startsWith('ending')), ['ending:swan_song']);
  assert.ok(S.calls.includes('noo') && S.calls.includes('runFor'));
});

test('finale: the scream fails -> Pas de Deux, and no run challenge', async () => {
  const S = stub({ dev: 8, dist: 2, writes: [0], noo: false });
  await EVENTS.finale(S);
  assert.deepEqual(S.calls.filter((c) => c.startsWith('ending')), ['ending:pas_de_deux']);
  assert.ok(!S.calls.includes('runFor'));
});

test('finale: come with me -> Pas de Deux without any challenge', async () => {
  const S = stub({ dev: 8, dist: 2, writes: [1] });
  await EVENTS.finale(S);
  assert.deepEqual(S.calls.filter((c) => c.startsWith('ending')), ['ending:pas_de_deux']);
  assert.ok(!S.calls.includes('noo'));
});

test('finale: success with more distance -> Thaw', async () => {
  const S = stub({ dev: 2, dist: 8, writes: [0] });
  await EVENTS.finale(S);
  assert.deepEqual(S.calls.filter((c) => c.startsWith('ending')), ['ending:thaw']);
});

test('finale: the run fails after the scream -> Pas de Deux', async () => {
  const S = stub({ dev: 8, dist: 2, writes: [0], runFor: false });
  await EVENTS.finale(S);
  assert.deepEqual(S.calls.filter((c) => c.startsWith('ending')), ['ending:pas_de_deux']);
});

test('the third look out of the corridor window is a Wrong End', async () => {
  const S = stub();
  await EVENTS.corridor_window(S);
  await EVENTS.corridor_window(S);
  assert.deepEqual(S.calls, ['play:window1', 'play:window2']);
  await EVENTS.corridor_window(S);
  assert.ok(S.calls.includes('wrong:look_away'));
});

test('reaching into the bubbling bath is a Wrong End', async () => {
  const S = stub();
  S.choose = async () => 0;
  await EVENTS.tub_bubble(S);
  assert.ok(S.calls.includes('wrong:black_water'));
});

test('the rehearsal talk offers tagged notebook choices (caring, middle, cold)', async () => {
  const S = stub({ writes: [0, 0] });
  await EVENTS.rehearsal_talk(S);
  assert.equal(S.writes.length, 2);
  for (const opts of S.writes) assert.deepEqual(opts.map((o) => o.tag), ['dev', 'mid', 'dist']);
});

test('finale: distance tier 4 leaves the page blank and ends Hollow', async () => {
  const S = stub({ dist: 12, writes: [0] });
  await EVENTS.finale(S);
  assert.deepEqual(S.calls.filter((c) => c.startsWith('ending')), ['ending:hollow']);
  assert.ok(S.writes[0][0].blank);
  assert.ok(!S.calls.includes('noo'));
});

test('finale: devotion tier 4 strikes out Stop her', async () => {
  const S = stub({ dev: 12, writes: [1] });
  await EVENTS.finale(S);
  assert.equal(S.writes[0][0].struck, true);
  assert.deepEqual(S.calls.filter((c) => c.startsWith('ending')), ['ending:pas_de_deux']);
});

test('reading her things and closing the dead girl\'s eyes is devotion', async () => {
  const S = stub();
  await EVENTS.vesna_bed(S);
  await EVENTS.diary(S, { obj: { page: 2 } });
  S.choose = async () => 0;
  await EVENTS.tub_corpse(S);
  assert.equal(S.state.ledger.devotion, 3);
  assert.equal(S.state.flags.diary_2, true);
});

test('line lists never start with a bare speaker name (a spoken line must be nested)', () => {
  const SPEAKERS = ['Vesna', 'Madame', 'The Prima'];
  const NESTED = ['empty_beds', 'diary']; // lists of line lists
  const SKIP = ['tier_dev', 'tier_dist']; // toast strings indexed by tier
  const lists = Object.entries(L)
    .filter(([k, v]) => Array.isArray(v) && !k.endsWith('_choice') && !k.endsWith('_choice2') && !k.endsWith('_q') && !SKIP.includes(k))
    .flatMap(([k, v]) => (NESTED.includes(k) ? v.map((sub, i) => [`${k}[${i}]`, sub]) : [[k, v]]));
  for (const [k, v] of lists) {
    v.forEach((item, i) => {
      assert.ok(!(typeof item === 'string' && SPEAKERS.includes(item)), `L.${k}[${i}] is a bare speaker name`);
      if (Array.isArray(item)) assert.ok(item.length === 2 && SPEAKERS.includes(item[0]), `L.${k}[${i}] is not [speaker, text]`);
    });
  }
});

test('a cancelled chase stops the scene without marking an escape', async () => {
  const S = stub();
  S.chase = async () => 'cancelled';
  await EVENTS.scare1(S);
  assert.ok(!S.state.flags.chase1_escaped);
  const S2 = stub();
  S2.chase = async () => 'cancelled';
  await EVENTS.scare2(S2);
  assert.ok(!S2.state.flags.chase2_done);
});

test('after each chase the room fades in before anyone speaks', async () => {
  for (const [ev, first] of [['scare1', L.hide], ['scare2', L.theatre_first]]) {
    const S = stub();
    const order = [];
    S.fadeIn = async () => { order.push('fadeIn'); };
    S.lines = async (arr) => { if (arr === first) order.push('first-lines'); };
    await EVENTS[ev](S);
    assert.ok(order.indexOf('fadeIn') >= 0 && order.indexOf('fadeIn') < order.indexOf('first-lines'), `${ev}: ${order.join(',')}`);
  }
});

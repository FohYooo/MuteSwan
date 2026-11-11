import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createLedger, recordChoice, addDevotion, addDistance, tier, isPerforming, effectiveTiers,
  tickIdle, tickLinger, compareVoice, chooseEnding,
} from '../src/story/ledger.js';

test('a new ledger is empty and at tier 0', () => {
  const L = createLedger();
  assert.equal(L.devotion, 0);
  assert.equal(L.distance, 0);
  assert.deepEqual(effectiveTiers(L), { dev: 0, dist: 0, performing: false });
});

test('tiers start at 3, 6, 9 and 12', () => {
  assert.deepEqual([0, 2, 3, 5, 6, 9, 11, 12, 30].map(tier), [0, 0, 1, 1, 2, 3, 3, 4, 4]);
});

test('caring and cold notebook lines add 2, the middle line adds 1 to both', () => {
  const L = createLedger();
  recordChoice(L, 'dev');
  recordChoice(L, 'dist');
  recordChoice(L, 'mid');
  assert.equal(L.devotion, 3);
  assert.equal(L.distance, 3);
});

test('doing nothing is a choice: 20 s idle adds 1 distance', () => {
  const L = createLedger();
  tickIdle(L, 19000);
  assert.equal(L.distance, 0);
  tickIdle(L, 2000);
  assert.equal(L.distance, 1);
  tickIdle(L, 40000);
  assert.equal(L.distance, 3);
});

test('lingering near her adds devotion every 6 s, at most 2 per room', () => {
  const L = createLedger();
  tickLinger(L, 'rehearsal', 6000);
  assert.equal(L.devotion, 1);
  tickLinger(L, 'rehearsal', 60000);
  assert.equal(L.devotion, 2);
  tickLinger(L, 'bath', 6000);
  assert.equal(L.devotion, 3);
});

test('screaming louder for her than for yourself is devotion; quieter is distance', () => {
  const a = createLedger();
  compareVoice(a, -12, -6);
  assert.equal(a.devotion, 2);
  const b = createLedger();
  compareVoice(b, -6, -14);
  assert.equal(b.distance, 2);
  const c = createLedger();
  compareVoice(c, -8, -7);
  assert.equal(c.devotion + c.distance, 0);
});

test('balancing the meters is performing', () => {
  const L = createLedger();
  addDevotion(L, 4); addDistance(L, 3);
  assert.equal(isPerforming(L), true);
  const M = createLedger();
  addDevotion(M, 2); addDistance(M, 2);
  assert.equal(isPerforming(M), false, 'too little played to judge');
  const N = createLedger();
  addDevotion(N, 9); addDistance(N, 3);
  assert.equal(isPerforming(N), false);
});

test('alternating caring and cold three times in a row is performing', () => {
  const L = createLedger();
  recordChoice(L, 'dev'); recordChoice(L, 'dist'); recordChoice(L, 'dev');
  assert.equal(isPerforming(L), true);
});

test('performing halves both tiers, rounded up', () => {
  const L = createLedger();
  addDevotion(L, 9); addDistance(L, 8);
  assert.deepEqual(effectiveTiers(L), { dev: 2, dist: 1, performing: true });
});

test('endings: distance tier 4 is Hollow', () => {
  const L = createLedger(); addDistance(L, 12); addDevotion(L, 2);
  assert.equal(chooseEnding({ finaleWon: true, choseComeWithMe: false, ledger: L }), 'hollow');
});
test('endings: devotion tier 4 is Pas de Deux even after a won finale', () => {
  const L = createLedger(); addDevotion(L, 12); addDistance(L, 1);
  assert.equal(chooseEnding({ finaleWon: true, choseComeWithMe: false, ledger: L }), 'pas_de_deux');
});
test('endings: come with me or a failed finale is Pas de Deux', () => {
  const L = createLedger(); addDevotion(L, 5);
  assert.equal(chooseEnding({ finaleWon: true, choseComeWithMe: true, ledger: L }), 'pas_de_deux');
  assert.equal(chooseEnding({ finaleWon: false, choseComeWithMe: false, ledger: L }), 'pas_de_deux');
});
test('endings: a won finale is Swan Song with more devotion, else Thaw', () => {
  const A = createLedger(); addDevotion(A, 8); addDistance(A, 2);
  assert.equal(chooseEnding({ finaleWon: true, choseComeWithMe: false, ledger: A }), 'swan_song');
  const B = createLedger(); addDevotion(B, 2); addDistance(B, 8);
  assert.equal(chooseEnding({ finaleWon: true, choseComeWithMe: false, ledger: B }), 'thaw');
});
test('endings: a performer at distance 12 is halved and does not get Hollow', () => {
  const L = createLedger(); addDistance(L, 12); addDevotion(L, 11);
  assert.notEqual(chooseEnding({ finaleWon: true, choseComeWithMe: false, ledger: L }), 'hollow');
});

test('the ledger survives JSON (it lives in the save)', () => {
  const L = createLedger(); recordChoice(L, 'dev'); tickLinger(L, 'bath', 6000); tickIdle(L, 25000);
  const back = JSON.parse(JSON.stringify(L));
  assert.deepEqual(effectiveTiers(back), effectiveTiers(L));
  tickLinger(back, 'bath', 60000);
  assert.equal(back.devotion, L.devotion + 1);
});

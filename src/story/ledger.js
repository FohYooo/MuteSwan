// The Ledger: a hidden "performance of empathy". Devotion (caring) and Distance (not caring)
// each escalate into punishments; trying to balance them is "performing" and is punished too.
// Pure and JSON-serializable: it lives in the save.

export const TIERS = [3, 6, 9, 12];
const IDLE_MS = 20000;
const LINGER_MS = 6000;
const LINGER_CAP = 2;
const VOICE_DB = 3;

export function createLedger() {
  return { devotion: 0, distance: 0, idleMs: 0, linger: {}, lastSide: null, flips: 0, alternated: false };
}

export function tier(v) { return TIERS.filter((t) => v >= t).length; }

export function addDevotion(L, n = 1) { L.devotion += n; }
export function addDistance(L, n = 1) { L.distance += n; }

// tag: 'dev' (tender / possessive), 'dist' (cold / blank), 'mid' (the careful middle)
export function recordChoice(L, tag) {
  if (tag === 'dev') addDevotion(L, 2);
  else if (tag === 'dist') addDistance(L, 2);
  else if (tag === 'mid') { addDevotion(L, 1); addDistance(L, 1); }
  if (tag === 'dev' || tag === 'dist') {
    L.flips = L.lastSide && L.lastSide !== tag ? L.flips + 1 : 0;
    L.lastSide = tag;
    if (L.flips >= 2) L.alternated = true; // dev, dist, dev: three in a row
  }
}

export function tickIdle(L, ms) {
  L.idleMs += ms;
  while (L.idleMs >= IDLE_MS) { L.idleMs -= IDLE_MS; addDistance(L, 1); }
}

export function tickLinger(L, roomId, ms) {
  const r = (L.linger[roomId] = L.linger[roomId] || { ms: 0, count: 0 });
  if (r.count >= LINGER_CAP) return;
  r.ms += ms;
  while (r.ms >= LINGER_MS && r.count < LINGER_CAP) { r.ms -= LINGER_MS; r.count++; addDevotion(L, 1); }
}

// Peak loudness (dB) or speed when yelling for yourself vs for her.
export function compareVoice(L, self, her) {
  const d = her - self;
  if (d >= VOICE_DB) addDevotion(L, 2);
  else if (d <= -VOICE_DB) addDistance(L, 2);
}

export function isPerforming(L) {
  if (L.alternated) return true;
  return L.devotion + L.distance >= 6 && Math.abs(L.devotion - L.distance) <= 2;
}

export function effectiveTiers(L) {
  const performing = isPerforming(L);
  const half = (t) => (performing ? Math.ceil(t / 2) : t);
  return { dev: half(tier(L.devotion)), dist: half(tier(L.distance)), performing };
}

export function chooseEnding({ finaleWon, choseComeWithMe, ledger }) {
  const t = effectiveTiers(ledger);
  if (t.dist >= 4) return 'hollow';
  if (t.dev >= 4 || choseComeWithMe || !finaleWon) return 'pas_de_deux';
  return ledger.devotion > ledger.distance ? 'swan_song' : 'thaw';
}

// What the candle shows instead of a meter.
export function candleStyle({ dev, dist }) {
  let color = '#f0b45a';
  if (dev >= 1) color = '#f08060';            // burns redder the more she is wanted
  if (dist >= 1) color = dev >= 1 ? '#d9a0b0' : '#b8c8e8'; // bluer the less
  return { r: dist >= 1 ? 54 : 72, color, ambientShift: dist >= 1 ? -0.03 : 0 };
}

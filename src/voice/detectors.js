// Pure voice detectors. Frames: {t: ms, db: dBFS, voiced: boolean}, normally every 20 ms.
// No DOM access here: everything is unit-tested in Node.

const FRAME_MS = 20;

function frameDt(state, t) {
  const dt = state.lastT == null ? FRAME_MS : Math.max(0, Math.min(t - state.lastT, 100));
  state.lastT = t;
  return dt || FRAME_MS;
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function deriveThresholds({ floorDb, speechDb, yellDb }) {
  const shoutDb = Math.max(speechDb + 0.6 * (yellDb - speechDb), floorDb + 15);
  return { shoutDb: Math.round(shoutDb * 10) / 10, quietDb: floorDb + 8 };
}

// Emits {t0, t1} when a shout ends; shouts must last startMs..maxMs.
export function createShoutDetector({ shoutDb, startMs = 80, endMs = 90, maxMs = 900 }) {
  const st = { lastT: null, aboveMs: 0, aboveT0: 0, inShout: false, belowMs: 0, belowT0: 0, t0: 0 };
  return {
    push(f) {
      const dt = frameDt(st, f.t);
      const loud = f.db >= shoutDb;
      if (!st.inShout) {
        if (loud) {
          if (st.aboveMs === 0) st.aboveT0 = f.t;
          st.aboveMs += dt;
          if (st.aboveMs >= startMs) { st.inShout = true; st.t0 = st.aboveT0; st.belowMs = 0; }
        } else st.aboveMs = 0;
        return null;
      }
      if (loud) { st.belowMs = 0; return null; }
      if (st.belowMs === 0) st.belowT0 = f.t;
      st.belowMs += dt;
      if (st.belowMs < endMs) return null;
      st.inShout = false;
      st.aboveMs = 0;
      const dur = st.belowT0 - st.t0;
      return dur >= startMs && dur <= maxMs ? { t0: st.t0, t1: st.belowT0 } : null;
    },
  };
}

// Combines shouts and recognized words into 0..3 RUN marks.
export function createRunMarks({ mode = 'normal', wordsAvailable = true }) {
  let shouts = 0;
  let runs = 0;
  return {
    addShout() { shouts++; },
    addWord(w) { if (w === 'run') runs++; },
    setWordsAvailable(v) { wordsAvailable = v; },
    shouts: () => shouts,
    runs: () => runs,
    marks() {
      let m;
      if (mode === 'off' || !wordsAvailable) m = shouts;
      else if (mode === 'strict') m = Math.min(shouts, runs);
      else m = Math.min(shouts, runs + 1);
      return Math.min(3, m);
    },
  };
}

// The NOOOOO bar: fills while continuously loud and voiced; forgives dips < graceMs.
export function createSustainMeter({ shoutDb, fillMs = 5000, graceMs = 250, drainMult = 2, needWord = true }) {
  const st = { lastT: null, value: 0, pending: 0, inScream: false, quietMs: 0, wordSeen: false, lastWordT: -1e9, t: 0 };
  return {
    push(f) {
      const dt = frameDt(st, f.t);
      st.t = f.t;
      const loud = f.db >= shoutDb && f.voiced;
      if (loud) {
        if (!st.inScream) {
          st.inScream = true;
          st.pending = 0;
          st.wordSeen = !needWord || f.t - st.lastWordT <= 500;
        }
        st.quietMs = 0;
        const inc = dt / fillMs;
        if (st.wordSeen) st.value = clamp01(st.value + inc);
        else st.pending = Math.min(1 - st.value, st.pending + inc);
        return;
      }
      if (st.inScream) {
        st.quietMs += dt;
        if (st.quietMs < graceMs) return;
        st.inScream = false;
        st.pending = 0;
      }
      st.value = clamp01(st.value - (dt * drainMult) / fillMs);
    },
    addWord(w) {
      if (w !== 'no') return;
      st.lastWordT = st.t;
      if (st.inScream && !st.wordSeen) {
        st.wordSeen = true;
        st.value = clamp01(st.value + st.pending);
        st.pending = 0;
      }
    },
    value: () => st.value,
    pending: () => st.pending,
    screaming: () => st.inScream,
  };
}

// HUSH: noise bar that fills above quietDb.
export function createQuietMeter({ quietDb, fillMs = 1200, drainMs = 2000 }) {
  const st = { lastT: null, value: 0 };
  return {
    push(f) {
      const dt = frameDt(st, f.t);
      st.value = clamp01(st.value + (f.db > quietDb ? dt / fillMs : -dt / drainMs));
    },
    value: () => st.value,
  };
}

// Normalized autocorrelation pitch estimate over 80–1000 Hz, on a ~16 kHz decimated copy.
export function pitchOf(samples, sampleRate) {
  const factor = Math.max(1, Math.floor(sampleRate / 16000));
  const sr = sampleRate / factor;
  const n = Math.floor(samples.length / factor);
  const x = new Float32Array(n);
  let energy = 0;
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < factor; j++) s += samples[i * factor + j];
    x[i] = s / factor;
    energy += x[i] * x[i];
  }
  if (energy < 1e-8) return { hz: 0, confidence: 0 };
  const minLag = Math.floor(sr / 1000);
  const maxLag = Math.min(Math.ceil(sr / 80), n - 32);
  const r = new Float32Array(maxLag + 2);
  let best = 0;
  for (let lag = minLag; lag <= maxLag + 1; lag++) {
    let num = 0, ea = 0, eb = 0;
    for (let i = 0; i + lag < n; i++) {
      const a = x[i], b = x[i + lag];
      num += a * b; ea += a * a; eb += b * b;
    }
    r[lag] = ea > 0 && eb > 0 ? num / Math.sqrt(ea * eb) : 0;
    if (lag <= maxLag && r[lag] > best) best = r[lag];
  }
  if (best <= 0) return { hz: 0, confidence: 0 };
  // first local peak that reaches 90% of the best: avoids octave errors
  let pick = -1;
  for (let lag = minLag + 1; lag <= maxLag; lag++) {
    if (r[lag] >= 0.9 * best && r[lag] >= r[lag - 1] && r[lag] >= r[lag + 1]) { pick = lag; break; }
  }
  if (pick < 0) return { hz: 0, confidence: 0 };
  const a = r[pick - 1], b = r[pick], c = r[pick + 1];
  const den = a - 2 * b + c;
  const shift = den !== 0 ? (0.5 * (a - c)) / den : 0;
  return { hz: sr / (pick + shift), confidence: Math.max(0, b) };
}

// Keyboard fallback: counts how many times "run" has been typed in order.
export function createTypedRun() {
  const word = 'run';
  let idx = 0;
  let count = 0;
  return {
    push(ch) {
      const c = String(ch).toLowerCase();
      if (c === word[idx]) idx++;
      else idx = c === word[0] ? 1 : 0;
      if (idx === word.length) { count++; idx = 0; }
      return count;
    },
    count: () => count,
  };
}

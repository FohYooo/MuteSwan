// Pure logic for the voice challenges. Time only advances through tick(), so a paused
// game (no ticks) can never lose a challenge. Mic frames and keyboard input feed the
// same detectors.
import { createShoutDetector, createRunMarks, createSustainMeter, createQuietMeter, createTypedRun } from './detectors.js';

const BREATH_MS = 9000;
const HUSH_GRACE_MS = 1000;
const TAP_MS = 250;

export function createChallenge({ kind, windowMs, thresholds, mode = 'normal', wordsAvailable = true, input = 'mic' }) {
  const { shoutDb, quietDb } = thresholds;
  const keys = input === 'keys';
  let elapsed = 0;
  let result = null;

  // freeze / runfor
  const shouts = createShoutDetector({ shoutDb });
  const marks = createRunMarks({ mode, wordsAvailable });
  const typed = createTypedRun();
  let typedCount = 0;
  // hush
  const quiet = createQuietMeter({ quietDb });
  let holding = false;
  let breath = BREATH_MS;
  let burst = 0;
  // noo
  const needWord = mode !== 'off' && wordsAvailable;
  const sustain = createSustainMeter({ shoutDb, needWord: keys ? true : needWord, graceMs: keys ? 0 : 250 });
  let nHeld = false;
  let lastO = -1e9;
  let wasScreaming = false;

  const isRun = kind === 'freeze' || kind === 'runfor';
  const progress = () => (isRun ? marks.marks() / 3 : kind === 'hush' ? quiet.value() : sustain.value());

  function settle() {
    if (result) return;
    if (isRun && marks.marks() >= 3) result = 'win';
    else if (kind === 'hush' && quiet.value() >= 1) result = 'lose';
    else if (kind === 'noo' && sustain.value() >= 0.999) result = 'win';
    else if (elapsed >= windowMs) result = kind === 'hush' ? 'win' : 'lose';
  }

  return {
    clock: () => elapsed,

    frame(f) {
      if (result || keys && kind !== 'freeze' && kind !== 'runfor') return;
      if (isRun) { if (shouts.push(f)) marks.addShout(); }
      else if (kind === 'hush') quiet.push(f);
      else if (kind === 'noo') sustain.push(f);
      settle();
    },

    word(w) {
      if (result) return;
      if (isRun) marks.addWord(w);
      else if (kind === 'noo' && !keys) sustain.addWord(w);
      settle();
    },

    key(k) {
      if (result) return;
      if (isRun && typeof k === 'string' && k.length === 1) {
        const n = typed.push(k);
        if (n > typedCount) { typedCount = n; marks.addShout(); marks.addWord('run'); }
      }
      if (kind === 'hush') {
        if (k === 'space-down' && breath > 0) holding = true;
        if (k === 'space-up' && holding) { holding = false; if (windowMs - elapsed > 1500) burst = 400; }
      }
      if (kind === 'noo') {
        if (k === 'N-down') nHeld = true;
        if (k === 'N-up') nHeld = false;
        if (k === 'O') lastO = elapsed; // a real key press; typed 'o' (incl. auto-repeat) does not count
      }
      settle();
    },

    tick(dt) {
      if (result) return;
      elapsed += dt;
      if (keys && kind === 'hush') {
        if (holding) { breath -= dt; if (breath <= 0) { holding = false; burst = 400; } }
        const safeEnd = windowMs - elapsed <= 1500; // she is gone: breathing again is safe
        const noisy = burst > 0 || (!holding && elapsed > HUSH_GRACE_MS && !safeEnd);
        burst = Math.max(0, burst - dt);
        quiet.push({ t: elapsed, db: noisy ? quietDb + 10 : quietDb - 20, voiced: false });
      }
      if (keys && kind === 'noo') {
        const screaming = nHeld && elapsed - lastO <= TAP_MS;
        if (screaming && !wasScreaming) sustain.push({ t: elapsed, db: shoutDb + 10, voiced: true });
        if (screaming && !wasScreaming) sustain.addWord('no');
        else sustain.push({ t: elapsed, db: screaming ? shoutDb + 10 : -60, voiced: screaming });
        wasScreaming = screaming;
      }
      settle();
    },

    state() {
      return {
        kind,
        result,
        progress: progress(),
        marks: isRun ? marks.marks() : undefined,
        pending: kind === 'noo' ? sustain.pending() : 0,
        screaming: kind === 'noo' ? (keys ? wasScreaming : sustain.screaming()) : false,
        holding,
        breath: breath / BREATH_MS,
        timeLeft: Math.max(0, windowMs - elapsed),
        windowMs,
      };
    },
  };
}

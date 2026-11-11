// Fixed 60 Hz update with a clamped frame gap (Global Constraints: dt ≤ 50 ms).
export const MAX_GAP_MS = 50;

let lastReport = 0;
function reportError(e) {
  const now = Date.now();
  if (now - lastReport > 1000) { lastReport = now; console.error(e); }
}

export function stepLoop(state, now, update, stepMs = 1000 / 60) {
  const gap = Math.min(Math.max(now - state.last, 0), MAX_GAP_MS);
  let acc = state.acc + gap;
  while (acc >= stepMs) {
    // one bad frame must never stop the game
    try { update(stepMs / 1000); } catch (e) { reportError(e); }
    acc -= stepMs;
  }
  return { acc, last: now };
}

export function startLoop({ update, draw }) {
  let st = { acc: 0, last: performance.now() };
  function frame(now) {
    st = stepLoop(st, now, update);
    try { draw(); } catch (e) { reportError(e); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

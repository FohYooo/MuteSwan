// Monkey test (browser): open ?mute=1&debug=1&start=<preset>, then: const r = await (await import("/tests/monkey.js")).default(120, 1)
export default async function monkey(seconds = 120, seed = 1) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const w = MS.runner.world;
  const KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyZ', 'Space', 'KeyX', 'Tab', 'ShiftLeft', 'Enter'];
  const held = new Set();
  const report = { locks: [], rooms: new Set(), wrongEnds: 0, frames: 0 };
  let stuck = 0;
  const isModal = () => MS.Scenes.top() !== w;
  const snap = () => ({ room: w.room?.id, busy: w.busy, fade: +w.fade.toFixed(2), chasing: w.chasing, transitioning: w.transitioning, top: isModal() ? 'modal' : 'world', stack: MS.Scenes.stack.length, flags: Object.keys(MS.runner.state.flags).length });
  for (let f = 0; f < seconds * 10; f++) {
    if (!MS.Scenes.stack.includes(w)) { report.ended = true; break; }
    // menus that can end the run (Wrong End card, pause menu) only get the default: Try again / Resume
    const topSrc = isModal() ? String(MS.Scenes.top().update) : '';
    if (topSrc.includes('options[sel]') || topSrc.includes('this.close(sel)')) {
      for (const h of held) { MS.up(h); held.delete(h); }
      await MS.press('KeyZ', 0.05); await MS.play(0.3); report.frames++;
      continue;
    }
    // random input: mostly movement, sometimes action keys, sometimes typing run
    const r = rnd();
    if (r < 0.5) {
      const k = KEYS[Math.floor(rnd() * 4)];
      for (const h of held) if (h.startsWith('Arrow')) { MS.up(h); held.delete(h); }
      MS.down(k); held.add(k);
    } else if (r < 0.75) {
      const k = KEYS[4 + Math.floor(rnd() * 6)];
      if (held.has(k)) { MS.up(k); held.delete(k); } else { MS.down(k); held.add(k); if (k !== 'ShiftLeft' && k !== 'Space') { await MS.play(1 / 60); MS.up(k); held.delete(k); } }
    } else if (r < 0.8) {
      await MS.typeA('run');
    }
    await MS.play(0.1);
    report.frames++;
    if (w.room) report.rooms.add(w.room.id);
    // a soft lock: the world is on top, nothing is chasing, but the player cannot act for a long time
    const locked = !isModal() && !w.canAct() && !w.chasing && !w.player.walk && !w.actors.some((a) => a.walk);
    stuck = locked ? stuck + 1 : 0;
    if (stuck === 150) report.locks.push(snap()); // 15 s of game time
  }
  for (const h of held) MS.up(h);
  report.rooms = [...report.rooms];
  report.wrongEnds = MS.store.wrongEndsSeen().length;
  return report;
}

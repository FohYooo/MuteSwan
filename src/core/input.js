// Keyboard input. Actions are polled per update step; endFrame() clears edges.
const BINDINGS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  run: ['ShiftLeft', 'ShiftRight'],
  ok: ['KeyZ', 'Enter', 'Space'],
  back: ['KeyX', 'Escape', 'Backspace'],
  inv: ['Tab', 'KeyI'],
  space: ['Space'],
};

const held = new Set();
const pressedKeys = new Set();
const releasedKeys = new Set();

export const Input = {
  typed: [],
  down(a) { return BINDINGS[a].some((k) => held.has(k)); },
  pressed(a) { return BINDINGS[a].some((k) => pressedKeys.has(k)); },
  key(code) { return held.has(code); },
  keyPressed(code) { return pressedKeys.has(code); },
  keyReleased(code) { return releasedKeys.has(code); },
  anyPressed() { return pressedKeys.size > 0; },
  endFrame() { pressedKeys.clear(); releasedKeys.clear(); this.typed.length = 0; },
  clear() { held.clear(); this.endFrame(); },
  attach(target = window) {
    target.addEventListener('keydown', (e) => {
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace'].includes(e.code)) e.preventDefault();
      if (!e.repeat) { held.add(e.code); pressedKeys.add(e.code); }
      if (!e.repeat && e.key && e.key.length === 1) this.typed.push(e.key.toLowerCase());
    });
    target.addEventListener('keyup', (e) => { held.delete(e.code); releasedKeys.add(e.code); });
    target.addEventListener('blur', () => held.clear());
  },
};

// Drives the real Input + Scenes in Node: key events go to an EventTarget the Input listens on.
import { Input } from '../../src/core/input.js';
import { Scenes } from '../../src/core/scenes.js';

const target = new EventTarget();
Input.attach(target);

export function key(code, type, extra = {}) {
  const e = new Event(type);
  Object.assign(e, { code, key: extra.key ?? (code.startsWith('Key') ? code.slice(3).toLowerCase() : code), repeat: false, preventDefault() {}, ...extra });
  target.dispatchEvent(e);
}
export async function step(n = 1) {
  for (let i = 0; i < n; i++) { Scenes.update(1 / 60); Input.endFrame(); for (let k = 0; k < 6; k++) await null; }
}
export async function press(code) { key(code, 'keydown'); await step(1); key(code, 'keyup'); await step(1); }
export function clearScenes() { while (Scenes.stack.length) Scenes.pop(); Input.clear(); }

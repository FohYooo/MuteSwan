// Scene stack. draw(ctx, ui): ctx is the 320x180 pixel layer, ui the hi-res text layer (same virtual coords).
// modal scenes stop the ones below from updating; opaque scenes stop them drawing.
const stack = [];

export const Scenes = {
  stack,
  push(s) { stack.push(s); s.onPush?.(); return s; },
  pop(s) {
    const i = s ? stack.lastIndexOf(s) : stack.length - 1;
    if (i < 0) return null;
    const [out] = stack.splice(i, 1);
    out.onPop?.();
    return out;
  },
  replace(s) { while (stack.length) this.pop(); return this.push(s); },
  top() { return stack[stack.length - 1] || null; },
  update(dt) {
    const list = [];
    for (let i = stack.length - 1; i >= 0; i--) {
      list.push(stack[i]);
      if (stack[i].modal) break;
    }
    for (const s of list) s.update?.(dt);
  },
  draw(ctx, ui) {
    let start = 0;
    for (let i = stack.length - 1; i >= 0; i--) { if (stack[i].opaque) { start = i; break; } }
    for (let i = start; i < stack.length; i++) stack[i].draw?.(ctx, ui);
  },
};

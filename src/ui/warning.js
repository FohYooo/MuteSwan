// Content warning, shown once per launch before the title.
import { Input } from '../core/input.js';
import { Font } from '../gfx/font.js';
import { PAL } from '../gfx/palette.js';
import { modal } from './common.js';

export function warning() {
  let t = 0;
  return modal({
    opaque: true,
    update(dt) { t += dt; if (t > 1 && (Input.pressed('ok') || Input.pressed('back'))) this.close(); },
    draw(ctx, ui) {
      ctx.fillStyle = PAL.ink; ctx.fillRect(0, 0, 320, 180);
      const a = Math.min(1, t / 0.8);
      Font.draw(ui, 'Before you go in', 160, 26, { size: 10, font: 'title', align: 'center', color: PAL.bright, alpha: a, spacing: 1 });
      Font.draw(ui, 'MUTE SWAN is a horror game for adults. It contains death, drowning, gore, suicidal intent, swearing and smoking.', 160, 52,
        { size: 7, align: 'center', wrap: 250, color: PAL.bone, alpha: a, lineH: 10 });
      Font.draw(ui, 'It listens to your microphone. At times you will have to yell, and at times you must be silent. Your voice is processed on this computer and never leaves it.', 160, 88,
        { size: 7, align: 'center', wrap: 250, color: PAL.frost, alpha: a, lineH: 10 });
      Font.draw(ui, 'No microphone? Every moment can be played with the keyboard.', 160, 128,
        { size: 6, italic: true, align: 'center', wrap: 250, color: PAL.grey, alpha: a });
      if (t > 1) Font.draw(ui, 'press Z or Enter', 160, 156, { size: 6, align: 'center', color: PAL.candle, alpha: 0.5 + Math.sin(t * 3) * 0.4 });
    },
  });
}

// A four-dial combination lock.
import { Input } from '../core/input.js';
import { Font } from '../gfx/font.js';
import { PAL } from '../gfx/palette.js';
import { Audio } from '../audio/synth.js';
import { modal, panel } from './common.js';

export function codepad(n = 4) {
  const d = new Array(n).fill(0);
  let i = 0;
  let t = 0;
  return modal({
    update(dt) {
      t += dt;
      if (Input.pressed('left')) i = (i + n - 1) % n;
      if (Input.pressed('right')) i = (i + 1) % n;
      if (Input.pressed('up')) { d[i] = (d[i] + 1) % 10; Audio.sfx('click_pointe'); }
      if (Input.pressed('down')) { d[i] = (d[i] + 9) % 10; Audio.sfx('click_pointe'); }
      for (const ch of Input.typed) if (/[0-9]/.test(ch)) { d[i] = Number(ch); i = Math.min(n - 1, i + 1); Audio.sfx('click_pointe'); }
      if (Input.pressed('ok')) this.close(d.join(''));
      if (Input.pressed('back')) this.close(null);
    },
    draw(ctx, ui) {
      panel(ui, 90, 50, 140, 80, { alpha: 0.95 });
      Font.draw(ui, 'The safe', 160, 56, { size: 7, font: 'title', align: 'center', color: PAL.frost, spacing: 1 });
      d.forEach((v, k) => {
        const x = 118 + k * 28;
        ui.fillStyle = k === i ? PAL.shade : PAL.ink;
        ui.fillRect(x - 9, 74, 18, 24);
        ui.strokeStyle = k === i ? PAL.candle : PAL.grey; ui.lineWidth = 0.6; ui.strokeRect(x - 9, 74, 18, 24);
        Font.draw(ui, String(v), x, 78, { size: 13, font: 'title', align: 'center', color: PAL.bone });
      });
      Font.draw(ui, '←→ dial   ↑↓ or digits   Z open   X leave', 160, 114, { size: 4.5, align: 'center', color: PAL.grey, shadow: false });
    },
  });
}

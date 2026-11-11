// The satchel: what Mira carries, with one line each.
import { Input } from '../core/input.js';
import { Font } from '../gfx/font.js';
import { PAL } from '../gfx/palette.js';
import { SPRITES } from '../gfx/sprites.js';
import { Audio } from '../audio/synth.js';
import { modal, panel, cursor } from './common.js';

// items: [{id, name, desc, sprite}]
export function openInventory(items) {
  let sel = 0;
  let t = 0;
  Audio.sfx('page');
  return modal({
    update(dt) {
      t += dt;
      if (items.length) {
        if (Input.pressed('up')) sel = (sel + items.length - 1) % items.length;
        if (Input.pressed('down')) sel = (sel + 1) % items.length;
      }
      if (Input.pressed('back') || Input.pressed('inv') || Input.pressed('ok')) this.close();
    },
    draw(ctx, ui) {
      panel(ui, 40, 24, 240, 132);
      Font.draw(ui, 'What Mira carries', 160, 31, { size: 7, font: 'title', align: 'center', color: PAL.frost, spacing: 0.5 });
      if (!items.length) Font.draw(ui, 'Nothing. Her hands are empty and cold.', 160, 80, { size: 6.5, italic: true, align: 'center', color: PAL.grey });
      items.forEach((it, i) => {
        const y = 46 + i * 12;
        if (i === sel) cursor(ui, 50, y + 1.5, t);
        Font.draw(ui, it.name, 58, y, { size: 6.5, color: i === sel ? PAL.bone : PAL.grey });
      });
      const it = items[sel];
      if (it) {
        ui.save();
        ui.imageSmoothingEnabled = false;
        const s = SPRITES[it.sprite];
        const img = Array.isArray(s) ? s[0] : s;
        if (img) ui.drawImage(img, 196, 48, img.width * 2, img.height * 2);
        ui.restore();
        Font.draw(ui, it.desc, 160, 124, { size: 6, italic: true, wrap: 220, align: 'center', color: PAL.frost });
      }
      Font.draw(ui, 'Tab / X to close', 160, 147, { size: 4.5, align: 'center', color: PAL.grey, shadow: false });
    },
  });
}

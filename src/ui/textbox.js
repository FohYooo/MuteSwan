// say(): typewriter dialogue box. choose(): plain menu.
import { Input } from '../core/input.js';
import { Font } from '../gfx/font.js';
import { PAL } from '../gfx/palette.js';
import { Audio } from '../audio/synth.js';
import { modal, panel, cursor, SPEAKER_COLORS } from './common.js';

const CPS = 40;

export function say(speaker, text, { pos = 'bottom', auto = 0 } = {}) {
  let shown = 0;
  let t = 0;
  let done = false;
  return modal({
    update(dt) {
      t += dt;
      if (!done) {
        shown = Math.min(text.length, shown + dt * CPS);
        if (shown >= text.length) { done = true; t = 0; }
      }
      if (auto && done && t >= auto) { this.close(); return; }
      if (Input.pressed('ok') || Input.pressed('back')) {
        if (!done) { shown = text.length; done = true; t = 0; } else { Audio.sfx('page'); this.close(); }
      }
    },
    draw(ctx, ui) {
      const x = 10, w = 300, h = 46;
      const y = pos === 'top' ? 8 : pos === 'center' ? 67 : 126;
      panel(ui, x, y, w, h);
      const narr = !speaker;
      if (speaker) {
        const nw = Font.measure(ui, speaker, { size: 6.5, font: 'title' }) + 12;
        panel(ui, x + 6, y - 9, nw, 11, { alpha: 0.95 });
        Font.draw(ui, speaker, x + 12, y - 7, { size: 6.5, font: 'title', color: SPEAKER_COLORS[speaker] || PAL.candle, spacing: 0.4 });
      }
      Font.draw(ui, text.slice(0, Math.floor(shown)), x + 10, y + 8, {
        size: 7.2, wrap: w - 20, lineH: 9.4, italic: narr, color: narr ? PAL.frost : PAL.bone,
      });
      if (done) cursor(ui, x + w - 12, y + h - 9, t);
    },
  });
}

export function choose(options, { prompt = null } = {}) {
  let sel = 0;
  let t = 0;
  return modal({
    update(dt) {
      t += dt;
      if (Input.pressed('up')) { sel = (sel + options.length - 1) % options.length; Audio.sfx('click_pointe'); }
      if (Input.pressed('down')) { sel = (sel + 1) % options.length; Audio.sfx('click_pointe'); }
      if (Input.pressed('ok')) { Audio.sfx('page'); this.close(sel); }
    },
    draw(ctx, ui) {
      const lineH = 11;
      const h = options.length * lineH + 14 + (prompt ? 12 : 0);
      const w = 180, x = 70, y = 170 - h;
      panel(ui, x, y, w, h);
      let yy = y + 8;
      if (prompt) { Font.draw(ui, prompt, x + 10, yy, { size: 6.5, italic: true, color: PAL.frost, wrap: w - 20 }); yy += 12; }
      options.forEach((o, i) => {
        if (i === sel) cursor(ui, x + 8, yy + 1.6, t);
        Font.draw(ui, o, x + 15, yy, { size: 7, color: i === sel ? PAL.bone : PAL.grey });
        yy += lineH;
      });
    },
  });
}

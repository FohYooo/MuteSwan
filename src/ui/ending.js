// Endings: the ending's shadow play, its title card, and the credits.
import { Input } from '../core/input.js';
import { Font } from '../gfx/font.js';
import { PAL } from '../gfx/palette.js';
import { shadowplay } from '../cutscene/plays.js';
import { modal } from './common.js';

export const ENDINGS = {
  swan_song: { n: 1, title: 'SWAN SONG' },
  thaw: { n: 2, title: 'THAW' },
  pas_de_deux: { n: 3, title: 'PAS DE DEUX' },
  hollow: { n: 4, title: 'HOLLOW' },
};

const CREDITS = [
  ['MUTE SWAN', 'title'],
  ['Made by Foh', ''],
  ['a little help from Claude', 'small'],
  ['', ''],
  ['Swan Lake theme — P. I. Tchaikovsky, 1876', 'small'],
  ['Speech recognition — Vosk / vosk-browser (Apache 2.0)', 'small'],
  ['Desktop shell — Electron (MIT)', 'small'],
  ['', ''],
  ['Thank you for being her voice.', 'italic'],
];

export async function ending(id) {
  const e = ENDINGS[id];
  await shadowplay(id);
  let t = 0;
  return modal({
    opaque: true,
    update(dt) { t += dt; if (t > 4 && Input.pressed('ok')) this.close(); },
    draw(ctx, ui) {
      ctx.fillStyle = PAL.ink; ctx.fillRect(0, 0, 320, 180);
      const a = Math.min(1, t / 1.5);
      Font.draw(ui, `Ending ${e.n} / 4`, 160, 22, { size: 6, align: 'center', color: PAL.grey, alpha: a, spacing: 1 });
      Font.draw(ui, e.title, 160, 32, { size: 20, font: 'title', align: 'center', color: PAL.bone, alpha: a, spacing: 3 });
      let y = 72;
      CREDITS.forEach(([line, style], i) => {
        const la = Math.min(1, Math.max(0, t - 1.5 - i * 0.35));
        Font.draw(ui, line, 160, y, { size: style === 'title' ? 9 : style === 'small' ? 5.5 : 7, font: style === 'title' ? 'title' : 'serif', italic: style === 'italic', align: 'center', color: style === 'small' ? PAL.grey : PAL.frost, alpha: la });
        y += style === 'title' ? 12 : 9;
      });
      if (t > 4) Font.draw(ui, 'Z', 312, 170, { size: 5, align: 'right', color: PAL.candle, alpha: 0.6 });
    },
  });
}

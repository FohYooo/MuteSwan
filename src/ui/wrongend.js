// Wrong End cards: black, red ink, a silhouette tableau and an epitaph.
import { Input } from '../core/input.js';
import { Font } from '../gfx/font.js';
import { PAL, rgba } from '../gfx/palette.js';
import { Audio } from '../audio/synth.js';
import { primaShape } from '../cutscene/shadowplay.js';
import { drawPuppet, POSES } from '../cutscene/puppet.js';
import { grainAndVignette } from '../cutscene/fx.js';
import { modal } from './common.js';

export const WRONG_ENDS = {
  look_away: { n: 1, title: 'LOOK AWAY', text: 'She looked for it three times. The third time, it was already looking back.' },
  still_life: { n: 2, title: 'STILL LIFE', text: 'She could not say it. So the Prima made her into something beautiful, and still.' },
  caught: { n: 3, title: 'CAUGHT', text: 'The Prima does not run. She has never had to.' },
  breath: { n: 4, title: 'BREATH', text: 'One breath. That was all it took to find her.' },
  black_water: { n: 5, title: 'BLACK WATER', text: 'The bath was not empty. It never had been.' },
};

function splash(ctx, seed, k) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  ctx.fillStyle = PAL.red;
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 70 * k, r = (2 + rnd() * 16 * (1 - d / 90)) * Math.min(1, k * 1.5);
    ctx.beginPath(); ctx.arc(160 + Math.cos(a) * d * 1.4, 84 + Math.sin(a) * d * 0.7, Math.max(0.5, r), 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = PAL.bright;
  for (let i = 0; i < 40; i++) { const a = rnd() * Math.PI * 2, d = (40 + rnd() * 90) * k; ctx.fillRect(160 + Math.cos(a) * d * 1.4, 84 + Math.sin(a) * d * 0.6, 1 + rnd() * 2, 1 + rnd() * 2); }
  ctx.fillStyle = PAL.red;
  for (let i = 0; i < 8; i++) { const x = 110 + rnd() * 100; ctx.fillRect(x, 90, 1.5, (20 + rnd() * 50) * Math.min(1, k * 0.8)); } // it runs
}

const PALE = { color: PAL.bone, tutu: false };
// Each tableau animates slowly with t (seconds since the card appeared).
const TABLEAU = {
  look_away(c, t) {
    c.save(); c.beginPath(); c.rect(100, 24, 120, 106); c.clip();
    c.fillStyle = '#1a2236'; c.fillRect(100, 24, 120, 106);
    primaShape(c, 160, 236 - Math.min(14, t * 3), 2.3, { bend: 0.1 + Math.sin(t * 0.6) * 0.05 });
    c.restore();
    c.fillStyle = PAL.wood; c.fillRect(96, 20, 128, 4); c.fillRect(96, 130, 128, 4); c.fillRect(96, 20, 4, 114); c.fillRect(220, 20, 4, 114); c.fillRect(158, 20, 4, 114);
  },
  still_life(c, t) {
    const k = Math.min(1, t / 3);
    drawPuppet(c, { ...POSES.fall, x: 150, y: 140, rot: 10 + k * 14, neck: -20 - k * 60, head: -30 - k * 50, scale: 1.9, spin: 0, lift: 6 }, PALE, null, t);
    primaShape(c, 196, 152, 1.4, { reach: 0.6 + k * 0.3, bend: 0.5 + k * 0.4 });
  },
  caught(c, t) {
    const k = Math.min(1, t / 4);
    drawPuppet(c, { ...POSES.reach, x: 150 - k * 6, y: 150, scale: 1.9, spin: 0, rot: -6 - k * 8, lift: 0 }, PALE, null, t);
    primaShape(c, 170 + k * 4, 150, 1.6, { reach: 1, bend: 0.4 + k * 0.4 });
  },
  breath(c, t) {
    const k = Math.min(1, t / 4);
    c.fillStyle = '#3b2a22'; c.fillRect(110, 40, 100, 120);
    c.fillStyle = '#0b0a0c'; c.fillRect(158, 40, 2 + k * 10, 120);
    c.fillStyle = '#e8e1d3';
    for (let i = 0; i < 4; i++) { const len = 4 + k * 14; c.fillRect(156 + i * 2.6, 70 + i * 1.5, 1, len); }
    c.fillStyle = 'rgba(232,225,211,0.8)'; c.beginPath(); c.arc(162 + k * 4, 72, 1.4, 0, Math.PI * 2); c.fill();
  },
  black_water(c, t) {
    c.fillStyle = '#e8e1d3'; c.fillRect(90, 120, 140, 26); c.fillStyle = '#0b0a0c'; c.fillRect(96, 124, 128, 18);
    const kick = Math.sin(t * 9) * Math.max(0, 1 - t / 4);
    drawPuppet(c, { ...POSES.fall, x: 160, y: 132, rot: 160, lThigh: 30 + kick * 30, rThigh: -40 - kick * 30, scale: 1.7, spin: 0, lift: 0 }, PALE, null, t);
    c.fillStyle = '#000'; for (let i = 0; i < 5; i++) c.fillRect(146 + i * 3, 112 - i * 2, 1.5, 18);
    c.fillStyle = PAL.bright; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(130 + i * 9, 126 - ((i * 3 + t * 6) % 9), 1.5, 0, Math.PI * 2); c.fill(); }
  },
};

// Resolves 'retry', 'keys' (switch to keyboard play, then retry) or 'title'.
export function wrongEnd(id, { keyboardOption = false } = {}) {
  const we = WRONG_ENDS[id] || WRONG_ENDS.caught;
  const options = [['retry', 'Try again']];
  if (keyboardOption) options.push(['keys', 'Try again with the keyboard']);
  options.push(['title', 'Back to the title']);
  let sel = 0;
  let t = 0;
  Audio.music(null, 300);
  Audio.sfx('gore');
  Audio.sfx('sting');
  return modal({
    opaque: true,
    update(dt) {
      t += dt;
      if (t <= 2) return;
      if (Input.pressed('up')) sel = (sel + options.length - 1) % options.length;
      if (Input.pressed('down')) sel = (sel + 1) % options.length;
      if (Input.pressed('ok')) { Audio.sfx('page'); this.close(options[sel][0]); }
    },
    draw(ctx, ui) {
      ctx.fillStyle = PAL.ink; ctx.fillRect(0, 0, 320, 180);
      ui.fillStyle = PAL.ink; ui.fillRect(0, 0, 320, 180);
      ui.save(); ui.globalAlpha = Math.min(1, t * 2); splash(ui, we.n * 977, Math.min(1, t * 1.2)); ui.restore();
      ui.save(); ui.globalAlpha = Math.min(1, Math.max(0, t - 0.4) * 1.5); TABLEAU[id]?.(ui, t); ui.restore();
      if (t < 1.2) { ui.fillStyle = `rgba(208,31,42,${Math.max(0, 0.45 - t * 0.4)})`; ui.fillRect(0, 0, 320, 180); }
      grainAndVignette(ui, { grain: 0.2, vignette: 0.9 });
      const a = Math.min(1, Math.max(0, t - 0.8));
      Font.draw(ui, 'WRONG END', 160, 10, { size: 6, font: 'title', align: 'center', color: PAL.grey, alpha: a, spacing: 2 });
      Font.draw(ui, we.title, 160, 18, { size: 16, font: 'title', align: 'center', color: PAL.bright, alpha: a, spacing: 2 });
      Font.draw(ui, we.text, 160, 150, { size: 7, italic: true, align: 'center', wrap: 260, color: PAL.bone, alpha: a });
      Font.draw(ui, `${we.n} / 5`, 312, 170, { size: 5, align: 'right', color: PAL.grey, alpha: a });
      if (t > 2) {
        options.forEach(([, label], i) => {
          Font.draw(ui, `${i === sel ? '▸ ' : '  '}${label}`, 8, 152 + i * 8 - (options.length - 2) * 8 + 8, { size: 5.5, color: i === sel ? PAL.candle : PAL.grey });
        });
      }
    },
  });
}

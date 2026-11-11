// write(): Mira's notebook. Her choices are handwritten on a page that is always damp.
import { Input } from '../core/input.js';
import { Font } from '../gfx/font.js';
import { PAL, rgba } from '../gfx/palette.js';
import { Audio } from '../audio/synth.js';
import { modal } from './common.js';

function drawPage(ui, x, y, w, h, seed) {
  ui.save();
  const g = ui.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#efe8d8');
  g.addColorStop(1, '#d9cfbb');
  ui.fillStyle = g;
  ui.fillRect(x, y, w, h);
  // ruled lines + margin
  ui.strokeStyle = rgba(PAL.moon, 0.35);
  ui.lineWidth = 0.35;
  for (let ly = y + 22; ly < y + h - 4; ly += 11) { ui.beginPath(); ui.moveTo(x + 4, ly); ui.lineTo(x + w - 4, ly); ui.stroke(); }
  ui.strokeStyle = rgba(PAL.bright, 0.35);
  ui.beginPath(); ui.moveTo(x + 18, y + 2); ui.lineTo(x + 18, y + h - 2); ui.stroke();
  // water stains: she is always wet
  ui.save();
  ui.beginPath(); ui.rect(x, y, w, h); ui.clip();
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 5; i++) {
    const cx = x + rnd() * w, cy = y + rnd() * h, r = 8 + rnd() * 20;
    ui.save();
    ui.translate(cx, cy);
    ui.rotate(rnd() * Math.PI);
    ui.scale(1, 0.55 + rnd() * 0.4);
    const st = ui.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
    st.addColorStop(0, rgba(PAL.dim, 0.07));
    st.addColorStop(0.9, rgba(PAL.dim, 0.12));
    st.addColorStop(1, rgba(PAL.dim, 0.0));
    ui.fillStyle = st;
    ui.beginPath(); ui.arc(0, 0, r, 0, Math.PI * 2); ui.fill();
    ui.restore();
  }
  ui.restore();
  // drips along the bottom edge
  ui.fillStyle = rgba(PAL.moon, 0.35);
  for (let i = 0; i < 4; i++) { const dx = x + 20 + rnd() * (w - 40); ui.fillRect(dx, y + h - 1, 0.8, 2 + rnd() * 5); }
  ui.strokeStyle = rgba(PAL.ink, 0.5);
  ui.lineWidth = 0.5;
  ui.strokeRect(x, y, w, h);
  ui.restore();
}

// options: strings or {text, struck, blank, hand}. Struck lines cannot be chosen; hand: 'vesna' is red ink.
export function write(rawOptions, { prompt = null, seed = 7 } = {}) {
  const options = rawOptions.map((o) => (typeof o === 'string' ? { text: o } : o));
  const pickable = (i) => !options[i].struck;
  const nextPick = (from, dir) => { let i = from; for (let n = 0; n < options.length; n++) { i = (i + dir + options.length) % options.length; if (pickable(i)) return i; } return from; };
  let sel = pickable(0) ? 0 : nextPick(0, 1);
  let t = 0;
  let slide = 0; // 0 hidden .. 1 shown
  let chosen = -1;
  let strike = 0;
  let leaving = false;
  Audio.sfx('page');
  return modal({
    update(dt) {
      t += dt;
      if (leaving) { slide -= dt * 4; if (slide <= 0) this.close(chosen); return; }
      slide = Math.min(1, slide + dt * 4);
      if (chosen >= 0) { strike += dt * 2.5; if (strike >= 1.4) leaving = true; return; }
      if (slide < 1) return;
      if (Input.pressed('up')) { sel = nextPick(sel, -1); Audio.sfx('click_pointe'); }
      if (Input.pressed('down')) { sel = nextPick(sel, 1); Audio.sfx('click_pointe'); }
      if (Input.pressed('ok') && pickable(sel)) { chosen = sel; Audio.sfx('page'); }
    },
    draw(ctx, ui) {
      const w = 210, h = 30 + options.length * 22 + (prompt ? 10 : 0);
      const x = 55;
      const ease = 1 - (1 - slide) ** 3;
      const y = 180 - (h + 14) * ease;
      ui.save();
      ui.fillStyle = rgba(PAL.ink, 0.45 * ease);
      ui.fillRect(0, 0, 320, 180);
      ui.translate(160, y + h / 2);
      ui.rotate(-0.012);
      ui.translate(-160, -(y + h / 2));
      drawPage(ui, x, y, w, h, seed);
      Font.draw(ui, 'Mira writes:', x + 24, y + 6, { size: 5.5, italic: true, color: PAL.grey, shadow: false });
      let yy = y + 18;
      if (prompt) { Font.draw(ui, prompt, x + 24, yy - 4, { size: 5.5, italic: true, color: PAL.moon, shadow: false, wrap: w - 34 }); yy += 10; }
      options.forEach((o, i) => {
        const active = chosen >= 0 ? i === chosen : i === sel;
        if (o.blank) { yy += 22; return; }
        const ink = o.hand === 'vesna' ? (active ? PAL.red : 'rgba(143,15,23,0.45)') : (active ? '#1b1626' : 'rgba(27,22,38,0.38)');
        const hh = Font.hand(ui, o.text, x + 24, yy, { wrap: w - 36, color: o.struck ? 'rgba(27,22,38,0.3)' : ink, tilt: (o.hand === 'vesna' ? 1.6 : -0.8) + i * 0.4 });
        if (o.struck) {
          ui.strokeStyle = PAL.red; ui.lineWidth = 0.9;
          ui.beginPath(); ui.moveTo(x + 20, yy + hh / 2); ui.lineTo(x + w - 30, yy + hh / 2 - 2); ui.stroke();
          ui.beginPath(); ui.moveTo(x + 22, yy + hh / 2 + 2); ui.lineTo(x + w - 40, yy + hh / 2 + 1); ui.stroke();
        }
        if (active && chosen < 0) {
          ui.fillStyle = PAL.red;
          ui.beginPath(); ui.arc(x + 12, yy + 4.5 + Math.sin(t * 5) * 0.4, 1.2, 0, Math.PI * 2); ui.fill();
        }
        if (i === chosen) {
          ui.strokeStyle = PAL.red;
          ui.lineWidth = 0.7;
          ui.beginPath();
          ui.moveTo(x + 22, yy + hh - 1);
          ui.lineTo(x + 22 + (w - 40) * Math.min(1, strike), yy + hh - 1.6);
          ui.stroke();
        }
        yy += Math.max(22, hh + 10);
      });
      ui.restore();
    },
  });
}

// Title screen: a black swan on the moonlit ice, falling snow, the menu.
import { Input } from '../core/input.js';
import { Font } from '../gfx/font.js';
import { PAL, rgba } from '../gfx/palette.js';
import { Audio } from '../audio/synth.js';
import { modal, cursor } from './common.js';
import { choose } from './textbox.js';

const ENDING_NAMES = { swan_song: 'Swan Song', thaw: 'Thaw', pas_de_deux: 'Pas de Deux', hollow: 'Hollow' };

export function drawNightLake(ctx, t, { swan = true } = {}) {
  const sky = ctx.createLinearGradient(0, 0, 0, 120);
  sky.addColorStop(0, '#07070b');
  sky.addColorStop(1, PAL.deep);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 320, 180);
  // moon
  ctx.fillStyle = PAL.bone;
  ctx.beginPath(); ctx.arc(230, 46, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba(PAL.frost, 0.6);
  ctx.beginPath(); ctx.arc(224, 42, 4, 0, Math.PI * 2); ctx.arc(236, 53, 3, 0, Math.PI * 2); ctx.fill();
  // far treeline
  ctx.fillStyle = PAL.ink;
  for (let x = 0; x < 320; x += 6) { const h = 8 + ((x * 37) % 11); ctx.fillRect(x, 112 - h, 6, h); }
  // ice
  const ice = ctx.createLinearGradient(0, 112, 0, 180);
  ice.addColorStop(0, PAL.moon);
  ice.addColorStop(1, '#1f2840');
  ctx.fillStyle = ice;
  ctx.fillRect(0, 112, 320, 68);
  // moon path on the ice
  ctx.fillStyle = rgba(PAL.frost, 0.35);
  for (let y = 114; y < 180; y += 3) { const w = 10 + (y - 112) * 0.5; ctx.fillRect(230 - w / 2 + Math.sin(y + t) * 2, y, w, 1); }
  // the hole in the ice
  ctx.fillStyle = PAL.ink;
  ctx.beginPath(); ctx.ellipse(110, 150, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
  if (swan) {
    // a black swan, neck bowed, gliding toward the hole
    const sx = 150 + Math.sin(t * 0.3) * 6, sy = 138;
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(sx, sy, 13, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(sx - 12, sy - 4, 4, 3);
    ctx.beginPath(); ctx.moveTo(sx - 8, sy - 2); ctx.quadraticCurveTo(sx - 12, sy - 20, sx - 4, sy - 22); ctx.quadraticCurveTo(sx - 1, sy - 21, sx - 2, sy - 18);
    ctx.quadraticCurveTo(sx - 7, sy - 16, sx - 5, sy - 2); ctx.fill();
    ctx.fillStyle = PAL.bright; ctx.fillRect(Math.round(sx - 2), sy - 19, 3, 1);
  }
  // snow
  ctx.fillStyle = PAL.bone;
  for (let i = 0; i < 70; i++) {
    const x = (i * 53 + t * (6 + (i % 5) * 3)) % 330 - 5;
    const y = (i * 29 + t * (14 + (i % 7) * 4)) % 185;
    ctx.globalAlpha = 0.4 + (i % 3) * 0.2;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  ctx.globalAlpha = 1;
}

// endings: ids seen; hasSave: show Continue; electron: show Quit
export function title({ endings = [], hasSave = false, electron = false }) {
  const items = ['New night'];
  if (hasSave) items.unshift('Continue');
  items.push('Settings');
  if (electron) items.push('Quit');
  let sel = 0;
  let t = 0;
  Audio.music('musicbox');
  return modal({
    opaque: true,
    update(dt) {
      t += dt;
      if (Input.pressed('up')) { sel = (sel + items.length - 1) % items.length; Audio.sfx('click_pointe'); }
      if (Input.pressed('down')) { sel = (sel + 1) % items.length; Audio.sfx('click_pointe'); }
      if (Input.pressed('ok') && t > 0.6 && !this.asking) {
        Audio.sfx('page');
        if (items[sel] === 'New night' && hasSave) {
          // starting over forgets the night in progress: ask first
          this.asking = true;
          choose(['Start a new night', 'Back'], { prompt: 'This forgets the night you are in.' }).then((c) => {
            this.asking = false;
            if (c === 0) this.close('New night');
          });
          return;
        }
        this.close(items[sel]);
      }
    },
    draw(ctx, ui) {
      drawNightLake(ctx, t);
      const a = Math.min(1, t / 2);
      Font.draw(ui, 'MUTE SWAN', 22, 34, { size: 22, font: 'title', color: PAL.bone, alpha: a, spacing: 3 });
      Font.draw(ui, 'a horror in one night, played with your voice', 24, 62, { size: 6.5, italic: true, color: PAL.frost, alpha: a });
      items.forEach((it, i) => {
        const y = 92 + i * 12;
        if (i === sel) cursor(ui, 24, y + 1.8, t);
        Font.draw(ui, it, 32, y, { size: 7.5, color: i === sel ? PAL.bone : PAL.grey, alpha: a });
      });
      // endings seen: three swans
      ['swan_song', 'thaw', 'pas_de_deux', 'hollow'].forEach((id, i) => {
        const seen = endings.includes(id);
        const x = 238 + i * 18, y = 160;
        ui.save();
        ui.globalAlpha = a * (seen ? 1 : 0.35);
        ui.fillStyle = seen ? PAL.bone : PAL.grey;
        ui.beginPath(); ui.ellipse(x, y, 6, 2.2, 0, 0, Math.PI * 2); ui.fill();
        ui.fillRect(x - 5, y - 9, 1.4, 8); ui.fillRect(x - 5, y - 9, 3, 1.4);
        ui.restore();
        if (seen) Font.draw(ui, ENDING_NAMES[id], x, y + 4, { size: 3.6, align: 'center', color: PAL.frost, shadow: false });
      });
      Font.draw(ui, 'Made by Foh · a little help from Claude', 24, 166, { size: 5, color: PAL.grey, alpha: a });
    },
  });
}

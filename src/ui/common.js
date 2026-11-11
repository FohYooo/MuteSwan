// Shared helpers for modal UI scenes drawn on the hi-res layer.
import { Scenes } from '../core/scenes.js';
import { PAL, rgba } from '../gfx/palette.js';

// Push a modal scene; resolves with whatever the scene passes to close().
export function modal(scene) {
  return new Promise((resolve) => {
    scene.modal = true;
    scene.close = (v) => { Scenes.pop(scene); resolve(v); };
    Scenes.push(scene);
  });
}

export function panel(ui, x, y, w, h, { alpha = 0.9, border = PAL.frost } = {}) {
  ui.save();
  ui.fillStyle = rgba(PAL.ink, alpha);
  ui.fillRect(x, y, w, h);
  ui.strokeStyle = rgba(border, 0.55);
  ui.lineWidth = 0.4;
  ui.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  ui.strokeStyle = rgba(border, 0.25);
  ui.strokeRect(x + 3, y + 3, w - 6, h - 6);
  // little corner diamonds
  ui.fillStyle = rgba(border, 0.7);
  for (const [cx, cy] of [[x + 1.5, y + 1.5], [x + w - 1.5, y + 1.5], [x + 1.5, y + h - 1.5], [x + w - 1.5, y + h - 1.5]]) {
    ui.beginPath(); ui.moveTo(cx, cy - 1.4); ui.lineTo(cx + 1.4, cy); ui.lineTo(cx, cy + 1.4); ui.lineTo(cx - 1.4, cy); ui.fill();
  }
  ui.restore();
}

export function cursor(ui, x, y, t, color = PAL.candle) {
  ui.save();
  ui.fillStyle = color;
  const o = Math.sin(t * 6) * 0.8;
  ui.beginPath(); ui.moveTo(x + o, y); ui.lineTo(x + 3 + o, y + 2); ui.lineTo(x + o, y + 4); ui.fill();
  ui.restore();
}

export const SPEAKER_COLORS = { Vesna: '#e3a3a8', 'The Prima': PAL.bright, Madame: PAL.dim };

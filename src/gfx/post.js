// Screen-wide effects on the pixel layer: grain, vignette, desaturation, shake, red pulse.
import { PAL } from './palette.js';
import { newCanvas } from './pixel.js';

let grains = null;
let vignette = null;
let tmp = null;

function init(w, h) {
  grains = [];
  for (let n = 0; n < 4; n++) {
    const c = newCanvas(w, h);
    const g = c.getContext('2d');
    const im = g.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const v = Math.random() < 0.5 ? 0 : 255;
      im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v;
      im.data[i * 4 + 3] = Math.random() < 0.18 ? 255 : 0;
    }
    g.putImageData(im, 0, 0);
    grains.push(c);
  }
  vignette = newCanvas(w, h);
  const vg = vignette.getContext('2d');
  const grad = vg.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.62);
  grad.addColorStop(0, 'rgba(11,10,12,0)');
  grad.addColorStop(1, 'rgba(11,10,12,1)');
  vg.fillStyle = grad;
  vg.fillRect(0, 0, w, h);
  tmp = newCanvas(w, h);
}

export const Post = {
  apply(ctx, { grain = 0.12, vignette: vig = 0.6, desaturate = 0, shake = 0, redPulse = 0 } = {}) {
    const { width: w, height: h } = ctx.canvas;
    if (!grains) init(w, h);
    if (desaturate > 0 || shake > 0) {
      const tg = tmp.getContext('2d');
      tg.clearRect(0, 0, w, h);
      tg.drawImage(ctx.canvas, 0, 0);
      ctx.save();
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(0, 0, w, h);
      if (desaturate > 0) ctx.filter = `grayscale(${desaturate}) contrast(${1 + desaturate * 0.25})`;
      const sx = shake ? Math.round((Math.random() * 2 - 1) * shake * 4) : 0;
      const sy = shake ? Math.round((Math.random() * 2 - 1) * shake * 3) : 0;
      ctx.drawImage(tmp, sx, sy);
      ctx.restore();
    }
    if (redPulse > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = redPulse * 0.6;
      ctx.fillStyle = PAL.bright;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
    if (vig > 0) { ctx.save(); ctx.globalAlpha = vig; ctx.drawImage(vignette, 0, 0); ctx.restore(); }
    if (grain > 0) {
      ctx.save();
      ctx.globalAlpha = grain;
      ctx.globalCompositeOperation = 'overlay';
      ctx.drawImage(grains[Math.floor(performance.now() / 70) % 4], 0, 0);
      ctx.restore();
    }
  },
};

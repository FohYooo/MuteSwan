// Hi-res text on the UI layer. Sizes and positions are in the 320x180 virtual space.
import { PAL } from './palette.js';

const FAMILIES = {
  serif: '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif',
  title: 'Didot, "Bodoni MT", "Palatino Linotype", Palatino, Georgia, serif',
  hand: '"Segoe Script", "Ink Free", "Snell Roundhand", "Bradley Hand", "Apple Chancery", cursive',
  mono: '"Courier New", Courier, monospace',
};

function setFont(ui, { size = 7, font = 'serif', italic = false, bold = false }) {
  ui.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${size}px ${FAMILIES[font] || font}`;
}

export function wrapLines(ui, text, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? `${line} ${word}` : word;
      if (maxW && ui.measureText(test).width > maxW && line) { out.push(line); line = word; } else line = test;
    }
    out.push(line);
  }
  return out;
}

export const Font = {
  FAMILIES,
  // Returns the height used. opts: {color, align, size, font, italic, wrap, lineH, alpha, shadow, spacing}
  draw(ui, text, x, y, opts = {}) {
    const { color = PAL.bone, align = 'left', size = 7, wrap = 0, alpha = 1, shadow = true, spacing = 0 } = opts;
    const lineH = opts.lineH || size * 1.3;
    ui.save();
    setFont(ui, opts);
    ui.textAlign = align;
    ui.textBaseline = 'top';
    ui.globalAlpha = alpha;
    if (spacing) ui.letterSpacing = `${spacing}px`;
    const lines = wrapLines(ui, text, wrap);
    lines.forEach((ln, i) => {
      if (shadow) { ui.fillStyle = 'rgba(11,10,12,0.85)'; ui.fillText(ln, x + 0.5, y + i * lineH + 0.5); }
      ui.fillStyle = color;
      ui.fillText(ln, x, y + i * lineH);
    });
    ui.restore();
    return lines.length * lineH;
  },
  // Handwriting for Mira's notebook: slightly rotated, ink colour.
  hand(ui, text, x, y, opts = {}) {
    ui.save();
    ui.translate(x, y);
    ui.rotate(((opts.tilt ?? -1.2) * Math.PI) / 180);
    const h = this.draw(ui, text, 0, 0, { font: 'hand', size: 8, color: '#1d1a2a', shadow: false, lineH: 10, ...opts });
    ui.restore();
    return h;
  },
  measure(ui, text, opts = {}) {
    ui.save();
    setFont(ui, opts);
    const w = ui.measureText(text).width;
    ui.restore();
    return w;
  },
};

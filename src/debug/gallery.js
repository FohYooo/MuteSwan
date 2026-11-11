// ?debug=1&scene=gallery — every tile and sprite under one candle.
import { TILE_CHARS, tileFrame } from '../gfx/tiles.js';
import { SPRITES, buildSprites, propFrame } from '../gfx/sprites.js';
import { Lighting } from '../gfx/lighting.js';
import { Post } from '../gfx/post.js';
import { Font } from '../gfx/font.js';
import { PAL } from '../gfx/palette.js';

export function galleryScene() {
  buildSprites();
  let t = 0;
  const lit = new URLSearchParams(location.search).get('lit') !== '0';
  return {
    opaque: true,
    update(dt) { t += dt; },
    draw(ctx, ui) {
      ctx.fillStyle = PAL.shade;
      ctx.fillRect(0, 0, 320, 180);
      TILE_CHARS.forEach((ch, i) => {
        const x = 4 + (i % 17) * 18, y = 4;
        ctx.drawImage(tileFrame(ch, t, i, 0), x, y);
        Font.draw(ui, JSON.stringify(ch), x + 8, y + 17, { size: 4, align: 'center', shadow: false, color: PAL.frost });
      });
      let x = 4;
      for (const who of ['mira', 'vesna']) {
        for (const dir of ['down', 'up', 'right', 'left']) {
          const f = Math.floor(t * 6) % 3;
          ctx.drawImage(SPRITES[who][dir][f], x, 30);
          x += 17;
        }
      }
      for (const dir of ['down', 'up', 'right']) { ctx.drawImage(SPRITES.prima[dir][Math.floor(t * 3) % 2], x, 26); x += 17; }
      ctx.drawImage(SPRITES.prima.reach, x, 26);
      const props = ['bed', 'bed_dark', 'candle', 'candelabra', 'piano', 'bench', 'wardrobe', 'rack', 'mannequin', 'desk', 'safe', 'tub', 'tub_bubble', 'tub_corpse',
        'portrait_l', 'portrait_c', 'portrait_r', 'seat', 'musicbox', 'chain', 'glass', 'note', 'key', 'lighter', 'ribbon', 'feather', 'paper', 'playbill', 'stool', 'sink', 'swan'];
      let px = 4, py = 72, rowH = 0;
      for (const p of props) {
        const s = propFrame(p, t, 2);
        if (px + s.width > 316) { px = 4; py += rowH + 8; rowH = 0; }
        ctx.drawImage(s, px, py);
        Font.draw(ui, p, px, py + s.height + 1, { size: 3.5, shadow: false, color: PAL.frost });
        px += s.width + 6;
        rowH = Math.max(rowH, s.height);
      }
      if (lit) {
        Lighting.begin(ctx);
        Lighting.light(160, 90, 120, PAL.candle, 1);
        Lighting.light(40, 40, 50, PAL.moon, 0);
        Lighting.end(ctx, 0.05);
        Post.apply(ctx, { grain: 0.1, vignette: 0.5 });
      }
    },
  };
}

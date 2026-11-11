// ?debug=1&scene=poses — every puppet pose, for tuning.
import { POSES, drawPuppet, createPhysics, stepPhysics, solveRig, samplePose } from '../cutscene/puppet.js';
import { paper } from '../cutscene/shadowplay.js';
import { Font } from '../gfx/font.js';
import { PAL } from '../gfx/palette.js';

export function posesScene() {
  let t = 0;
  const names = Object.keys(POSES);
  const phys = names.map(() => createPhysics());
  return {
    opaque: true,
    update(dt) { t += dt; },
    draw(ctx, ui) {
      paper(ctx, { moon: false });
      names.forEach((n, i) => {
        const col = i % 8, row = Math.floor(i / 8);
        const x = 22 + col * 39, y = 52 + row * 60;
        ctx.fillStyle = 'rgba(11,10,12,0.15)'; ctx.fillRect(x - 18, y, 36, 1);
        const pose = samplePose([{ t: 0, pose: n, x, y, scale: 1.15 }], 0);
        const st = { scarf: i % 2 === 0, hair: i % 2 ? undefined : 'bob', color: i % 3 === 0 ? PAL.bone : PAL.ink };
        stepPhysics(phys[i], solveRig(pose), 1 / 60);
        drawPuppet(ctx, pose, st, phys[i], t);
        Font.draw(ui, n, x, y + 3, { size: 4, align: 'center', color: PAL.ink, shadow: false });
      });
    },
  };
}

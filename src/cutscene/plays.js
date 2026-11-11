// The shadow plays, choreographed for rigged puppets. Subtitles live with their shots because
// they are timed to them. Lines without a speaker are Mira's own voice.
import { PAL, rgba } from '../gfx/palette.js';
import { crack, hole, swanFlight, runPlay } from './shadowplay.js';
import { samplePose, solveRig } from './puppet.js';
import { windowFrame } from './fx.js';
import { Font } from '../gfx/font.js';

// Vesna: the white swan, ash bob, red scarf. Mira: the black swan with a bun. After the lake: a ghost.
const V = { color: PAL.bone, hair: 'bob', scarf: true };
const M = { color: PAL.ink };
const MG = { ghost: true };
const dancer = (id, style, keys, extra = {}) => ({ id, kind: 'dancer', style, keys, ...extra });
const prima = (keys) => ({ id: 'prima', kind: 'prima', keys });
const FLOOR = 142;
const at = (keys, t) => solveRig(samplePose(keys, t));
// a run of keyframes: [t, pose, {overrides}] with a shared base
const seq = (base, list) => list.map(([t, pose, o = {}]) => ({ t, pose, ...base, ...o }));
const LEFT = 0.5; // spin 0.5 = facing left

function ember(c, x, y, t) {
  const f = 0.7 + Math.sin(t * 5) * 0.3;
  const g = c.createRadialGradient(x, y, 0, x, y, 7 * f);
  g.addColorStop(0, rgba(PAL.bright, 0.9)); g.addColorStop(1, rgba(PAL.bright, 0));
  c.fillStyle = g; c.fillRect(x - 8, y - 8, 16, 16);
  c.fillStyle = '#ffd0a0'; c.beginPath(); c.arc(x, y, 0.7, 0, Math.PI * 2); c.fill();
}

// ---- the prologue: the night on the ice ------------------------------------------------
const vDance = seq({ y: FLOOR }, [
  [0, 'first', { x: 112 }], [1.6, 'arms_up', { x: 118 }], [3.2, 'arabesque', { x: 126 }],
  [4.2, 'passe', { x: 130, spin: 0 }], [5.4, 'passe', { x: 134, spin: 2 }], [6.4, 'arms_open', { x: 138, spin: 2 }],
  [8, 'attitude', { x: 142, spin: 2 }], [9.6, 'reach', { x: 146, spin: 2 }], [12, 'reach', { x: 150, spin: 2 }],
]);
const mDance = seq({ y: FLOOR, spin: LEFT }, [
  [0, 'first', { x: 210 }], [1.6, 'arabesque', { x: 204 }], [3.2, 'arms_up', { x: 198 }],
  [4.6, 'passe', { x: 194, spin: LEFT }], [5.8, 'passe', { x: 190, spin: LEFT + 2 }], [7, 'arms_open', { x: 186, spin: LEFT + 2 }],
  [8.6, 'arabesque', { x: 182, spin: LEFT + 2 }], [10.4, 'reach', { x: 176, spin: LEFT + 2 }], [12, 'reach', { x: 172, spin: LEFT + 2 }],
]);

export const PLAYS = {
  prologue: [
    { dur: 3.5, bg: 'ink', music: 'piano', lines: [[0.6, 'One year ago.']] },
    {
      dur: 12, bg: 'night_ice', fx: { snow: 70, wind: 14, breath: ['v', 'm'] },
      cam: [{ t: 0, x: 160, y: 96, zoom: 1 }, { t: 12, x: 162, y: 104, zoom: 1.18 }],
      cast: [dancer('v', V, vDance), dancer('m', M, mDance)],
      lines: [
        [0.4, 'The night of the first hard frost, Vesna dared me onto the lake.'],
        [3.6, "Come on, Mira. Nobody's watching. Dance it with me. The real way, on the real lake.", 'Vesna'],
        [8, 'So we did. Both parts. She was the white swan. I was the black.'],
      ],
    },
    {
      dur: 8, bg: 'night_ice', fx: { snow: 60, wind: 10, breath: ['v'] },
      cam: [{ t: 0, x: 160, y: 104, zoom: 1.3 }, { t: 8, x: 160, y: 100, zoom: 1.55 }],
      cast: [
        dancer('v', V, seq({ x: 154, y: FLOOR }, [[0, 'reach'], [2, 'embrace'], [6, 'embrace'], [8, 'reach']])),
        dancer('m', M, seq({ x: 166, y: FLOOR, spin: LEFT }, [[0, 'arms_up', { lift: 0 }], [2.4, 'arabesque', { lift: 18, ease: 'out' }], [5.4, 'arabesque', { lift: 20 }], [7.4, 'arms_up', { lift: 0, ease: 'inOut' }]])),
      ],
      lines: [[0.5, 'For eleven minutes the whole world was quiet, and it was ours.']],
    },
    {
      dur: 8, bg: 'night_ice', sfx: [[0.3, 'ice_crack'], [3.2, 'ice_crack']], fx: { snow: 50, wind: 30, shards: [{ t: 0.4, x: 188, y: 144, n: 14 }, { t: 3.2, x: 190, y: 144, n: 24 }] },
      cam: [{ t: 0, x: 160, y: 104, zoom: 1.2, shake: 0.4 }, { t: 3, x: 176, y: 108, zoom: 1.5, shake: 1 }, { t: 8, x: 186, y: 112, zoom: 2.1, shake: 0.6 }],
      under: (c, t, k) => { crack(c, 188, 144, Math.min(1, k * 1.8), 5, '#1a2236'); },
      cast: [
        dancer('v', V, seq({ y: FLOOR }, [[0, 'reach', { x: 140 }], [3, 'reach_low', { x: 146 }], [8, 'reach', { x: 150 }]])),
        dancer('m', M, seq({ x: 188, y: FLOOR, spin: LEFT }, [[0, 'stand'], [2, 'first'], [4, 'stand', { torso: -2 }], [4.2, 'stand', { torso: 2 }], [4.4, 'stand', { torso: -2 }], [8, 'stand']])),
      ],
      lines: [[0.6, "Mira. Mira, don't move. The ice—", 'Vesna'], [3.4, 'RUN! Mira, RUN!', 'Vesna']],
    },
  ],

  prologue_after: [
    { dur: 4, bg: 'white', sfx: [[0.1, 'splash']], lines: [[0.8, 'Her body would not listen.']], post: { vignette: 0.3, grain: 0.08 }, cut: true },
    { dur: 4.5, bg: 'ink', lines: [[0.8, 'The ice took her. I stood there and let it.']] },
    { dur: 4, bg: 'ink', frame: (ui, t) => Font.draw(ui, 'MUTE SWAN', 160, 78, { size: 22, font: 'title', align: 'center', color: PAL.bone, alpha: Math.min(1, t / 1.5), spacing: 3 }) },
    { dur: 4.5, bg: 'ink', lines: [[0.5, 'A year later. The night of the anniversary. The school is closed, and snowed in, and I am still here.']] },
  ],

  // ---- memories --------------------------------------------------------------------------
  roof: [
    {
      dur: 24, bg: 'roof', music: 'piano', fx: { snow: 30, wind: 8, breath: ['v'] },
      cam: [{ t: 0, x: 150, y: 100, zoom: 1.1 }, { t: 17, x: 158, y: 108, zoom: 1.4 }, { t: 24, x: 160, y: 108, zoom: 2 }],
      cast: [
        dancer('v', { ...V, tutu: false }, seq({ x: 142, y: 136 }, [[0, 'smoke'], [8, 'sit'], [13, 'smoke'], [18, 'sit_lean', { x: 146 }], [24, 'sit_lean', { x: 148 }]])),
        dancer('m', { ...M, tutu: false }, seq({ x: 178, y: 137, spin: LEFT }, [[0, 'sit'], [10, 'sit'], [18, 'sit_lean', { x: 174 }], [24, 'sit_lean', { x: 172 }]])),
      ],
      over: (c, t) => {
        const r = at(PLAYS.roof[0].cast[0].keys, t);
        if (t < 18) ember(c, r.lHand.x, r.lHand.y, t);
      },
      lines: [
        [0.4, 'The roof, last October. The only place in the school nobody watched. Except her. Except me.'],
        [5, "You don't have to talk. Just stay. You're not allowed to be anywhere else.", 'Vesna'],
        [9.5, "She lit two cigarettes and gave me one. I didn't smoke. I kept it. I still have it."],
        [14, "If you ever dance Odile with anyone but me I'll break both their ankles. I'm joking. Mostly.", 'Vesna'],
        [18.5, 'I was not joking when I wished she would.'],
        [21.5, 'Her mouth tasted of smoke and snow.'],
      ],
    },
  ],

  watching: [
    {
      dur: 16, bg: 'bedroom', music: 'musicbox', fx: { breath: ['v'] },
      cam: [{ t: 0, x: 150, y: 110, zoom: 1.2 }, { t: 16, x: 140, y: 120, zoom: 1.8 }],
      cast: [
        dancer('v', { ...V, tutu: false, scarf: false }, [{ t: 0, pose: 'lie', x: 100, y: 145, rot: -90 }, { t: 8, pose: 'lie', x: 100, y: 145, rot: -88 }, { t: 16, pose: 'lie', x: 100, y: 145, rot: -90 }]),
        dancer('m', { ...M, tutu: false }, seq({ x: 168, y: 150, spin: LEFT }, [[0, 'watch'], [8, 'watch', { torso: 22 }], [16, 'watch', { torso: 34, neck: 30, x: 164 }]])),
      ],
      lines: [
        [0.5, "Before the lake, I didn't sleep much."],
        [4, 'I sat on the edge of her bed and counted her breaths. Four hundred and twelve, one night. Four hundred and nine the next.'],
        [10.5, 'If she ever stopped breathing, I wanted to be the first to know.'],
      ],
    },
  ],

  shrine: [
    {
      dur: 14, bg: 'shrine', music: null, fx: {},
      cam: [{ t: 0, x: 160, y: 104, zoom: 1.1 }, { t: 14, x: 172, y: 128, zoom: 1.5 }],
      cast: [dancer('v', { ...V, tutu: false }, seq({ x: 178, y: 156 }, [[0, 'kneel_pray'], [5, 'kneel_pray', { neck: 34 }], [7, 'kneel', { lArm: 120, lFore: 60 }], [10, 'kneel_pray'], [14, 'kneel_pray', { neck: 30 }]]))],
      lines: [
        [0.5, 'Every night after the lake, she came here.'],
        [4.5, 'Goodnight. Goodnight. Goodnight.', 'Vesna'],
        [8.5, "She kissed every photograph. She scratched out every face that wasn't mine."],
      ],
    },
    {
      dur: 7, bg: 'ink',
      cam: [{ t: 0, x: 160, y: 96, zoom: 1.3 }, { t: 7, x: 160, y: 96, zoom: 1.45 }],
      under: (c) => { c.fillStyle = '#16131a'; c.fillRect(132, 40, 56, 110); c.fillStyle = rgba(PAL.candle, 0.08); c.fillRect(136, 44, 48, 106); },
      cast: [dancer('m', MG, [{ t: 0, pose: 'stand', x: 160, y: 148, alpha: 0 }, { t: 2, pose: 'stand', x: 160, y: 148, alpha: 1 }, { t: 7, pose: 'grief', x: 160, y: 148 }])],
      lines: [[1, 'I know, because I watched her do it. Every night.']],
    },
  ],

  duet: [
    {
      dur: 26, bg: 'stage', music: 'musicbox', fx: { feathers: 10 },
      cam: [{ t: 0, x: 150, y: 104, zoom: 1.15 }, { t: 10, x: 160, y: 104, zoom: 1.25 }, { t: 18, x: 162, y: 110, zoom: 1.5 }, { t: 26, x: 160, y: 108, zoom: 1.9 }],
      cast: [
        dancer('v', V, seq({ y: 150 }, [
          [0, 'arms_up', { x: 120 }], [2, 'arabesque', { x: 130 }], [3.4, 'passe', { x: 138, spin: 0 }], [4.6, 'passe', { x: 142, spin: 3 }],
          [6, 'attitude', { x: 146, spin: 3 }], [8, 'arms_open', { x: 150, spin: 3 }], [10, 'arabesque', { x: 152, spin: 3 }],
          [12, 'reach', { x: 154, spin: 3 }], [16, 'reach', { x: 156, spin: 3 }], [17, 'embrace', { x: 158, spin: 3 }], [21, 'grief', { x: 156, spin: 3 }], [26, 'grief', { x: 156, spin: 3 }],
        ])),
        dancer('m', MG, seq({ y: 150, spin: LEFT }, [
          [0, 'stand', { x: 260, alpha: 0 }], [10, 'stand', { x: 220, alpha: 0 }], [11.5, 'arms_up', { x: 196, alpha: 1 }],
          [13, 'arabesque', { x: 182 }], [14.2, 'passe', { x: 176, spin: LEFT }], [15.4, 'passe', { x: 172, spin: LEFT + 2 }],
          [16.2, 'reach', { x: 166, spin: LEFT + 2 }], [17.5, 'embrace', { x: 158, spin: LEFT + 2 }], [21, 'embrace', { x: 158, spin: LEFT + 2, alpha: 0.6 }], [26, 'reach', { x: 166, spin: LEFT + 2, alpha: 0.3 }],
        ])),
      ],
      lines: [
        [0.5, 'I learned both parts, after. Yours and mine. So nobody else could have you.', 'Vesna'],
        [5.5, "I dance them every night so nobody has to understudy you. Nobody's allowed to.", 'Vesna'],
        [11, 'I stepped into the light with her. I knew every count. I always counted for her.'],
        [16.5, 'I took her hand. Her fingers closed on nothing.'],
        [21.5, "I can feel you. I can always feel you. You can't hide from me, Mira. You never could.", 'Vesna'],
      ],
    },
  ],

  truth: [
    { dur: 3.5, bg: 'ink', music: 'piano', lines: [[0.5, 'One year ago. What really happened.']] },
    {
      dur: 9, bg: 'night_ice', sfx: [[0.4, 'ice_crack'], [2.2, 'splash']], fx: { snow: 50, wind: 20, shards: [{ t: 0.5, x: 186, y: 144, n: 26 }] },
      cam: [{ t: 0, x: 168, y: 106, zoom: 1.3 }, { t: 9, x: 178, y: 112, zoom: 1.7, shake: 0.3 }],
      under: (c, t, k) => { crack(c, 186, 144, 1, 5, '#1a2236'); hole(c, 186, 145, Math.min(18, 4 + t * 7), Math.min(5, 1 + t * 2)); },
      cast: [
        dancer('m', M, [{ t: 0, pose: 'stand', x: 186, y: FLOOR, spin: LEFT }, { t: 1.6, pose: 'fall', x: 186, y: FLOOR + 6, spin: LEFT }, { t: 3, pose: 'arms_up', x: 186, y: FLOOR + 30, spin: LEFT, alpha: 0.2 }, { t: 9, pose: 'arms_up', x: 186, y: FLOOR + 40, spin: LEFT, alpha: 0 }]),
        dancer('v', V, seq({ y: FLOOR }, [[0, 'reach', { x: 128 }], [2, 'reach', { x: 150 }], [4, 'reach_low', { x: 164 }], [9, 'reach_low', { x: 166 }]])),
      ],
      lines: [[0.5, 'The ice opened under the black swan. Under me.'], [4.6, "She screamed at me to run. I couldn't. So she ran to me instead."]],
    },
    {
      dur: 9, bg: 'night_ice', fx: { snow: 40, wind: 20 },
      cam: [{ t: 0, x: 176, y: 128, zoom: 2.2 }, { t: 9, x: 182, y: 134, zoom: 2.8 }],
      under: (c, t, k) => {
        hole(c, 186, 145, 18, 5);
        // her hand in the water, slipping
        c.strokeStyle = PAL.ink; c.lineWidth = 1.4; c.lineCap = 'round';
        c.beginPath(); c.moveTo(184, 147 + k * 10); c.lineTo(181, 142 + k * 12); c.stroke();
      },
      cast: [dancer('v', { ...V, tutu: false }, [{ t: 0, pose: 'reach', x: 148, y: 164, rot: 82, lArm: 172, lFore: 4, rArm: 160, rFore: 10 }, { t: 4.5, pose: 'reach', x: 151, y: 164, rot: 86, lArm: 178, lFore: 0, rArm: 168, rFore: 6 }, { t: 9, pose: 'reach', x: 152, y: 164, rot: 84, lArm: 182, lFore: -6, rArm: 150, rFore: 20 }])],
      lines: [[0.5, 'She caught my hand. Hers was warm. Mine was going cold.'], [5, 'It was never her hand that let go.']],
    },
    {
      dur: 11, bg: 'under', fx: { bubbles: 26 },
      cam: [{ t: 0, x: 160, y: 80, zoom: 1.2 }, { t: 11, x: 160, y: 110, zoom: 1.4 }],
      cast: [dancer('m', MG, [{ t: 0, pose: 'float', x: 165, y: 70, rot: 12 }, { t: 11, pose: 'curl', x: 162, y: 150, rot: 30 }])],
      lines: [[0.5, 'I was the one who went under.'], [4, 'Eleven minutes. That is how long they said I was in the water.'], [7.8, 'They put my name in the programme anyway.']],
    },
  ],

  // ---- endings --------------------------------------------------------------------------
  swan_song: [
    {
      dur: 13, bg: 'night_ice', music: 'musicbox', fx: { snow: 50, wind: 10, breath: ['v'] },
      cam: [{ t: 0, x: 160, y: 104, zoom: 1.1 }, { t: 13, x: 180, y: 110, zoom: 1.4 }],
      under: (c) => hole(c, 200, 140, 22, 6),
      cast: [
        prima([{ t: 0, x: 222, y: 140, s: 0.9, bend: 0 }, { t: 9, x: 222, y: 140, s: 0.9, bend: 1 }, { t: 13, x: 222, y: 140, s: 0.9, bend: 1 }]),
        dancer('v', V, seq({ y: 148 }, [[0, 'stand', { x: 96 }], [3, 'reach', { x: 100 }], [8, 'grief', { x: 100 }], [13, 'reach', { x: 102 }]])),
        dancer('m', MG, [{ t: 0, pose: 'stand', x: 198, y: 140, spin: LEFT }, { t: 6, pose: 'arms_open', x: 198, y: 146, spin: LEFT }, { t: 13, pose: 'arms_up', x: 198, y: 160, spin: LEFT, alpha: 0 }]),
      ],
      lines: [[0.5, 'Mira? Mira, I heard you.', 'Vesna'], [4, 'I heard you. You said it. You said it.', 'Vesna'], [8.4, 'It was the first word I had said in a year. It was the last one I needed.']],
    },
    {
      dur: 11, bg: 'paper', fx: { snow: 20, wind: 6 },
      cam: [{ t: 0, x: 160, y: 90, zoom: 1 }, { t: 11, x: 170, y: 80, zoom: 1.1 }],
      over: (c, t, k) => swanFlight(c, 60 + k * 220, 130 - k * 90 + Math.sin(t * 2) * 3, 1.4, t),
      lines: [[0.5, 'The Prima bowed to me, and let me go.'], [5, 'In spring a girl with a red scarf taught the new students both parts. She wears a locket with a lock of black hair in it. She still talks to it.']],
    },
  ],

  thaw: [
    {
      dur: 9, bg: 'night_ice', music: 'drone_lake', fx: { snow: 50, wind: 26 },
      cam: [{ t: 0, x: 170, y: 104, zoom: 1.2 }, { t: 9, x: 110, y: 104, zoom: 1.1 }],
      under: (c) => hole(c, 200, 140, 22, 6),
      cast: [dancer('v', V, seq({ y: 148, spin: LEFT }, [[0, 'stand', { x: 170 }], [0.6, 'reach', { x: 160 }], [1.2, 'arabesque', { x: 146 }], [1.8, 'reach', { x: 130 }], [2.4, 'arabesque', { x: 114 }], [3, 'reach', { x: 98 }], [3.6, 'arabesque', { x: 82 }], [5, 'reach', { x: 50 }], [9, 'reach', { x: -10 }]]))],
      lines: [[0.5, 'She ran. She did not look back.'], [4.5, 'She never knew it was me.']],
    },
    {
      dur: 12, bg: 'under', fx: { bubbles: 18 },
      cam: [{ t: 0, x: 160, y: 104, zoom: 1.05 }, { t: 12, x: 160, y: 110, zoom: 1.2 }],
      cast: [0, 1, 2, 3, 4, 5].map((i) => dancer(`g${i}`, MG, [{ t: 0, pose: i % 2 ? 'arms_up' : 'arabesque', x: 50 + i * 44, y: 136, spin: i * 0.2 }, { t: 12, pose: i % 2 ? 'arabesque' : 'arms_up', x: 50 + i * 44, y: 134, spin: i * 0.2 + 1 }])),
      lines: [[0.5, 'I dance down here now, in the dark, with the quiet ones.'], [5.5, 'Every winter she comes to the shore, and I watch her. I will always watch her.']],
    },
  ],

  pas_de_deux: [
    {
      dur: 10, bg: 'night_ice', music: 'piano', fx: { snow: 50, wind: 12, breath: ['v'] },
      cam: [{ t: 0, x: 160, y: 104, zoom: 1.2 }, { t: 10, x: 180, y: 116, zoom: 1.7 }],
      under: (c) => hole(c, 182, 142, 22, 6),
      cast: [
        prima([{ t: 0, x: 214, y: 140, s: 0.9, reach: 0 }, { t: 6, x: 214, y: 140, s: 0.9, reach: 1 }, { t: 10, x: 210, y: 140, s: 0.9, reach: 1 }]),
        dancer('v', V, [{ t: 0, pose: 'reach', x: 120, y: 142 }, { t: 5, pose: 'arms_up', x: 178, y: 142 }, { t: 7, pose: 'arms_up', x: 182, y: 156, alpha: 0.6 }, { t: 10, pose: 'arms_up', x: 182, y: 176, alpha: 0 }]),
      ],
      lines: [[0.5, "I'm coming. Nobody else gets you.", 'Vesna'], [5.4, 'She stepped into the water like it was a stage.']],
    },
    {
      dur: 14, bg: 'under', fx: { bubbles: 30 },
      cam: [{ t: 0, x: 160, y: 104, zoom: 1.2 }, { t: 14, x: 160, y: 100, zoom: 1.6 }],
      cast: [
        dancer('v', V, [{ t: 0, pose: 'float', x: 140, y: 120 }, { t: 6, pose: 'embrace', x: 156, y: 126 }, { t: 14, pose: 'embrace', x: 157, y: 128, rot: 6 }]),
        dancer('m', MG, [{ t: 0, pose: 'float', x: 182, y: 124, spin: LEFT }, { t: 6, pose: 'embrace', x: 166, y: 126, spin: LEFT }, { t: 14, pose: 'embrace', x: 165, y: 128, spin: LEFT, rot: -6 }]),
      ],
      over: (c, t, k) => { c.fillStyle = rgba('#e8eef6', k * 0.7); c.fillRect(-100, -40, 520, 46 + k * 20); },
      lines: [[0.5, "She was warm for a long time. Then she wasn't."], [6.5, 'Nobody else, ever. We kept our promise.']],
    },
  ],

  hollow: [
    {
      dur: 12, bg: 'night_ice', music: 'drone_lake', fx: { snow: 40, wind: 8 },
      cam: [{ t: 0, x: 170, y: 106, zoom: 1.3 }, { t: 12, x: 186, y: 114, zoom: 1.6 }],
      under: (c) => hole(c, 190, 142, 22, 6),
      cast: [
        dancer('v', V, [{ t: 0, pose: 'stand', x: 150, y: 142 }, { t: 5, pose: 'arms_up', x: 186, y: 142 }, { t: 8, pose: 'arms_up', x: 190, y: 162, alpha: 0.3 }, { t: 12, pose: 'arms_up', x: 190, y: 172, alpha: 0 }]),
        dancer('m', MG, [{ t: 0, pose: 'stand', x: 236, y: 144, spin: LEFT }, { t: 12, pose: 'stand', x: 236, y: 144, spin: LEFT, alpha: 0.35 }]),
      ],
      lines: [[0.5, 'She walked into the water. I watched.'], [5.5, 'I felt nothing. Then I could not remember what nothing felt like.']],
    },
    {
      dur: 10, bg: 'white', post: { vignette: 0.35, grain: 0.1 },
      frame: (ui, t) => {
        ui.save(); ui.translate(160, 90); ui.rotate(-0.02);
        ui.fillStyle = '#efe8d8'; ui.fillRect(-80, -55, 160, 110);
        ui.strokeStyle = rgba(PAL.moon, 0.35); ui.lineWidth = 0.35;
        for (let y = -38; y < 52; y += 11) { ui.beginPath(); ui.moveTo(-76, y); ui.lineTo(76, y); ui.stroke(); }
        ui.strokeStyle = rgba(PAL.bright, 0.35); ui.beginPath(); ui.moveTo(-64, -54); ui.lineTo(-64, 54); ui.stroke();
        ui.restore();
      },
      lines: [[0.5, 'There was a girl. There was a name. I let go of both.'], [5.5, 'The notebook is blank. It always was.']],
    },
  ],

  // ---- the corridor windows ----------------------------------------------------------------
  window1: [{
    dur: 7, bg: 'window', sfx: [[0.2, 'wind']], fx: { snow: 40, wind: 18 },
    cam: [{ t: 0, x: 160, y: 90, zoom: 1 }, { t: 7, x: 184, y: 104, zoom: 1.25 }],
    under: (c) => { c.save(); c.beginPath(); c.rect(70, 20, 180, 140); c.clip(); hole(c, 190, 126, 10, 2.5); c.restore(); },
    cast: [prima([{ t: 0, x: 196, y: 126, s: 0.32, bend: 0 }, { t: 7, x: 196, y: 126, s: 0.32, bend: 0.25 }])],
    frame: (ui) => windowFrame(ui),
    lines: [[0.4, 'Out on the lake, by the black hole in the ice, someone is standing very still.']],
  }],
  window2: [{
    dur: 7, bg: 'window', sfx: [[0.2, 'sting']], fx: { snow: 40, wind: 18 },
    cam: [{ t: 0, x: 160, y: 90, zoom: 1.05 }, { t: 7, x: 154, y: 110, zoom: 1.45 }],
    under: (c) => { c.save(); c.beginPath(); c.rect(70, 20, 180, 140); c.clip(); hole(c, 190, 126, 10, 2.5); c.restore(); },
    cast: [prima([{ t: 0, x: 150, y: 158, s: 0.72, bend: -0.3 }, { t: 7, x: 152, y: 160, s: 0.76, bend: -0.45 }])],
    frame: (ui) => windowFrame(ui),
    lines: [[0.4, 'Closer. On the shore now. Her neck is too long. Her face is turned up to this window.']],
  }],
};

export function shadowplay(id) {
  const play = PLAYS[id];
  if (!play) return Promise.resolve();
  return runPlay(play);
}

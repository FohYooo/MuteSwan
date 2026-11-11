// Microphone calibration: quiet, normal "run", yelled "run".
import { Input } from '../core/input.js';
import { Font } from '../gfx/font.js';
import { PAL, rgba } from '../gfx/palette.js';
import { Voice } from '../voice/mic.js';
import { deriveThresholds } from '../voice/detectors.js';
import { modal, panel } from './common.js';

// A yell counts when it is clearly above both the room and normal talking.
export function judgeYell(res, y, retries, maxRetries = 2) {
  if (y >= res.floorDb + 15 && y >= res.speechDb + 4) return { verdict: 'ok', yellDb: y };
  return { verdict: retries < maxRetries ? 'retry' : 'unheard' };
}

const pct = (arr, p) => { if (!arr.length) return -100; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

const STEP = {
  intro: { title: 'Mira cannot speak.', body: 'You will be her voice. Let the game hear you once, so it knows the difference between your voice and a yell.', hint: 'Z: begin    X: play with the keyboard instead' },
  init: { title: 'Asking for the microphone…', body: 'If your computer asks for permission, allow it.' },
  quiet: { title: 'Stay quiet.', body: 'Three seconds of silence. Listen to the room.' },
  speak: { title: 'Say "run" in your normal voice.', body: 'Just once, the way you would talk.' },
  yell: { title: 'Now YELL it.  "RUN!"', body: 'As loud as you would to save your own life.' },
  retry: { title: 'Louder.', body: 'That was not much louder than talking. Once more — yell "RUN!"' },
  done: { title: 'She hears you.', body: 'When Mira freezes, yell RUN three times. When she hides, make no sound at all.', hint: 'Z: continue' },
  unheard: { title: 'We could not hear a yell.', body: 'The microphone may be muted, too far away, or too quiet. You can try again, or play with the keyboard instead.', hint: 'Z: try again    X: play with the keyboard' },
  nomic: { title: 'No microphone.', body: 'You will play with the keyboard: type R-U-N to run, hold Space to hold your breath, hold N and tap O to scream.', hint: 'Z: continue' },
};

export function calibrate(store) {
  let phase = 'intro';
  let t = 0;
  let level = -100;
  let frames = [];
  let words = 0;
  let retries = 0;
  const res = {};
  let offF = null, offW = null;
  const finish = (scene, value) => { offF?.(); offW?.(); scene.close(value); };

  return modal({
    opaque: true,
    async update(dt) {
      t += dt;
      if (phase === 'intro') {
        if (Input.pressed('back')) { store.saveSettings({ keyboardMode: true }); phase = 'nomic'; t = 0; }
        if (Input.pressed('ok')) {
          phase = 'init'; t = 0;
          const r = await Voice.init();
          if (r.mic !== 'ok') { store.saveSettings({ keyboardMode: true }); phase = 'nomic'; t = 0; return; }
          Voice.loadWords();
          offF = Voice.onFrame((f) => { level = f.db; frames.push(f.db); });
          offW = Voice.onWord((w) => { if (w.word === 'run') words++; });
          frames = []; phase = 'quiet'; t = 0;
        }
        return;
      }
      if (phase === 'quiet' && t > 3) { res.floorDb = pct(frames, 0.5); frames = []; words = 0; phase = 'speak'; t = 0; }
      else if (phase === 'speak' && (t > 4 || (words > 0 && t > 1.2))) { res.speechDb = pct(frames, 0.92); frames = []; phase = 'yell'; t = 0; }
      else if ((phase === 'yell' || phase === 'retry') && t > 4) {
        const y = pct(frames, 0.95);
        frames = [];
        const j = judgeYell(res, y, retries);
        if (j.verdict === 'retry') { retries++; phase = 'retry'; t = 0; return; }
        if (j.verdict === 'unheard') { phase = 'unheard'; t = 0; return; }
        res.yellDb = j.yellDb;
        const th = deriveThresholds(res);
        store.saveSettings({ calib: { ...res, ...th }, keyboardMode: false });
        phase = 'done'; t = 0;
      } else if (phase === 'unheard' && t > 0.5) {
        if (Input.pressed('ok')) { retries = 0; frames = []; phase = 'quiet'; t = 0; }
        if (Input.pressed('back')) { store.saveSettings({ keyboardMode: true }); phase = 'nomic'; t = 0; }
      } else if ((phase === 'done' || phase === 'nomic') && t > 0.5 && Input.pressed('ok')) {
        finish(this, phase === 'done');
      }
    },
    draw(ctx, ui) {
      ctx.fillStyle = PAL.ink; ctx.fillRect(0, 0, 320, 180);
      const st = STEP[phase];
      Font.draw(ui, st.title, 160, 34, { size: 11, font: 'title', align: 'center', color: phase === 'yell' || phase === 'retry' ? PAL.bright : PAL.bone, spacing: 0.5 });
      Font.draw(ui, st.body, 160, 58, { size: 7, align: 'center', wrap: 250, color: PAL.frost, lineH: 10 });
      if (['quiet', 'speak', 'yell', 'retry'].includes(phase)) {
        panel(ui, 50, 100, 220, 22);
        const x = (db) => 56 + Math.max(0, Math.min(1, (db + 90) / 90)) * 208;
        ui.fillStyle = phase === 'quiet' ? PAL.moon : phase === 'speak' ? PAL.candle : PAL.bright;
        ui.fillRect(56, 106, x(level) - 56, 10);
        ui.fillStyle = rgba(PAL.bone, 0.8);
        for (const k of ['floorDb', 'speechDb']) if (res[k] != null) ui.fillRect(x(res[k]), 103, 0.6, 16);
        const left = Math.max(0, (phase === 'quiet' ? 3 : 4) - t);
        Font.draw(ui, `${left.toFixed(1)} s`, 160, 128, { size: 6, align: 'center', color: PAL.grey });
      }
      if (st.hint) Font.draw(ui, st.hint, 160, 156, { size: 6, align: 'center', color: PAL.candle, alpha: 0.6 + Math.sin(t * 3) * 0.3 });
    },
  });
}

// Settings: voice check, keyboard mode, volume, fullscreen, recalibrate.
import { Input } from '../core/input.js';
import { Font } from '../gfx/font.js';
import { PAL } from '../gfx/palette.js';
import { Audio } from '../audio/synth.js';
import { modal, panel, cursor } from './common.js';

const CHECKS = ['normal', 'strict', 'off'];
const CHECK_LABEL = { normal: 'Normal — two of three must be "run"', strict: 'Strict — every shout must be "run"', off: 'Off — any loud shout counts' };

export function toggleFullscreen() {
  if (globalThis.MS_ELECTRON?.toggleFullscreen) return globalThis.MS_ELECTRON.toggleFullscreen();
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

export function settings(store, { onRecalibrate, onKeyboardOff } = {}) {
  let s = store.loadSettings();
  let sel = 0;
  let t = 0;
  const rows = ['voice', 'keys', 'volume', 'fullscreen', 'calib', 'back'];
  const save = (patch) => {
    const was = s.keyboardMode;
    store.saveSettings(patch);
    s = store.loadSettings();
    if (was && !s.keyboardMode) onKeyboardOff?.();
  };
  return modal({
    async update(dt) {
      t += dt;
      if (this.busy) return;
      if (Input.pressed('up')) sel = (sel + rows.length - 1) % rows.length;
      if (Input.pressed('down')) sel = (sel + 1) % rows.length;
      const dir = Input.pressed('left') ? -1 : Input.pressed('right') ? 1 : 0;
      const row = rows[sel];
      if (dir) {
        Audio.sfx('click_pointe');
        if (row === 'voice') save({ voiceCheck: CHECKS[(CHECKS.indexOf(s.voiceCheck) + dir + 3) % 3] });
        if (row === 'keys') save({ keyboardMode: !s.keyboardMode });
        if (row === 'volume') { save({ volume: Math.max(0, Math.min(1, Math.round((s.volume + dir * 0.1) * 10) / 10)) }); Audio.setVolume(s.volume); }
      }
      if (Input.pressed('ok')) {
        Audio.sfx('page');
        if (row === 'keys') save({ keyboardMode: !s.keyboardMode });
        if (row === 'voice') save({ voiceCheck: CHECKS[(CHECKS.indexOf(s.voiceCheck) + 1) % 3] });
        if (row === 'fullscreen') toggleFullscreen();
        if (row === 'calib' && onRecalibrate) { this.busy = true; await onRecalibrate(); s = store.loadSettings(); this.busy = false; }
        if (row === 'back') this.close();
      }
      if (Input.pressed('back')) this.close();
    },
    draw(ctx, ui) {
      panel(ui, 30, 20, 260, 140, { alpha: 0.95 });
      Font.draw(ui, 'Settings', 160, 28, { size: 9, font: 'title', align: 'center', color: PAL.frost, spacing: 1 });
      const vals = {
        voice: `Voice check:  ${CHECK_LABEL[s.voiceCheck]}`,
        keys: `Keyboard instead of microphone:  ${s.keyboardMode ? 'On' : 'Off'}`,
        volume: `Volume:  ${'■'.repeat(Math.round(s.volume * 10))}${'□'.repeat(10 - Math.round(s.volume * 10))}`,
        fullscreen: 'Toggle fullscreen (F11)',
        calib: `Calibrate microphone${s.calib ? '' : '  (not done yet)'}`,
        back: 'Back',
      };
      rows.forEach((r, i) => {
        const y = 48 + i * 15;
        if (i === sel) cursor(ui, 42, y + 1.8, t);
        Font.draw(ui, vals[r], 50, y, { size: 6.8, color: i === sel ? PAL.bone : PAL.grey });
      });
      Font.draw(ui, '←/→ change   Z select   X back', 160, 148, { size: 5, align: 'center', color: PAL.grey, shadow: false });
    },
  });
}

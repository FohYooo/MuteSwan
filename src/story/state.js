// Story state, inventory, the Ledger, checkpoints, settings and endings. Pure + storage-injected.
import { createLedger } from './ledger.js';

export const ROOM_IDS = ['dorm', 'corridor', 'rehearsal', 'costume', 'office', 'bath', 'theatre', 'lake'];
const KEY = { checkpoint: 'muteswan.checkpoint', settings: 'muteswan.settings', endings: 'muteswan.endings', wrong: 'muteswan.wrongends' };
const DEFAULT_SETTINGS = { voiceCheck: 'normal', volume: 0.8, calib: null, keyboardMode: false, fullscreen: false };

export function createState() {
  return { flags: {}, ledger: createLedger(), inv: [], windowLooks: 0, room: 'dorm', spawn: 'bed' };
}

export function give(state, item) { if (!state.inv.includes(item)) state.inv.push(item); }
export function has(state, item) { return state.inv.includes(item); }
export function take(state, item) { state.inv = state.inv.filter((i) => i !== item); }


function validState(s) {
  return s && typeof s === 'object' && ROOM_IDS.includes(s.room) && s.flags && typeof s.flags === 'object' && !Array.isArray(s.flags)
    && Array.isArray(s.inv) && typeof s.spawn === 'string';
}

export function Store(storage = globalThis.localStorage) {
  const read = (k) => { try { return storage ? storage.getItem(k) : null; } catch { return null; } };
  const write = (k, v) => { try { storage?.setItem(k, v); } catch { /* storage unavailable */ } };
  const readJSON = (k, fallback) => { const raw = read(k); if (raw == null) return fallback; try { return JSON.parse(raw); } catch { return fallback; } };
  const list = (k) => { const v = readJSON(k, []); return Array.isArray(v) ? v : []; };
  const addTo = (k, id) => { const l = list(k); if (!l.includes(id)) { l.push(id); write(k, JSON.stringify(l)); } };

  return {
    saveCheckpoint(state) { write(KEY.checkpoint, JSON.stringify(state)); },
    loadCheckpoint() {
      const s = readJSON(KEY.checkpoint, null);
      if (!validState(s)) return null;
      const ledger = s.ledger && typeof s.ledger.devotion === 'number' && typeof s.ledger.distance === 'number' ? s.ledger : createLedger();
      return { windowLooks: 0, ...s, ledger };
    },
    clearCheckpoint() { try { storage?.removeItem(KEY.checkpoint); } catch { /* ignore */ } },
    saveSettings(obj) { write(KEY.settings, JSON.stringify({ ...this.loadSettings(), ...obj })); },
    loadSettings() {
      const raw = readJSON(KEY.settings, {});
      const s = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
      const num = (v) => typeof v === 'number' && Number.isFinite(v);
      const calibOk = s.calib && typeof s.calib === 'object' && num(s.calib.shoutDb) && num(s.calib.quietDb);
      return {
        ...DEFAULT_SETTINGS,
        voiceCheck: ['normal', 'strict', 'off'].includes(s.voiceCheck) ? s.voiceCheck : 'normal',
        volume: num(s.volume) ? Math.max(0, Math.min(1, s.volume)) : DEFAULT_SETTINGS.volume,
        calib: calibOk ? s.calib : null,
        keyboardMode: s.keyboardMode === true,
        fullscreen: s.fullscreen === true,
      };
    },
    recordEnding(id) { addTo(KEY.endings, id); },
    endingsSeen() { return list(KEY.endings); },
    recordWrongEnd(id) { addTo(KEY.wrong, id); },
    wrongEndsSeen() { return list(KEY.wrong); },
  };
}

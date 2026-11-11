// Mic (or AudioBuffer) -> ~20 ms frames {t, db, voiced, hz} + recognized words.
// Touches the DOM / Web Audio only inside functions so Node can import it for tests.
import { pitchOf } from './detectors.js';
import { createRecognizer, defaultCreateModel } from './words.js';

export const MODEL_URL = new URL('../../vendor/model/vosk-model-small-en-us-0.15.tar.gz', import.meta.url).href;
const CONSTRAINTS = { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } };

export function createVoice() {
  const frameSubs = new Set();
  const wordSubs = new Set();
  const statusSubs = new Set();
  const status = { mic: 'off', words: 'off' };
  let ctx = null;
  let proc = null;
  let micSource = null;
  let micStream = null;
  let model = null;
  let recognizer = null;
  const ring = new Float32Array(2048);
  let ringPos = 0;
  let fakeT = 0;

  const now = () => (ctx ? ctx.currentTime * 1000 : (globalThis.performance?.now() ?? Date.now()));
  const setStatus = (k, v) => { status[k] = v; statusSubs.forEach((cb) => cb({ ...status })); };
  const emitFrame = (f) => frameSubs.forEach((cb) => cb(f));
  const emitWord = (word) => { const w = { word, t: now() }; wordSubs.forEach((cb) => cb(w)); };

  function ensureContext() {
    if (ctx) return ctx;
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    ctx = new AC();
    proc = ctx.createScriptProcessor(1024, 1, 1);
    const sink = ctx.createGain();
    sink.gain.value = 0;
    proc.connect(sink).connect(ctx.destination);
    proc.onaudioprocess = (e) => {
      const data = e.inputBuffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i];
        ring[ringPos] = data[i];
        ringPos = (ringPos + 1) % ring.length;
      }
      const rms = Math.sqrt(sum / data.length);
      const db = rms > 0 ? Math.max(-100, 20 * Math.log10(rms)) : -100;
      const ordered = new Float32Array(ring.length);
      ordered.set(ring.subarray(ringPos));
      ordered.set(ring.subarray(0, ringPos), ring.length - ringPos);
      const p = db > -70 ? pitchOf(ordered, ctx.sampleRate) : { hz: 0, confidence: 0 };
      emitFrame({ t: e.playbackTime * 1000 || now(), db, voiced: p.confidence >= 0.5, hz: p.hz });
      recognizer?.accept(e.inputBuffer);
    };
    if (model && !recognizer) recognizer = createRecognizer(model, ctx.sampleRate, emitWord);
    return ctx;
  }

  return {
    status,
    get context() { return ctx; },
    ensureContext,
    async resume() { if (ctx && ctx.state !== 'running') await ctx.resume().catch(() => {}); },

    async init({ getUserMedia = globalThis.navigator?.mediaDevices?.getUserMedia?.bind(globalThis.navigator.mediaDevices) } = {}) {
      const live = micStream && micStream.getAudioTracks().some((tr) => tr.readyState === 'live');
      if (live && micSource) { setStatus('mic', 'ok'); return { mic: 'ok' }; }
      if (!getUserMedia) { setStatus('mic', 'none'); return { mic: 'none' }; }
      let stream;
      try {
        stream = await getUserMedia(CONSTRAINTS);
      } catch (err) {
        const mic = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError') ? 'denied' : 'none';
        setStatus('mic', mic);
        return { mic };
      }
      try {
        ensureContext();
        if (micSource) { try { micSource.disconnect(); } catch { /* already gone */ } }
        micStream?.getTracks().forEach((tr) => tr.stop());
        micStream = stream;
        micSource = ctx.createMediaStreamSource(stream);
        micSource.connect(proc);
        stream.getAudioTracks().forEach((tr) => { tr.onended = () => setStatus('mic', 'none'); });
        await this.resume();
      } catch {
        setStatus('mic', 'none');
        return { mic: 'none' };
      }
      setStatus('mic', 'ok');
      return { mic: 'ok' };
    },

    async loadWords(url = MODEL_URL, { createModel = defaultCreateModel } = {}) {
      if (status.words === 'ok' || status.words === 'loading') return status.words;
      setStatus('words', 'loading');
      try {
        model = await createModel(url);
        if (ctx) recognizer = createRecognizer(model, ctx.sampleRate, emitWord);
        setStatus('words', 'ok');
      } catch {
        setStatus('words', 'failed');
      }
      return status.words;
    },

    // Play a decoded buffer through the analysis path instead of the mic (tests, voice lab).
    feedBuffer(audioBuffer) {
      ensureContext();
      return new Promise((resolve) => {
        const src = ctx.createBufferSource();
        src.buffer = audioBuffer;
        src.connect(proc);
        src.onended = () => { src.disconnect(); setTimeout(resolve, 300); };
        src.start();
      });
    },

    onFrame(cb) { frameSubs.add(cb); return () => frameSubs.delete(cb); },
    onWord(cb) { wordSubs.add(cb); return () => wordSubs.delete(cb); },
    onStatus(cb) { statusSubs.add(cb); return () => statusSubs.delete(cb); },

    fake: {
      word(w) { emitWord(w); },
      // Emit frames of a given level; real-time by default, or all at once with {instant: true}.
      level(db, ms, voiced = true, { instant = false } = {}) {
        const n = Math.max(1, Math.round(ms / 20));
        // instant fakes run on their own 20 ms clock (deterministic tests); timed fakes follow real time
        if (!instant) fakeT = Math.max(fakeT, now());
        if (instant) {
          for (let i = 0; i < n; i++) { emitFrame({ t: fakeT, db, voiced, hz: voiced ? 220 : 0 }); fakeT += 20; }
          return Promise.resolve();
        }
        return new Promise((resolve) => {
          let i = 0;
          const id = setInterval(() => {
            emitFrame({ t: fakeT, db, voiced, hz: voiced ? 220 : 0 });
            fakeT += 20;
            if (++i >= n) { clearInterval(id); resolve(); }
          }, 20);
        });
      },
    },
  };
}

export const Voice = createVoice();

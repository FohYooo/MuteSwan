// Offline word recognition with vosk-browser (UMD global `Vosk`, loaded on demand).
export const GRAMMAR = ['run', 'no', '[unk]'];
const TRACKED = ['run', 'no'];

// Pure: partial results repeat earlier words; emit only the increase per word.
export function diffWords(prev, text) {
  const counts = { ...prev };
  const words = [];
  const toks = String(text || '').toLowerCase().split(/\s+/).filter(Boolean);
  for (const w of TRACKED) {
    const n = toks.filter((t) => t === w).length;
    const before = prev[w] || 0;
    for (let i = before; i < n; i++) words.push(w);
    counts[w] = Math.max(before, n);
  }
  return { words, counts };
}

export const VOSK_SRC = new URL('../../vendor/vosk.js', import.meta.url).href;

let voskPromise = null;
export function loadVoskScript(src = VOSK_SRC) {
  if (globalThis.Vosk) return Promise.resolve(globalThis.Vosk);
  if (!voskPromise) {
    voskPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => (globalThis.Vosk ? resolve(globalThis.Vosk) : reject(new Error('Vosk global missing')));
      s.onerror = () => reject(new Error(`could not load ${src}`));
      document.head.appendChild(s);
    });
  }
  return voskPromise;
}

export async function defaultCreateModel(url) {
  const Vosk = await loadVoskScript();
  const abs = new URL(url, globalThis.location?.href).href; // the worker is a blob: URL
  return Vosk.createModel(abs);
}

// Wraps a model + recognizer; onWord(word) fires once per newly recognized word.
export function createRecognizer(model, sampleRate, onWord) {
  const rec = new model.KaldiRecognizer(sampleRate, JSON.stringify(GRAMMAR));
  let counts = { run: 0, no: 0 };
  rec.on('partialresult', (m) => {
    const r = diffWords(counts, m.result.partial);
    counts = r.counts;
    r.words.forEach(onWord);
  });
  rec.on('result', (m) => {
    const r = diffWords(counts, m.result.text);
    r.words.forEach(onWord);
    counts = { run: 0, no: 0 };
  });
  return {
    accept(audioBuffer) { try { rec.acceptWaveform(audioBuffer); } catch { /* recognizer gone */ } },
    remove() { try { rec.remove(); } catch { /* ignore */ } },
  };
}

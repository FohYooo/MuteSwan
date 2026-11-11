// Every sound in MUTE SWAN is synthesized here. No audio files.
// Swan Lake theme: Tchaikovsky, 1876 (public domain), arranged as a detuned music box.

// [midi, beats]; 0 = rest. B minor.
export const THEME = [
  [78, 4], [71, 0.5], [73, 0.5], [74, 0.5], [76, 0.5],
  [78, 3], [74, 1], [78, 3], [74, 1], [78, 3], [71, 1],
  [74, 1], [71, 1], [67, 1], [74, 1], [71, 6], [0, 2],
  [78, 4], [71, 0.5], [73, 0.5], [74, 0.5], [76, 0.5],
  [78, 3], [74, 1], [78, 3], [74, 1], [78, 3], [71, 1],
  [74, 1], [71, 1], [67, 1], [71, 1], [64, 2], [66, 2], [71, 6], [0, 4],
];
// bass roots per 4 beats, looping alongside the theme
const BASS = [47, 42, 43, 40, 47, 42, 43, 42];

const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);

function noiseBuffer(ac, seconds = 2) {
  const b = ac.createBuffer(1, Math.floor(ac.sampleRate * seconds), ac.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function impulse(ac, seconds = 2.8, decay = 2.6) {
  const len = Math.floor(ac.sampleRate * seconds);
  const b = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay;
  }
  return b;
}

// --- voices ---------------------------------------------------------------

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function plink(ac, out, t, hz, vel = 0.25, decay = 1.4) {
  const g = ac.createGain();
  env(g, t, 0.004, vel, decay);
  g.connect(out);
  for (const [mult, amp] of [[1, 1], [3.01, 0.22], [5.4, 0.08]]) {
    const o = ac.createOscillator();
    const og = ac.createGain();
    o.frequency.value = hz * mult * (1 + (Math.random() - 0.5) * 0.012);
    og.gain.value = amp;
    o.connect(og).connect(g);
    o.start(t);
    o.stop(t + decay + 0.1);
  }
}

function pianoNote(ac, out, t, hz, vel = 0.18, decay = 2.4) {
  const g = ac.createGain();
  env(g, t, 0.006, vel, decay);
  const f = ac.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(hz * 6, t);
  f.frequency.exponentialRampToValueAtTime(hz * 1.5, t + decay);
  f.connect(g).connect(out);
  for (const [type, mult, amp] of [['triangle', 1, 1], ['sine', 2, 0.35], ['sine', 0.5, 0.2]]) {
    const o = ac.createOscillator();
    const og = ac.createGain();
    o.type = type;
    o.frequency.value = hz * mult;
    og.gain.value = amp;
    o.connect(og).connect(f);
    o.start(t);
    o.stop(t + decay + 0.1);
  }
}

function noiseHit(ac, out, t, { dur = 0.1, type = 'bandpass', f0 = 1000, f1 = f0, q = 1, vel = 0.3, attack = 0.002 }) {
  const src = ac.createBufferSource();
  src.buffer = SYN.noise || (SYN.noise = noiseBuffer(ac));
  const f = ac.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ac.createGain();
  env(g, t, attack, vel, dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random());
  src.stop(t + dur + attack + 0.05);
}

function tone(ac, out, t, { type = 'sine', f0 = 100, f1 = f0, dur = 0.3, vel = 0.3, attack = 0.005 }) {
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(10, f1), t + dur);
  const g = ac.createGain();
  env(g, t, attack, vel, dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + attack + 0.05);
}

const SYN = { noise: null };

// --- sound effects ----------------------------------------------------------

export const SFX = {
  step: (ac, o, t) => noiseHit(ac, o, t, { dur: 0.06, type: 'lowpass', f0: 500, f1: 200, vel: 0.08 }),
  click_pointe: (ac, o, t) => {
    noiseHit(ac, o, t, { dur: 0.025, type: 'highpass', f0: 3000, vel: 0.35 });
    tone(ac, o, t, { f0: 1900, f1: 1500, dur: 0.05, vel: 0.12 });
  },
  door: (ac, o, t) => {
    tone(ac, o, t, { f0: 90, f1: 45, dur: 0.35, vel: 0.5 });
    tone(ac, o, t + 0.05, { type: 'sawtooth', f0: 210, f1: 140, dur: 0.5, vel: 0.05 });
  },
  locked: (ac, o, t) => { for (let i = 0; i < 3; i++) noiseHit(ac, o, t + i * 0.07, { dur: 0.04, f0: 1800, q: 4, vel: 0.25 }); },
  pickup: (ac, o, t) => { plink(ac, o, t, midiHz(83), 0.2, 0.8); plink(ac, o, t + 0.12, midiHz(90), 0.15, 1); },
  page: (ac, o, t) => noiseHit(ac, o, t, { dur: 0.25, f0: 800, f1: 3500, q: 0.7, vel: 0.12, attack: 0.05 }),
  creak: (ac, o, t) => {
    const os = ac.createOscillator();
    os.type = 'sawtooth';
    os.frequency.setValueAtTime(95, t);
    for (let i = 1; i < 8; i++) os.frequency.linearRampToValueAtTime(85 + Math.random() * 40, t + i * 0.1);
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 6;
    const g = ac.createGain(); env(g, t, 0.05, 0.15, 0.8);
    os.connect(f).connect(g).connect(o); os.start(t); os.stop(t + 1);
  },
  ice_crack: (ac, o, t) => {
    for (let i = 0; i < 6; i++) noiseHit(ac, o, t + i * 0.05 + Math.random() * 0.04, { dur: 0.08, f0: 4000 - i * 500, f1: 900, q: 3, vel: 0.4 });
    tone(ac, o, t, { f0: 70, f1: 30, dur: 1.6, vel: 0.5 });
  },
  splash: (ac, o, t) => noiseHit(ac, o, t, { dur: 1.1, type: 'lowpass', f0: 5000, f1: 300, vel: 0.5, attack: 0.01 }),
  sting: (ac, o, t) => {
    for (const m of [50, 51, 56, 57, 62]) tone(ac, o, t, { type: 'sawtooth', f0: midiHz(m), dur: 1.6, vel: 0.06, attack: 0.01 });
    noiseHit(ac, o, t, { dur: 0.4, type: 'highpass', f0: 2000, vel: 0.2 });
  },
  gore: (ac, o, t) => {
    for (let i = 0; i < 4; i++) noiseHit(ac, o, t + i * 0.06, { dur: 0.12, type: 'lowpass', f0: 900 - i * 150, f1: 150, q: 8, vel: 0.35 });
    tone(ac, o, t, { f0: 60, f1: 35, dur: 0.5, vel: 0.5 });
  },
  breath: (ac, o, t) => noiseHit(ac, o, t, { dur: 0.7, f0: 600, f1: 1400, q: 0.8, vel: 0.15, attack: 0.25 }),
  scream_mark: (ac, o, t) => {
    tone(ac, o, t, { type: 'square', f0: 1320, f1: 1250, dur: 0.25, vel: 0.06 });
    tone(ac, o, t, { f0: 110, f1: 55, dur: 0.4, vel: 0.5 });
  },
  fail: (ac, o, t) => {
    tone(ac, o, t, { f0: 80, f1: 25, dur: 2.2, vel: 0.6 });
    tone(ac, o, t, { type: 'sawtooth', f0: 400, f1: 60, dur: 1.8, vel: 0.08 });
  },
  wind: (ac, o, t) => noiseHit(ac, o, t, { dur: 3, f0: 300, f1: 900, q: 1.5, vel: 0.12, attack: 1.2 }),
  heartbeat: (ac, o, t) => {
    tone(ac, o, t, { f0: 60, f1: 38, dur: 0.18, vel: 0.7, attack: 0.004 });
    tone(ac, o, t + 0.22, { f0: 52, f1: 34, dur: 0.2, vel: 0.5, attack: 0.004 });
  },
  piano_note: (ac, o, t, { midi = 71 } = {}) => pianoNote(ac, o, t, midiHz(midi)),
  box_note: (ac, o, t, { midi = 83 } = {}) => plink(ac, o, t, midiHz(midi)),
};

// --- music tracks: each returns {stop(t)} and schedules itself -------------

function themeTrack(ac, out, { voice, octave = 0, bpm = 66, drag = 0.06, bass = false }) {
  let i = 0;
  let beat = 0;
  let next = ac.currentTime + 0.1;
  let bassBeat = 0;
  let alive = true;
  const spb = 60 / bpm;
  const timer = setInterval(() => {
    while (alive && next < ac.currentTime + 0.4) {
      const [m, beats] = THEME[i];
      if (m) voice(ac, out, next, midiHz(m + octave));
      if (bass && beat >= bassBeat) {
        const root = BASS[Math.floor(bassBeat / 4) % BASS.length];
        pianoNote(ac, out, next, midiHz(root), 0.1, 3.5);
        bassBeat += 4;
      }
      beat += beats;
      next += beats * spb * (1 + Math.random() * drag);
      i = (i + 1) % THEME.length;
      if (i === 0) { beat = 0; bassBeat = 0; }
    }
  }, 100);
  return { stop() { alive = false; clearInterval(timer); } };
}

function droneTrack(ac, out, { roots = [38, 45], cutoff = 260, drips = false, wind = false, glass = false }) {
  const nodes = [];
  const g = ac.createGain();
  g.gain.value = 0.07;
  const f = ac.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = cutoff;
  f.connect(g).connect(out);
  const lfo = ac.createOscillator();
  const lfoG = ac.createGain();
  lfo.frequency.value = 0.07;
  lfoG.gain.value = cutoff * 0.4;
  lfo.connect(lfoG).connect(f.frequency);
  lfo.start();
  nodes.push(lfo);
  for (const r of roots) {
    for (const det of [-7, 6]) {
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = midiHz(r);
      o.detune.value = det;
      o.connect(f);
      o.start();
      nodes.push(o);
    }
  }
  let alive = true;
  const timer = setInterval(() => {
    if (!alive) return;
    const t = ac.currentTime + 0.05;
    if (drips && Math.random() < 0.25) tone(ac, out, t, { f0: 1400 + Math.random() * 900, f1: 400, dur: 0.12, vel: 0.05 });
    if (wind && Math.random() < 0.12) SFX.wind(ac, out, t);
    if (glass && Math.random() < 0.06) plink(ac, out, t, midiHz(86 + [0, 1, 5, 6][Math.floor(Math.random() * 4)]), 0.04, 3);
    if (wind && Math.random() < 0.03) SFX.ice_crack(ac, out, t);
  }, 500);
  return {
    stop(t) {
      alive = false;
      clearInterval(timer);
      nodes.forEach((n) => { try { n.stop(t + 0.1); } catch { /* already stopped */ } });
    },
  };
}

function chaseTrack(ac, out) {
  const strings = droneTrack(ac, out, { roots: [50, 51, 57], cutoff: 1400 });
  let next = ac.currentTime + 0.05;
  let n = 0;
  let alive = true;
  const timer = setInterval(() => {
    while (alive && next < ac.currentTime + 0.3) {
      tone(ac, out, next, { f0: 90, f1: 40, dur: 0.18, vel: n % 2 ? 0.3 : 0.55 });
      if (n % 4 === 3) noiseHit(ac, out, next, { dur: 0.05, type: 'highpass', f0: 4000, vel: 0.12 });
      next += 0.27;
      n++;
    }
  }, 80);
  return { stop(t) { alive = false; clearInterval(timer); strings.stop(t); } };
}

const TRACKS = {
  musicbox: (ac, out) => themeTrack(ac, out, { voice: (a, o, t, hz) => plink(a, o, t, hz * 2, 0.22, 1.6), bpm: 62, drag: 0.12 }),
  piano: (ac, out) => themeTrack(ac, out, { voice: (a, o, t, hz) => pianoNote(a, o, t, hz, 0.16, 2.6), bpm: 58, drag: 0.04, bass: true }),
  drone_school: (ac, out) => droneTrack(ac, out, { roots: [38, 45], cutoff: 240, glass: true }),
  drone_bath: (ac, out) => droneTrack(ac, out, { roots: [33, 40], cutoff: 180, drips: true }),
  drone_lake: (ac, out) => droneTrack(ac, out, { roots: [35, 42], cutoff: 200, wind: true, glass: true }),
  chase: (ac, out) => chaseTrack(ac, out),
};

// --- the Audio facade -------------------------------------------------------

function buildGraph(ac) {
  const master = ac.createGain();
  master.gain.value = 0.8;
  const comp = ac.createDynamicsCompressor();
  master.connect(comp).connect(ac.destination);
  const duck = ac.createGain();
  duck.connect(master);
  const dry = ac.createGain();
  dry.connect(duck);
  const verb = ac.createConvolver();
  verb.buffer = impulse(ac);
  const wet = ac.createGain();
  wet.gain.value = 0.35;
  verb.connect(wet).connect(duck);
  const bus = ac.createGain();
  bus.connect(dry);
  bus.connect(verb);
  return { master, duck, bus };
}

export const Audio = {
  ac: null,
  graph: null,
  muted: false,
  current: null,
  currentName: null,
  hb: null,

  init({ muted = false } = {}) {
    this.muted = muted;
    if (muted) return;
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    this.ac = new AC();
    this.graph = buildGraph(this.ac);
    const unlock = () => { this.ac.resume(); };
    addEventListener('keydown', unlock);
    addEventListener('pointerdown', unlock);
  },

  music(name, fadeMs = 1500) {
    if (this.muted || !this.ac || name === this.currentName) return;
    const ac = this.ac;
    const t = ac.currentTime;
    const fade = fadeMs / 1000;
    if (this.current) {
      const { gain, track } = this.current;
      gain.gain.setTargetAtTime(0.0001, t, fade / 3);
      setTimeout(() => { track.stop(ac.currentTime); gain.disconnect(); }, fadeMs + 200);
    }
    this.currentName = name;
    this.current = null;
    if (!name || !TRACKS[name]) return;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.setTargetAtTime(1, t, fade / 3);
    gain.connect(this.graph.bus);
    this.current = { gain, track: TRACKS[name](ac, gain) };
  },

  sfx(name, opts) {
    if (this.muted || !this.ac || !SFX[name]) return;
    SFX[name](this.ac, this.graph.bus, this.ac.currentTime + 0.01, opts);
  },

  heartbeat(bpm) {
    clearInterval(this.hb);
    this.hb = null;
    if (this.muted || !this.ac || !bpm) return;
    const beat = () => SFX.heartbeat(this.ac, this.graph.master, this.ac.currentTime + 0.02);
    beat();
    this.hb = setInterval(beat, 60000 / bpm);
  },

  // level while ducked: 0.15 normally, 0 for HUSH so the speakers cannot give her away
  duck(on, level = 0.15) {
    if (this.muted || !this.ac) return;
    this.graph.duck.gain.setTargetAtTime(on ? level : 1, this.ac.currentTime, 0.05);
  },

  setVolume(v) {
    if (this.muted || !this.ac) return;
    this.graph.master.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), this.ac.currentTime, 0.05);
  },

  // Silent check for tests: render a sound offline and return its peak amplitude.
  async renderTest(name, seconds = 2.5) {
    const OAC = globalThis.OfflineAudioContext;
    const ac = new OAC(1, Math.floor(44100 * seconds), 44100);
    if (SFX[name]) SFX[name](ac, ac.destination, 0.01);
    else if (TRACKS[name]) {
      // tracks schedule via timers against currentTime; render the first notes directly instead
      if (name === 'musicbox' || name === 'piano') for (let i = 0; i < 6; i++) plink(ac, ac.destination, i * 0.3, midiHz(THEME[i][0] || 71));
      else droneTrack(ac, ac.destination, {}).stop(seconds);
    } else throw new Error(`no sound ${name}`);
    SYN.noise = null;
    const buf = await ac.startRendering();
    SYN.noise = null;
    const d = buf.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
    return peak;
  },
  names: () => [...Object.keys(SFX), ...Object.keys(TRACKS)],
};

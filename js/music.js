// Endless lo-fi background music, generated live with the Web Audio API.
// No audio files, no copyright: soft jazzy chords, bass, brushed drums and
// an occasional melody note, at a relaxed 72 bpm.

const BPM = 72;
const BEAT = 60 / BPM;
const SWING = 0.12; // delay of off-beat eighths, in beats

// Dmaj9 – Bm9 – Gmaj9 – A13sus (MIDI notes)
const CHORDS = [
  { bass: 38, notes: [62, 66, 69, 73, 76] },
  { bass: 35, notes: [59, 62, 66, 69, 73] },
  { bass: 43, notes: [59, 62, 66, 69, 71] },
  { bass: 45, notes: [62, 64, 67, 69, 71] },
];
const MELODY = [74, 76, 78, 81, 83, 86]; // D major pentatonic

const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);

export function createMusic(ctx, output) {
  const master = ctx.createGain();
  master.gain.value = 0;
  const warmth = ctx.createBiquadFilter();
  warmth.type = 'lowpass';
  warmth.frequency.value = 2600;
  master.connect(warmth).connect(output);

  const noise = noiseBuffer(ctx);
  let timer = null;
  let nextTime = 0;
  let step = 0; // eighth notes

  function schedule() {
    while (nextTime < ctx.currentTime + 0.25) {
      playStep(step, nextTime);
      const isOff = step % 2 === 1;
      nextTime += BEAT / 2 + (isOff ? -SWING : SWING) * BEAT;
      step = (step + 1) % 64; // 8 bars of 4/4, 2 bars per chord
    }
  }

  function playStep(s, t) {
    const beat = Math.floor(s / 2) % 4;
    const onBeat = s % 2 === 0;
    const chord = CHORDS[Math.floor(s / 16) % CHORDS.length];

    if (s % 16 === 0) pad(chord.notes, t, BEAT * 8);
    if (onBeat && (beat === 0 || beat === 2)) bass(chord.bass, t, BEAT * 1.6);
    if (onBeat && beat === 0) kick(t);
    if (s % 16 === 11) kick(t); // a lazy extra kick
    if (onBeat && (beat === 1 || beat === 3)) snare(t);
    hat(t, onBeat ? 0.05 : 0.03);
    if (!onBeat && Math.random() < 0.18) pluck(MELODY[Math.floor(Math.random() * MELODY.length)], t);
  }

  function voice(type, f, t, dur, peak, attack, filterHz) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    osc.type = type;
    osc.frequency.value = f;
    lp.type = 'lowpass';
    lp.frequency.value = filterHz;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(lp).connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  const pad = (notes, t, dur) =>
    notes.forEach((n, i) => voice('triangle', freq(n) * (1 + (i - 2) * 0.0015), t, dur, 0.035, 0.6, 1400));
  const bass = (n, t, dur) => voice('sine', freq(n), t, dur, 0.22, 0.02, 400);
  const pluck = (n, t) => voice('sine', freq(n), t, 0.9, 0.05, 0.01, 2500);

  function kick(t) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  function noiseHit(t, dur, peak, type, hz) {
    const src = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    src.buffer = noise;
    f.type = type;
    f.frequency.value = hz;
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.02);
  }
  const snare = (t) => noiseHit(t, 0.22, 0.12, 'bandpass', 1800);
  const hat = (t, peak) => noiseHit(t, 0.04, peak, 'highpass', 7000);

  return {
    start() {
      if (timer) return;
      nextTime = ctx.currentTime + 0.1;
      timer = setInterval(schedule, 60);
      master.gain.setTargetAtTime(1, ctx.currentTime, 0.8);
    },
    stop() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    },
    get playing() {
      return !!timer;
    },
  };
}

function noiseBuffer(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

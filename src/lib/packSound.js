// Soundtrack for the pack-opening ceremony — fully synthesized, no audio
// files shipped. The whole ~4s track is rendered ONCE with an
// OfflineAudioContext into a WAV blob and played through an HTMLAudioElement.
//
// Why an <audio> element and not live Web Audio:
//   • iOS mutes Web Audio when the ringer switch is on silent, but treats
//     HTMLMediaElement playback as "media" (like YouTube) — it plays anyway.
//   • Autoplay: the element gets "blessed" by a muted play() inside the first
//     real tap (standard unlock), after which programmatic play() is allowed.
//
// Timeline mirrors the animation:
//   0.0–2.0s  riser whoosh + sub swell (the ball charging)
//   ~1.8s     gain dip (the held-breath dip to black)
//   2.0s      impact: kick + noise burst + golden bell
//   2.55s+    sparkle pings (confetti)

let installed = false;
let blessed = false;
let ready = false;
let rendering = false;
let audioEl = null;

// ─── The score — schedules every node onto the given (offline) context ─────
function scheduleCeremony(ctx) {
  const t0 = 0.05;
  const master = ctx.createGain();
  master.gain.value = 0.6;
  master.connect(ctx.destination);

  // Shared noise buffer (riser + burst)
  const noiseBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 2.2), ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  // — riser whoosh: bandpass noise sweeping up, dipping at the held breath
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.1;
  bp.frequency.setValueAtTime(180, t0);
  bp.frequency.exponentialRampToValueAtTime(2600, t0 + 1.95);
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.0001, t0);
  nGain.gain.exponentialRampToValueAtTime(0.22, t0 + 1.6);
  nGain.gain.exponentialRampToValueAtTime(0.03, t0 + 1.82);
  nGain.gain.exponentialRampToValueAtTime(0.25, t0 + 1.98);
  nGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.5);
  noise.connect(bp).connect(nGain).connect(master);
  noise.start(t0);
  noise.stop(t0 + 2.6);

  // — sub swell under the riser
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(55, t0);
  sub.frequency.exponentialRampToValueAtTime(160, t0 + 1.95);
  const sGain = ctx.createGain();
  sGain.gain.setValueAtTime(0.0001, t0);
  sGain.gain.exponentialRampToValueAtTime(0.12, t0 + 1.7);
  sGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.0);
  sub.connect(sGain).connect(master);
  sub.start(t0);
  sub.stop(t0 + 2.05);

  // — impact at 2.0s: kick drop + bright noise burst
  const tImp = t0 + 2.0;
  const kick = ctx.createOscillator();
  kick.type = 'sine';
  kick.frequency.setValueAtTime(150, tImp);
  kick.frequency.exponentialRampToValueAtTime(42, tImp + 0.28);
  const kGain = ctx.createGain();
  kGain.gain.setValueAtTime(0.5, tImp);
  kGain.gain.exponentialRampToValueAtTime(0.0001, tImp + 0.32);
  kick.connect(kGain).connect(master);
  kick.start(tImp);
  kick.stop(tImp + 0.35);

  const burst = ctx.createBufferSource();
  burst.buffer = noiseBuf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 900;
  const bGain = ctx.createGain();
  bGain.gain.setValueAtTime(0.35, tImp);
  bGain.gain.exponentialRampToValueAtTime(0.0001, tImp + 0.4);
  burst.connect(hp).connect(bGain).connect(master);
  burst.start(tImp);
  burst.stop(tImp + 0.45);

  // — golden bell (root + fifth overtone, long decay)
  [[1318.5, 0.16], [1975.5, 0.07]].forEach(([f, g]) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const og = ctx.createGain();
    og.gain.setValueAtTime(g, tImp + 0.02);
    og.gain.exponentialRampToValueAtTime(0.0001, tImp + 1.5);
    o.connect(og).connect(master);
    o.start(tImp + 0.02);
    o.stop(tImp + 1.55);
  });

  // — confetti sparkle: three quick rising pings
  [2093, 2637, 3135.9].forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    const og = ctx.createGain();
    const ts = t0 + 2.55 + i * 0.09;
    og.gain.setValueAtTime(0.09, ts);
    og.gain.exponentialRampToValueAtTime(0.0001, ts + 0.5);
    o.connect(og).connect(master);
    o.start(ts);
    o.stop(ts + 0.55);
  });
}

// ─── Mono 16-bit WAV encoder ────────────────────────────────────────────────
function audioBufferToWav(buffer) {
  const ch = buffer.getChannelData(0);
  const len = ch.length;
  const bytes = 44 + len * 2;
  const ab = new ArrayBuffer(bytes);
  const v = new DataView(ab);
  const writeStr = (off, s) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF'); v.setUint32(4, bytes - 8, true); writeStr(8, 'WAVE');
  writeStr(12, 'fmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, buffer.sampleRate, true);
  v.setUint32(28, buffer.sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  writeStr(36, 'data'); v.setUint32(40, len * 2, true);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, ch[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return ab;
}

// ─── Render the track once into the shared <audio> element ─────────────────
async function prepare() {
  if (ready || rendering || typeof window === 'undefined') return;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OAC) return;
  rendering = true;
  try {
    const sr = 44100;
    const off = new OAC(1, Math.ceil(sr * 4.2), sr);
    scheduleCeremony(off);
    const rendered = await off.startRendering();
    const url = URL.createObjectURL(new Blob([audioBufferToWav(rendered)], { type: 'audio/wav' }));
    if (!audioEl) audioEl = new Audio();
    audioEl.src = url;
    audioEl.preload = 'auto';
    audioEl.load();
    ready = true;
  } catch { /* no audio available */ } finally {
    rendering = false;
  }
}

// ─── One-time unlock: a muted play() inside the first real tap blesses the
// element, after which programmatic play() is allowed (also on iOS). ────────
export function initAudioUnlock() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  prepare();

  const removeAll = () => {
    window.removeEventListener('touchend', unlock, true);
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('click', unlock, true);
  };
  const unlock = () => {
    try {
      if (!audioEl || !ready) return;   // render not done yet — try next tap
      audioEl.muted = true;
      const p = audioEl.play();
      if (p && p.then) {
        p.then(() => {
          audioEl.pause();
          audioEl.currentTime = 0;
          audioEl.muted = false;
          blessed = true;
          removeAll();
        }).catch(() => { audioEl.muted = false; });
      }
    } catch { /* keep listening */ }
  };

  window.addEventListener('touchend', unlock, true);
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('click', unlock, true);
}

export function playPackSound() {
  try {
    initAudioUnlock();
    if (!audioEl || !ready || !blessed) return;  // never blocks the animation
    audioEl.muted = false;
    audioEl.currentTime = 0;
    audioEl.play().catch(() => {});
  } catch { /* stay silent */ }
}

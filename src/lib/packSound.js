// Synthesized soundtrack for the pack-opening ceremony — Web Audio only, no
// audio files (zero egress, zero licensing). Timeline mirrors the animation:
//   0.0–2.0s  riser whoosh + sub swell (the ball charging)
//   ~1.8s     gain dip (the held-breath dip to black)
//   2.0s      impact: kick + noise burst + golden bell
//   2.55s+    sparkle pings (confetti)
//
// iOS: audio may ONLY start inside a real user gesture. We install a one-time
// global unlock — the first tap anywhere creates the shared AudioContext and
// plays a silent buffer inside the gesture (the standard iOS unlock trick).
// The context is then kept alive, so a ceremony seconds later can sound.
// If no gesture happened yet (cold app open), the ceremony stays silent.

let sharedCtx = null;
let unlockInstalled = false;

export function initAudioUnlock() {
  if (unlockInstalled || typeof window === 'undefined') return;
  unlockInstalled = true;

  const unlock = () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!sharedCtx) sharedCtx = new AC();
      if (sharedCtx.state === 'suspended') sharedCtx.resume().catch(() => {});
      // Silent one-sample buffer played inside the gesture unlocks iOS audio.
      const buf = sharedCtx.createBuffer(1, 1, 22050);
      const src = sharedCtx.createBufferSource();
      src.buffer = buf;
      src.connect(sharedCtx.destination);
      src.start(0);
    } catch { /* no audio available */ }
    if (sharedCtx && sharedCtx.state === 'running') {
      window.removeEventListener('touchend', unlock, true);
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('click', unlock, true);
    }
  };

  window.addEventListener('touchend', unlock, true);
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('click', unlock, true);
}

export function playPackSound() {
  try {
    initAudioUnlock();
    const ctx = sharedCtx;
    // Not unlocked by a gesture yet → stay silent (never throws / blocks UI).
    if (!ctx || ctx.state !== 'running') return;

    const t0 = ctx.currentTime + 0.05;
    const master = ctx.createGain();
    master.gain.value = 0.5;
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

    // Disconnect this ceremony's master after it finishes — the shared
    // context itself stays alive (closing it would lose the iOS unlock).
    setTimeout(() => { try { master.disconnect(); } catch { /* done */ } }, 5200);
  } catch { /* no audio — the ceremony stays silent */ }
}

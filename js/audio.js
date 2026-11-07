// GT.audio — WebAudio engine (two detuned saws through a lowpass, rpm from
// a fake gearbox), tyre-noise loop for sliding, wind, and a few UI beeps.
(function () {
  globalThis.GT = globalThis.GT || {};

  var A = { ctx: null, on: true };

  A.init = function () {
    if (A.ctx) return;
    var C = A.ctx = new (window.AudioContext || window.webkitAudioContext)();
    A.master = C.createGain(); A.master.gain.value = 0.5; A.master.connect(C.destination);

    // ---- engine ----
    A.eng = C.createGain(); A.eng.gain.value = 0;
    A.lp = C.createBiquadFilter(); A.lp.type = 'lowpass'; A.lp.frequency.value = 900;
    A.o1 = C.createOscillator(); A.o1.type = 'sawtooth';
    A.o2 = C.createOscillator(); A.o2.type = 'square'; A.o2.detune.value = -8;
    var eg = C.createGain(); eg.gain.value = 0.32;
    A.o1.connect(eg); A.o2.connect(eg); eg.connect(A.lp); A.lp.connect(A.eng); A.eng.connect(A.master);
    A.o1.start(); A.o2.start();

    // ---- tyre / wind noise: looping white noise buffer through filters ----
    var len = C.sampleRate * 2, buf = C.createBuffer(1, len, C.sampleRate);
    var ch = buf.getChannelData(0);
    for (var i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    function noiseNode(type, freq, gain) {
      var s = C.createBufferSource(); s.buffer = buf; s.loop = true;
      var f = C.createBiquadFilter(); f.type = type; f.frequency.value = freq;
      var g = C.createGain(); g.gain.value = 0;
      s.connect(f); f.connect(g); g.connect(A.master); s.start();
      return { f: f, g: g };
    }
    A.skid = noiseNode('bandpass', 1400, 0);
    A.wind = noiseNode('lowpass', 500, 0);
  };

  // rpm model: v drives a fake 6-speed box; redline drops the shift
  var gearTops = [9, 19, 29, 39, 50, 62, 78];
  A.setEngine = function (v, throttle) {
    if (!A.ctx) return;
    v = Math.abs(v);
    var g = 0; while (g < gearTops.length - 1 && v > gearTops[g]) g++;
    var lo = g === 0 ? 0 : gearTops[g - 1], hi = gearTops[g];
    var frac = (v - lo) / (hi - lo);
    var idle = 1 - Math.min(1, v / 3);                       // stopped: lumpy idle
    var rpm = 0.16 + frac * 0.8 + idle * 0.06 * (1 + Math.sin(performance.now() * 0.02));
    var f = 46 + rpm * 205;
    var t = A.ctx.currentTime;
    A.o1.frequency.setTargetAtTime(f, t, 0.03);
    A.o2.frequency.setTargetAtTime(f * 0.5, t, 0.03);
    A.lp.frequency.setTargetAtTime(420 + rpm * 2300 + throttle * 500, t, 0.05);
    A.eng.gain.setTargetAtTime(0.05 + 0.16 * rpm + 0.1 * throttle * rpm, t, 0.06);
  };
  A.setSkid = function (slip, v) {
    if (!A.ctx) return;
    var x = Math.min(1, Math.max(0, (slip - 1.6) / 9));
    A.skid.g.gain.setTargetAtTime(x * 0.22, A.ctx.currentTime, 0.04);
    A.skid.f.frequency.setTargetAtTime(900 + slip * 120, A.ctx.currentTime, 0.08);
    A.wind.g.gain.setTargetAtTime(Math.min(1, v / 62) * 0.05, A.ctx.currentTime, 0.15);
  };
  A.blip = function (f0, dur, vol) {
    if (!A.ctx) return;
    var t = A.ctx.currentTime;
    var o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = 'square'; o.frequency.value = f0;
    g.gain.setValueAtTime(vol || 0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(A.master); o.start(t); o.stop(t + dur + 0.02);
  };
  A.crash = function (force) {
    if (!A.ctx) return;
    var t = A.ctx.currentTime;
    var src = A.ctx.createBufferSource();
    var n = A.ctx.sampleRate * 0.3, b = A.ctx.createBuffer(1, n, A.ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    src.buffer = b;
    var f = A.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300 + force * 900;
    var g = A.ctx.createGain(); g.gain.value = Math.min(0.6, 0.1 + force * 0.5);
    src.connect(f); f.connect(g); g.connect(A.master); src.start(t);
  };
  A.mute = function (m) { A.on = !m; if (A.master) A.master.gain.value = m ? 0 : 0.5; };

  GT.audio = A;
})();

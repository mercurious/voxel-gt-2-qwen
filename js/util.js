// ── Voxel Touring GT — utility helpers ─────────────────────────────────────
globalThis.GT = globalThis.GT || {};
var GT = globalThis.GT;
GT.util = (function () {
  'use strict';
  var TAU = Math.PI * 2;
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function wrapAngle(a) { a = a % TAU; if (a > Math.PI) a -= TAU; if (a < -Math.PI) a += TAU; return a; }
  function lerpAngle(a, b, t) { return a + wrapAngle(b - a) * t; }

  // deterministic value-noise (2d)
  function hash2(x, y) {
    var h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return h - Math.floor(h);
  }
  function noise2(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    var u = smoothstep(xf), v = smoothstep(yf);
    var a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }
  function fbm2(x, y, oct) {
    var s = 0, amp = 0.5, f = 1;
    for (var i = 0; i < (oct || 4); i++) { s += amp * noise2(x * f, y * f); f *= 2.0; amp *= 0.5; }
    return s;
  }

  // small storage wrapper (works over file:// in most browsers, degrades gracefully)
  var mem = {};
  var store = {
    get: function (k) {
      try { var v = localStorage.getItem('vtgt.' + k); if (v != null) return JSON.parse(v); } catch (e) {}
      return mem[k] !== undefined ? mem[k] : null;
    },
    set: function (k, v) {
      mem[k] = v;
      try { localStorage.setItem('vtgt.' + k, JSON.stringify(v)); } catch (e) {}
    }
  };

  function fmtTime(t) {
    if (t == null || !isFinite(t)) return '--:--.---';
    var m = Math.floor(t / 60), s = t - m * 60;
    return (m > 0 ? m + ':' : '') + (m > 0 && s < 10 ? '0' : '') + s.toFixed(3);
  }

  // catmull-rom on sparse waypoints (used to smooth authored elevation wiggles)
  function smoothSeq(arr, passes) {
    var n = arr.length, a = arr.slice();
    for (var p = 0; p < (passes || 1); p++) {
      var out = a.slice();
      for (var i = 1; i < n - 1; i++) out[i] = (a[i - 1] + 2 * a[i] + a[i + 1]) * 0.25;
      out[0] = a[0]; out[n - 1] = a[n - 1];
      a = out;
    }
    return a;
  }

  return {
    TAU: TAU, clamp: clamp, lerp: lerp, smoothstep: smoothstep,
    wrapAngle: wrapAngle, lerpAngle: lerpAngle,
    hash2: hash2, noise2: noise2, fbm2: fbm2, store: store, fmtTime: fmtTime, smoothSeq: smoothSeq
  };
})();
if (typeof module !== 'undefined') module.exports = GT.util;

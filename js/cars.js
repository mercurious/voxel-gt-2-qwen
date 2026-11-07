// GT.cars — the five garage regulars: parody marques, stats, voxel silhouettes.
// Boxes are [x, y, z, sx, sy, sz, colorIdx] in a local frame:
//   +z = forward, +x = right, +y = up, origin at ground under chassis centre.
// colorIdx -> car.pal: 0 body, 1 dark(rubber/shadow), 2 glass, 3 trim(lights), 4 accent
(function () {
  globalThis.GT = globalThis.GT || {};
  var CARS = [
    {
      id: 'f40', brand: 'Ferario', model: "F40 'Rosso Corsa'", country: 'Italy',
      pal: [[0.78, 0.06, 0.12], [0.08, 0.08, 0.09], [0.12, 0.16, 0.22], [0.9, 0.9, 0.85], [0.55, 0.03, 0.06]],
      hex: '#c8102e',
      mass: 1100, power: 352e3, grip: 1.14, downf: 420, drag: 0.36, brake: 9.2,
      drive: 'RWD', steerMax: 0.52, wheelBase: 2.45, resp: 7.2, oversteer: 1.12,
      // stats for the UI, 0..100
      st: { spd: 88, acc: 86, grip: 78, brake: 82 },
      style: { len: 4.35, wid: 1.92, hgt: 1.14, wedge: 0.75, wing: 0.42, wingSpan: 1.7, roof: 'low' }
    },
    {
      id: 'p911', brand: 'Porsia', model: '911 Turbo', country: 'Germany',
      pal: [[0.86, 0.87, 0.88], [0.09, 0.09, 0.1], [0.14, 0.18, 0.24], [0.95, 0.95, 0.9], [0.6, 0.05, 0.08]],
      hex: '#dfe3e6',
      mass: 1360, power: 309e3, grip: 1.16, downf: 300, drag: 0.39, brake: 9.6,
      drive: 'RWD', steerMax: 0.55, wheelBase: 2.35, resp: 6.6, oversteer: 1.05,
      st: { spd: 76, acc: 72, grip: 90, brake: 90 },
      style: { len: 4.25, wid: 1.85, hgt: 1.28, wedge: 0.35, wing: 0.3, wingSpan: 1.5, roof: 'round' }
    },
    {
      id: 'r34', brand: 'Nisbo', model: 'Skyline GT-R34', country: 'Japan',
      pal: [[0.12, 0.34, 0.72], [0.08, 0.08, 0.09], [0.12, 0.16, 0.22], [0.92, 0.92, 0.9], [0.85, 0.86, 0.88]],
      hex: '#1e5799',
      mass: 1500, power: 331e3, grip: 1.22, downf: 330, drag: 0.38, brake: 9.4,
      drive: 'AWD', steerMax: 0.54, wheelBase: 2.53, resp: 6.8, oversteer: 0.92,
      st: { spd: 80, acc: 84, grip: 88, brake: 84 },
      style: { len: 4.45, wid: 1.88, hgt: 1.26, wedge: 0.45, wing: 0.22, wingSpan: 1.6, roof: 'fast' }
    },
    {
      id: 'a80', brand: 'Toyoda', model: 'Supar A80', country: 'Japan',
      pal: [[0.92, 0.45, 0.06], [0.08, 0.08, 0.09], [0.12, 0.16, 0.22], [0.92, 0.92, 0.9], [0.7, 0.3, 0.03]],
      hex: '#e87400',
      mass: 1510, power: 324e3, grip: 1.12, downf: 300, drag: 0.34, brake: 8.8,
      drive: 'RWD', steerMax: 0.55, wheelBase: 2.55, resp: 6.4, oversteer: 1.08,
      st: { spd: 82, acc: 78, grip: 74, brake: 76 },
      style: { len: 4.5, wid: 1.84, hgt: 1.2, wedge: 0.5, wing: 0.16, wingSpan: 1.5, roof: 'fast' }
    },
    {
      id: 'k5k', brand: 'Lamborini', model: 'Kuntak 5000', country: 'Italy',
      pal: [[0.82, 0.78, 0.66], [0.07, 0.07, 0.08], [0.1, 0.14, 0.2], [0.95, 0.95, 0.92], [0.6, 0.05, 0.05]],
      hex: '#d1c9a5',
      mass: 1210, power: 309e3, grip: 1.06, downf: 460, drag: 0.42, brake: 8.4,
      drive: 'RWD', steerMax: 0.5, wheelBase: 2.5, resp: 6.0, oversteer: 1.2,
      st: { spd: 78, acc: 70, grip: 70, brake: 70 },
      style: { len: 4.15, wid: 1.94, hgt: 1.07, wedge: 0.95, wing: 0.46, wingSpan: 1.9, roof: 'flat' }
    }
  ];

  // procedural voxel sculpture: every car shares a chassis/wheel/cabin grammar,
  // style params bend it into five recognisable silhouettes.
  function buildBoxes(car) {
    var s = car.style, B = [];
    function bx(x, y, z, sx, sy, sz, c) { B.push([x, y, z, sx, sy, sz, c]); }
    var hw = s.wid / 2, hl = s.len / 2;
    var bodyH = s.hgt * (s.roof === 'flat' ? 0.6 : 0.66);
    // lower chassis full length
    bx(0, 0.30, 0, s.wid - 0.1, 0.30, s.len - 0.15, 0);
    // mid body: wedge steps forward (Countach = one long ramp, 911 = blunt tail)
    var steps = 3;
    for (var i = 0; i < steps; i++) {
      var t0 = i / steps, t1 = (i + 1) / steps;
      var zA = -hl + t0 * s.len, zB = -hl + t1 * s.len;
      var hA = bodyH * (1 - s.wedge * 0.55 * t1), hB = bodyH * (1 - s.wedge * 0.55 * ((t0 + t1) / 2));
      var w = (s.wid - 0.15) * (1 - 0.10 * t1);
      bx(0, 0.30 + (0.30 + (hB - 0.3)) / 2 - 0.15, (zA + zB) / 2, w, Math.max(0.18, hB - 0.26), zB - zA - 0.02, 0);
    }
    // blunt tail block for the 911 / rounded roofs
    if (s.roof === 'round' || s.roof === 'fast') {
      bx(0, 0.30 + (s.hgt - 0.55) / 2, -hl + 0.42, s.wid - 0.22, s.hgt - 0.55, 0.8, 0);
    }
    // cabin / glasshouse set behind the front axle
    var cabZ = s.roof === 'round' ? -0.25 : 0.15;
    var cabLen = s.len * (s.roof === 'low' ? 0.34 : 0.4);
    var cabH = s.hgt - bodyH - 0.10;
    bx(0, bodyH + cabH / 2 - 0.02, cabZ, s.wid - 0.34, Math.max(0.16, cabH), cabLen, 2);
    // A-pillar / roof cap
    bx(0, bodyH + cabH - 0.02, cabZ - cabLen * 0.18, s.wid - 0.42, 0.10, cabLen * 0.5, 0);
    // wheels: dark boxes just outside the body
    var wr = 0.34, ww = 0.30, trk = s.wid - 0.22;
    var axF = hl - 0.72, axR = -hl + 0.72;
    for (var sgn = -1; sgn <= 1; sgn += 2) {
      bx(sgn * trk / 2, wr, axF, ww, wr * 2, 0.62, 1);
      bx(sgn * trk / 2, wr, axR, ww, wr * 2, 0.66, 1);
    }
    // head/tail lights
    bx(-hw + 0.34, bodyH * 0.62, hl - 0.06, 0.34, 0.14, 0.06, 3);
    bx(hw - 0.34, bodyH * 0.62, hl - 0.06, 0.34, 0.14, 0.06, 3);
    bx(-hw + 0.38, bodyH * 0.72, -hl + 0.02, 0.42, 0.14, 0.05, 4);
    bx(hw - 0.38, bodyH * 0.72, -hl + 0.02, 0.42, 0.14, 0.05, 4);
    // rear wing
    if (s.wing > 0.05) {
      var wy = s.hgt + s.wing;
      bx(0, wy, -hl + 0.34, s.wingSpan, 0.10, 0.42, 0);
      bx(-s.wingSpan / 2 + 0.12, wy - 0.18, -hl + 0.34, 0.10, 0.36, 0.14, 1);
      bx(s.wingSpan / 2 - 0.12, wy - 0.18, -hl + 0.34, 0.10, 0.36, 0.14, 1);
    }
    // side skirts / shadow line
    bx(-hw + 0.06, 0.16, 0, 0.12, 0.16, s.len - 0.7, 1);
    bx(hw - 0.06, 0.16, 0, 0.12, 0.16, s.len - 0.7, 1);
    return B;
  }
  CARS.forEach(function (c) { c.boxes = buildBoxes(c); c.halfW = c.style.wid / 2; c.len = c.style.len; });

  GT.CARS = CARS;
  GT.carById = function (id) { for (var i = 0; i < CARS.length; i++) if (CARS[i].id === id) return CARS[i]; return null; };
  if (typeof module !== 'undefined') module.exports = { CARS: GT.CARS, buildBoxes: buildBoxes };
})();

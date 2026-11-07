// ── Voxel Touring GT — track definitions + geometry builder ────────────────
// Circuits are authored as closed waypoint rings [x, z, elev, width, wallFlag]
// traced from real circuit layouts (scaled/compressed but recognizable:
// corner sequence, direction, elevation profile). Ring closes by construction;
// Catmull-Rom resampling turns the ring into a uniform 0.5m centerline.
// wallFlag: 0 none, 1 guardrails both sides.
GT.TRACKS = [
  {
    id: 'nord',
    name: 'NORDSCHLEIFE “GRÜNE HÖLLE”',
    real: 'after the Nürburgring Nordschleife, Germany',
    sectors: [0.30, 0.62],
    weather: 'overcast forest',
    sky: [0.52, 0.58, 0.63], fog: [0.62, 0.66, 0.68], sun: [-0.5, 0.8, -0.35],
    pts: [
      [0.0, 360.0, 15.00, 13.0, 1],
      [-25.2, 326.4, 15.00, 13.0, 1],
      [-50.5, 292.7, 15.00, 13.0, 1],  // start/finish (Adenauer GP straight)
      [-64.0, 254.1, 14.63, 12.6, 1],
      [-70.3, 212.6, 14.04, 12.0, 0],
      [-46.9, 178.5, 16.84, 11.3, 1],  // Hatzenbach T1 right
      [-11.5, 162.3, 18.94, 11.0, 1],
      [27.7, 166.3, 20.53, 11.3, 0],
      [54.0, 194.2, 22.30, 12.0, 0],  // Kurve 1 left
      [39.8, 232.4, 24.16, 12.0, 0],  // (smoothed K1 exit)
      [3.6, 253.9, 25.50, 12.0, 0],  // Schwedenkreuz right
      [-36.2, 260.6, 26.70, 12.0, 0],
      [-78.2, 258.4, 27.82, 12.0, 0],  // (smoothed)
      [-117.0, 272.8, 28.80, 12.0, 0],
      [-155.1, 290.4, 29.75, 12.0, 0],  // Fuchsföhre left
      [-181.5, 321.4, 28.02, 11.7, 0],
      [-203.8, 357.1, 25.34, 11.2, 0],  // Antoniusbuche right
      [-212.3, 395.8, 22.38, 10.7, 0],
      [-206.9, 437.5, 19.13, 10.2, 1],
      [-219.2, 475.5, 15.24, 10.7, 1],
      [-240.9, 511.5, 11.00, 11.7, 0],  // Adenauer Forst left
      [-249.9, 551.9, 6.75, 11.5, 0],  // Metternich long right, plunge
      [-246.3, 592.0, 4.00, 10.3, 0],
      [-230.1, 630.5, 4.90, 9.0, 1],
      [-206.0, 661.4, 9.31, 9.6, 0],  // Bergwerk right
      [-166.8, 671.6, 14.82, 10.5, 0],
      [-125.3, 676.2, 19.63, 11.0, 0],  // Pflanzgarten esses left
      [-89.0, 693.6, 23.27, 10.7, 0],
      [-72.4, 730.6, 22.45, 9.6, 0],  // Pflanzgarten crest left
      [-58.4, 767.5, 17.07, 9.7, 1],
      [-28.7, 795.9, 11.92, 11.1, 0],  // Schwalbenschwanz right, drop
      [11.9, 807.2, 11.38, 11.6, 0],
      [52.3, 811.3, 10.88, 12.0, 0],
      [92.6, 799.2, 10.47, 12.0, 0],  // Galgenkopf sweeper left
      [132.9, 787.1, 10.07, 12.0, 0],
      [164.5, 760.5, 10.00, 12.0, 0],
      [194.2, 730.8, 10.00, 12.0, 1],
      [216.1, 694.9, 10.94, 12.0, 1],
      [237.7, 658.8, 11.90, 12.0, 1],  // Flugplatz right (heavy braking)
      [246.9, 618.0, 14.31, 12.0, 1],
      [254.7, 576.7, 16.89, 12.0, 0],  // Flugplatz straight
      [246.3, 535.6, 21.30, 12.0, 0],
      [237.2, 494.6, 25.79, 12.0, 0],  // climb right to Hohe Acht
      [249.9, 454.8, 28.60, 12.0, 0],
      [261.8, 414.8, 30.90, 11.7, 0],
      [260.1, 372.8, 30.08, 9.2, 0],  // Hohe Acht ridge (highest)
      [279.4, 336.1, 28.43, 9.0, 0],  // Wippermann left kink
      [282.5, 295.6, 26.82, 10.2, 0],  // Wippchen right flick
      [289.8, 255.7, 24.78, 11.6, 0],
      [308.5, 218.1, 22.21, 12.9, 0],
      [340.9, 191.8, 20.98, 13.0, 0],  // Carousel banked long right
      [370.2, 164.5, 19.78, 13.0, 0],
      [369.1, 122.5, 18.04, 13.0, 0],
      [328.8, 112.8, 16.04, 13.0, 0],
      [292.2, 133.1, 17.49, 12.3, 0],
      [256.2, 154.9, 16.22, 12.6, 0],  // Carousel exit
      [232.8, 186.7, 15.00, 13.0, 0],
      [219.5, 226.6, 15.00, 13.0, 0],  // Döttinger Höhe return, ring's outside edge
      [206.2, 266.5, 15.29, 12.7, 0],
      [192.9, 306.4, 15.74, 12.3, 0],
      [175.5, 344.3, 16.19, 12.0, 0],
      [152.1, 379.3, 16.66, 12.0, 0],
      [125.2, 410.4, 16.78, 12.0, 0],
      [88.6, 431.0, 15.96, 12.0, 0],
      [54.2, 455.1, 15.00, 12.0, 0],
      [19.1, 440.4, 15.00, 12.0, 0],  // the loop's northern apex
      [7.1, 401.5, 15.00, 12.4, 0],
    ]
  },
  {
    id: 'suzaka',
    name: 'SUZAKA TWIN RING',
    real: 'after Suzuka Circuit, Japan — the figure-8',
    sectors: [0.28, 0.60],
    weather: 'clear, evening',
    sky: [0.36, 0.46, 0.66], fog: [0.55, 0.60, 0.68], sun: [-0.7, 0.55, -0.4],
    pts: [
      [29.7, -11.7, 0.00, 15.0, 1],
      [71.7, -11.8, 0.00, 15.0, 1],
      [113.7, -11.9, 0.00, 15.0, 1],
      [155.6, -11.9, 0.00, 15.0, 1],  // start/finish
      [197.6, -12.0, 0.00, 15.0, 1],
      [239.3, -16.9, 0.00, 14.8, 1],
      [280.9, -22.1, 0.00, 14.5, 1],
      [322.6, -27.3, 0.00, 14.2, 1],
      [363.1, -34.9, 0.00, 14.0, 1],
      [393.8, -63.4, 0.00, 14.5, 1],
      [424.6, -92.0, 0.00, 14.9, 1],
      [440.3, -129.9, 0.48, 14.0, 1],
      [448.1, -169.8, 1.11, 13.0, 0],  // T1 wide right
      [429.3, -207.3, 1.90, 13.0, 0],
      [433.9, -248.1, 2.00, 13.0, 0],  // first S entry left
      [418.0, -284.8, 2.00, 13.0, 0],  // esses right
      [409.5, -324.0, 2.48, 13.5, 0],
      [400.5, -362.2, 3.00, 13.5, 0],  // esses left
      [373.2, -394.0, 3.00, 12.1, 1],
      [333.8, -407.8, 3.00, 12.6, 0],  // Degner left (tight)
      [293.3, -411.4, 3.28, 13.0, 0],
      [252.1, -403.4, 3.89, 13.0, 0],
      [216.1, -382.8, 4.96, 13.0, 0],
      [184.1, -357.6, 6.22, 13.0, 0],  // Spoon long right
      [175.5, -316.5, 8.20, 13.0, 0],
      [169.9, -275.0, 6.39, 12.5, 0],  // Degner exit carries over the hairpin access road
      [155.1, -238.2, 3.54, 11.5, 0],
      [120.4, -219.1, 3.00, 11.0, 1],  // hairpin left U, spread over six waypoints
      [83.6, -229.7, 3.00, 11.0, 1],
      [64.9, -265.4, 3.00, 11.8, 0],
      [79.6, -302.9, 3.96, 12.0, 0],
      [116.7, -322.1, 3.00, 12.0, 1],  // exits the U climbing toward the overpass
      [158.6, -324.4, 3.00, 12.0, 1],  // tunnels under the Degner exit road
      [200.5, -326.3, 3.25, 12.0, 1],
      [242.5, -328.0, 3.60, 12.0, 0],
      [284.4, -329.8, 3.95, 12.0, 0],
      [326.2, -333.6, 4.89, 12.0, 0],
      [368.0, -337.7, 5.92, 12.0, 0],  // esses left — CROSSES first S here
      [409.7, -341.8, 6.94, 12.0, 0],
      [443.8, -318.3, 6.09, 12.0, 0],
      [477.5, -293.3, 5.13, 12.0, 0],  // overpass above (398,-298)-(420,-350)
      [493.3, -255.4, 3.74, 12.6, 0],
      [509.7, -217.0, 2.17, 13.0, 0],
      [535.0, -185.4, 0.69, 13.3, 0],  // Cassiopeia esses
      [564.5, -159.2, 0.00, 14.0, 0],
      [578.4, -119.6, 0.00, 14.0, 0],  // 130R long right
      [585.2, -79.6, 0.00, 14.0, 0],
      [575.8, -38.6, 0.00, 14.0, 0],
      [565.9, 2.1, 0.00, 14.0, 0],  // 130R exit → back straight (figure-8 top)
      [547.1, 38.8, 0.00, 14.5, 0],
      [518.3, 68.2, 0.00, 15.0, 0],
      [481.8, 88.6, 0.00, 15.0, 0],
      [440.7, 96.9, 0.00, 15.0, 0],
      [399.0, 100.7, 0.00, 15.0, 0],
      [357.1, 101.8, 0.00, 15.0, 0],
      [315.2, 100.5, 0.00, 15.0, 0],
      [273.2, 98.6, 0.00, 15.0, 0],
      [231.5, 94.8, 0.00, 15.0, 0],
      [189.8, 90.2, 0.00, 15.0, 0],
      [148.6, 82.6, 0.00, 15.0, 0],
      [107.9, 72.5, 0.00, 15.0, 0],
      [66.7, 64.2, 0.00, 15.0, 0],
      [25.3, 57.5, 0.00, 15.0, 0],
      [-16.3, 52.1, 0.00, 14.7, 0],
      [-58.0, 47.4, 0.00, 14.2, 1],  // back straight runs W
      [-99.8, 44.2, 0.00, 14.0, 1],
      [-141.7, 42.4, 0.00, 14.0, 1],
      [-182.8, 34.2, 0.00, 13.2, 1],
      [-219.8, 15.2, 0.00, 13.0, 0],  // western curl (left, descends S of pit level)
      [-243.0, -18.9, 0.00, 13.0, 0],
      [-236.2, -59.0, 0.00, 13.0, 0],
      [-202.5, -79.2, 0.00, 13.5, 0],
      [-161.3, -84.1, 0.00, 14.0, 0],
      [-119.4, -81.9, 0.00, 14.0, 0],  // esses home straight (ENE toward line)
      [-78.2, -73.6, 0.00, 14.0, 0],
      [-39.1, -59.5, 0.00, 14.7, 1],
      [-4.2, -36.3, 0.00, 15.0, 1],
    ]
  },
  {
    id: 'ardennes',
    name: 'GRAND PRIX D’ARDENNES',
    real: 'after Spa-Francorchamps, Belgium',
    sectors: [0.18, 0.55],
    weather: 'drifting clouds, autumn',
    sky: [0.45, 0.50, 0.55], fog: [0.55, 0.57, 0.58], sun: [-0.4, 0.7, -0.55],
    pts: [
      [21.0, -14.9, 20.00, 14.0, 1],
      [60.8, -27.3, 19.69, 14.0, 1],
      [100.7, -39.7, 19.38, 14.0, 1],  // start/finish straight, climb to La Source
      [140.5, -52.1, 19.07, 14.0, 1],
      [179.3, -67.4, 19.00, 13.8, 1],
      [217.7, -83.6, 19.00, 13.5, 1],
      [256.2, -99.8, 19.00, 13.2, 1],
      [291.6, -120.1, 18.83, 12.7, 1],
      [318.0, -152.4, 18.17, 11.3, 1],
      [328.0, -191.6, 15.49, 11.6, 0],  // T1 La Source right (hairpin-ish)
      [326.0, -232.9, 10.21, 12.0, 0],
      [327.5, -273.1, 4.58, 12.0, 0],  // left Esses, plunge to valley
      [350.4, -303.4, 2.46, 12.0, 0],
      [390.7, -314.3, 3.96, 12.0, 0],  // Rivage Rouge (Eau Rouge) bottom right
      [423.5, -289.3, 10.83, 12.0, 0],
      [436.3, -251.0, 16.98, 12.6, 0],  // big left compression, blind crest
      [455.1, -215.6, 21.98, 13.0, 0],
      [484.2, -185.7, 25.97, 13.0, 0],
      [524.5, -175.1, 24.81, 13.6, 0],  // Radillon long right at crest
      [563.5, -174.8, 22.72, 14.0, 0],
      [599.5, -195.9, 18.72, 14.0, 0],  // long descent
      [626.9, -225.5, 15.56, 12.9, 0],
      [647.8, -261.6, 13.02, 11.0, 1],
      [654.6, -302.8, 12.05, 11.0, 1],  // Bus Stop chicane (R-L-R, no heading reversal)
      [632.9, -337.7, 12.00, 11.0, 1],
      [622.5, -377.5, 13.38, 11.7, 0],  // Bus Stop: one long left, no chicane cusp
      [606.6, -415.4, 16.09, 12.0, 0],
      [584.2, -449.8, 19.05, 12.1, 0],  // climb to Francorchamps
      [546.6, -467.9, 19.50, 13.0, 0],
      [509.0, -486.1, 19.95, 13.9, 0],  // Francorchamps left
      [467.9, -491.5, 19.29, 14.0, 0],
      [426.4, -495.5, 18.50, 14.0, 0],  // Kemmel straight
      [384.9, -496.5, 17.55, 13.8, 0],
      [343.3, -492.3, 16.30, 13.4, 0],
      [301.8, -488.2, 15.05, 13.0, 0],
      [263.3, -472.4, 13.70, 12.6, 0],
      [224.8, -456.2, 12.35, 12.1, 0],
      [192.0, -431.1, 11.40, 12.3, 0],
      [161.2, -403.1, 10.60, 12.7, 0],  // Blanchimont entry right
      [131.9, -373.5, 9.66, 12.8, 0],
      [107.5, -339.7, 8.31, 12.2, 0],  // Blanchimont fast left
      [81.1, -307.4, 7.48, 11.5, 1],  // second Blanchimont left
      [59.6, -273.0, 7.23, 11.0, 1],
      [52.3, -232.1, 8.08, 11.0, 1],  // Les Combes double right
      [72.3, -195.5, 11.13, 11.8, 0],
      [98.9, -163.8, 14.75, 12.0, 0],  // Pouhon long left, uphill
      [113.4, -129.3, 17.40, 12.0, 0],
      [98.1, -92.8, 18.91, 12.3, 0],
      [67.8, -64.1, 20.23, 13.0, 0],  // Fagnes right
      [36.9, -36.1, 14.61, 13.0, 1],  // Masta straight climb
      [10.5, -4.0, 13.76, 13.0, 1],
      [-14.1, 29.7, 14.83, 13.0, 1],  // tunnel under the start straight
      [-50.6, 48.2, 18.10, 13.0, 0],  // Masta kink left, onto the W return road
      [-91.2, 57.0, 18.38, 13.0, 0],  // return road runs W (left curl, long)
      [-132.6, 59.1, 17.53, 13.0, 0],
      [-173.1, 51.8, 16.05, 12.5, 0],
      [-202.0, 24.8, 13.46, 12.0, 1],
      [-203.1, -15.5, 10.88, 12.0, 0],  // west hairpin (left, ~190deg)
      [-176.8, -44.5, 10.00, 12.0, 0],
      [-137.2, -46.5, 10.97, 12.3, 0],
      [-97.3, -35.7, 13.14, 13.0, 0],
      [-57.1, -43.5, 15.29, 13.1, 0],  // E return road, runs below the straight
      [-19.0, -26.7, 18.43, 14.0, 1],
    ]
  }
];

GT.buildTrack = function (def) {
  'use strict';
  var U = GT.util, STEP = 0.5;
  var P = def.pts, N = P.length;

  // ── 1. closed centripetal Catmull-Rom through the ring (Barry–Goldman),
  //    sampled densely. Centripetal (α=0.5) ⇒ no cusps/overshoot on tight corners.
  function knotGap(a2, b2) { return Math.sqrt(Math.hypot(b2[0] - a2[0], b2[1] - a2[1])); }
  var xs = [], zs = [], ys = [], ws = [], walls = [];
  for (var i1 = 0; i1 < N; i1++) {
    var q0 = P[(i1 - 1 + N) % N], q1 = P[i1], q2 = P[(i1 + 1) % N], q3 = P[(i1 + 2) % N];
    var t0 = 0,
      t1 = t0 + Math.max(1e-3, knotGap(q0, q1)),
      t2 = t1 + Math.max(1e-3, knotGap(q1, q2)),
      t3 = t2 + Math.max(1e-3, knotGap(q2, q3));
    var span = t2 - t1;
    var ns = Math.max(2, Math.round(Math.hypot(q2[0] - q1[0], q2[1] - q1[1]) / STEP));
    for (var j = 0; j < ns; j++) {
      var t = t1 + span * (j / ns);
      // de Boor-like linear blend ladder
      var l0a = (t1 - t) / (t1 - t0), l0b = 1 - l0a;
      var l1a = (t2 - t) / (t2 - t1), l1b = 1 - l1a;
      var l2a = (t3 - t) / (t3 - t2), l2b = 1 - l2a;
      var m1a = (t2 - t) / (t2 - t0), m1b = 1 - m1a;
      var m2a = (t3 - t) / (t3 - t1), m2b = 1 - m2a;
      var fa = (t2 - t) / span, fb = 1 - fa;
      for (var comp = 0; comp < 4; comp++) {
        var A1 = l0a * q0[comp] + l0b * q1[comp];
        var B1 = l1a * q1[comp] + l1b * q2[comp];
        var C1 = l2a * q2[comp] + l2b * q3[comp];
        var A2 = m1a * A1 + m1b * B1;
        var B2 = m2a * B1 + m2b * C1;
        var v = fa * A2 + fb * B2;
        if (comp === 0) xs.push(v); else if (comp === 1) zs.push(v);
        else if (comp === 2) ys.push(v); else ws.push(v);
      }
      walls.push(j / ns < 0.5 ? q1[4] : q2[4]);
    }
  }
  var n = xs.length;

  // ── 2. uniform resample ────────────────────────────────────────────────────
  var cum = new Float64Array(n + 1);
  for (var i2 = 0; i2 < n; i2++) {
    var j2 = (i2 + 1) % n;
    cum[i2 + 1] = cum[i2] + Math.hypot(xs[j2] - xs[i2], zs[j2] - zs[i2]);
  }
  var L = cum[n];
  var M = Math.round(L / STEP);
  var T = {
    id: def.id, name: def.name, real: def.real, weather: def.weather,
    sky: def.sky, fog: def.fog, sun: def.sun, sectors: def.sectors,
    L: L, M: M, step: STEP,
    x: new Float32Array(M), z: new Float32Array(M), y: new Float32Array(M),
    tx: new Float32Array(M), tz: new Float32Array(M), nx: new Float32Array(M), nz: new Float32Array(M),
    k: new Float32Array(M), s: new Float32Array(M), hw: new Float32Array(M), wall: new Uint8Array(M)
  };
  function at(arr, f) {
    var ii = Math.floor(f) % n, ii2 = (ii + 1) % n, ft = f - Math.floor(f);
    return arr[ii] * (1 - ft) + arr[ii2] * ft;
  }
  var ptr = 0;
  for (var m = 0; m < M; m++) {
    var target = m * STEP;
    while (ptr < n - 1 && cum[ptr + 1] < target) ptr++;
    var f = (target - cum[ptr]) / Math.max(1e-9, cum[ptr + 1] - cum[ptr]);
    var pos = ptr + f;
    T.x[m] = at(xs, pos); T.z[m] = at(zs, pos); T.y[m] = at(ys, pos);
    var fi = Math.round(pos) % n;
    T.hw[m] = at(ws, pos); T.wall[m] = walls[fi];
    T.s[m] = target;
  }
  // tangent + normal
  for (var m2 = 0; m2 < M; m2++) {
    var a2 = (m2 - 1 + M) % M, b2 = (m2 + 1) % M;
    var ddx2 = T.x[b2] - T.x[a2], ddz2 = T.z[b2] - T.z[a2];
    var d = Math.hypot(ddx2, ddz2) || 1;
    T.tx[m2] = ddx2 / d; T.tz[m2] = ddz2 / d;
    T.nx[m2] = -T.tz[m2]; T.nz[m2] = T.tx[m2]; // left normal
  }
  // curvature (signed, left +)
  for (var m3 = 0; m3 < M; m3++) {
    var a3 = (m3 - 1 + M) % M, b3 = (m3 + 1) % M;
    var c1 = Math.atan2(T.tz[a3], T.tx[a3]), c2 = Math.atan2(T.tz[b3], T.tx[b3]);
    T.k[m3] = U.wrapAngle(c2 - c1) / (2 * STEP);
  }

  // ── 3. racing line: the least-length path inside the tarmac tube ──
  // E(o) = Σ|q[i+1] − q[i]|² + λΣo² with q = c + n·o is exactly quadratic in the
  // lateral offset o, so conjugate gradient solves it; λ anchors o to the
  // centerline where length is degenerate (straights). A clamped Jacobi pass
  // afterwards smooths the seams where the box constraint binds.
  // (Plain descent on the curvature stencil was unconditionally unstable at this
  // step size and produced checkerboard offsets — lineK ~ 2.7 — hence CG.)
  var o = new Float32Array(M); // lateral offset (+left)
  var maxOff = new Float32Array(M);
  for (var m4 = 0; m4 < M; m4++) maxOff[m4] = T.hw[m4] * 0.5 - 1.2;
  var LAM = 3e-4;
  function gradOf(pp, out) { // ∇E = A1ᵀ(A1 pp + c1) + λ·pp, e_i = q[i+1] − q[i]
    for (var i = 0; i < M; i++) {
      var ip = (i + 1) % M, im = (i - 1 + M) % M;
      var ex = T.x[ip] - T.x[i] + T.nx[ip] * pp[ip] - T.nx[i] * pp[i];
      var ez = T.z[ip] - T.z[i] + T.nz[ip] * pp[ip] - T.nz[i] * pp[i];
      var gx = T.x[i] - T.x[im] + T.nx[i] * pp[i] - T.nx[im] * pp[im];
      var gz = T.z[i] - T.z[im] + T.nz[i] * pp[i] - T.nz[im] * pp[im];
      out[i] = (gx - ex) * T.nx[i] + (gz - ez) * T.nz[i] + LAM * pp[i]; // ∂E/∂o ∝ (e_{i−1} − e_i)·n
    }
  }
  function hessOf(pp, out) { // (A1ᵀA1 + λI)·pp
    for (var i = 0; i < M; i++) {
      var ip = (i + 1) % M, im = (i - 1 + M) % M;
      var hx = T.nx[ip] * pp[ip] - 2 * T.nx[i] * pp[i] + T.nx[im] * pp[im];
      var hz = T.nz[ip] * pp[ip] - 2 * T.nz[i] * pp[i] + T.nz[im] * pp[im];
      out[i] = hx * T.nx[i] + hz * T.nz[i] + LAM * pp[i];
    }
  }
  var g1 = new Float32Array(M), r1 = new Float32Array(M), p1 = new Float32Array(M), Hp = new Float32Array(M);
  gradOf(o, g1);
  var rr = 0;
  for (var m5 = 0; m5 < M; m5++) { r1[m5] = -g1[m5]; p1[m5] = r1[m5]; rr += r1[m5] * r1[m5]; }
  for (var it = 0; it < 400 && rr > 1e-9; it++) {
    hessOf(p1, Hp);
    var pHp = 0;
    for (var m6 = 0; m6 < M; m6++) pHp += p1[m6] * Hp[m6];
    if (!(pHp > 0)) break;
    var alpha = rr / pHp, rrn = 0;
    for (var m7b = 0; m7b < M; m7b++) {
      o[m7b] += alpha * p1[m7b]; r1[m7b] -= alpha * Hp[m7b]; rrn += r1[m7b] * r1[m7b];
    }
    var beta = rr / rrn > 0 ? rrn / rr : 0;
    for (var m8 = 0; m8 < M; m8++) p1[m8] = r1[m8] + beta * p1[m8];
    rr = rrn;
  }
  for (var m9b = 0; m9b < M; m9b++) o[m9b] = U.clamp(o[m9b], -maxOff[m9b], maxOff[m9b]);
  var ob2 = new Float32Array(M);
  for (var it2 = 0; it2 < 800; it2++) {
    gradOf(o, g1);
    for (var m10b = 0; m10b < M; m10b++)
      ob2[m10b] = U.clamp(o[m10b] - 0.1 * g1[m10b], -maxOff[m10b], maxOff[m10b]);
    var t = o; o = ob2; ob2 = t;
  }
  T.lineOff = o;
  T.lineX = new Float32Array(M); T.lineZ = new Float32Array(M);
  for (var m7 = 0; m7 < M; m7++) {
    T.lineX[m7] = T.x[m7] + T.nx[m7] * o[m7];
    T.lineZ[m7] = T.z[m7] + T.nz[m7] * o[m7];
  }
  // curvature along the racing line (signed 1/R) via heading angle difference
  T.lineK = new Float32Array(M);
  for (var m9 = 0; m9 < M; m9++) {
    var hA = Math.atan2(T.lineZ[m9] - T.lineZ[(m9 - 1 + M) % M], T.lineX[m9] - T.lineX[(m9 - 1 + M) % M]);
    var hB = Math.atan2(T.lineZ[(m9 + 1) % M] - T.lineZ[m9], T.lineX[(m9 + 1) % M] - T.lineX[m9]);
    T.lineK[m9] = U.wrapAngle(hB - hA) / (2 * STEP);
  }

  // speed limit along line (a_lat grip, plus braking preview backwards pass)
  T.vlim = new Float32Array(M);
  var aLat = 11.5;
  var vTop = 78; // cars' terminal speed, m/s
  for (var m10 = 0; m10 < M; m10++) {
    var kk = Math.abs(T.lineK[m10]);
    T.vlim[m10] = kk > 1e-5 ? Math.min(vTop, Math.sqrt(aLat / kk)) : vTop;
  }
  for (var rep = 0; rep < 2; rep++) {
    for (var m11 = 0; m11 < M; m11++) {
      var a6 = (m11 - 1 + M) % M;
      T.vlim[m11] = Math.min(T.vlim[m11], T.vlim[a6] + 0.9);
    }
    for (var m12 = M - 1; m12 >= 0; m12--) {
      var b6 = (m12 + 1) % M;
      var abrk = 8.5;
      var vNeed = Math.sqrt(T.vlim[b6] * T.vlim[b6] + 2 * abrk * STEP);
      T.vlim[m12] = Math.min(T.vlim[m12], vNeed);
    }
  }
  var tref = 0; for (var m13 = 0; m13 < M; m13++) tref += STEP / Math.max(4, T.vlim[m13]);
  T.refLap = tref;
  var hwMax = 0; for (var m8 = 0; m8 < M; m8++) if (T.hw[m8] > hwMax) hwMax = T.hw[m8];
  T.hwMax = hwMax;

  // nearest-sample query (windowed by progress → survives figure-8 crossings)
  T.nearest = function (x, z, hint) {
    var best = hint, bd = 1e18;
    for (var d = -10; d <= 1000; d++) {
      var ii2 = (((hint + d) % M) + M) % M;
      var ex = x - T.x[ii2], ez = z - T.z[ii2];
      var dd = ex * ex + ez * ez;
      if (dd < bd) { bd = dd; best = ii2; }
    }
    return best;
  };
  T.diagnostics = function () {
    var crossings = 0, tooClose = 0, minR = 1e9;
    for (var i9 = 0; i9 < M; i9 += 5) {
      // skip the 150m before the seam: the lap legitimately merges onto itself there
      for (var j3 = i9 + 160; j3 < M - 300; j3 += 5) {
        var dd2 = Math.hypot(T.x[i9] - T.x[j3], T.z[i9] - T.z[j3]);
        var need = (T.hw[i9] + T.hw[j3]) * 0.5 + 4;
        if (dd2 < need) {
          if (Math.abs(T.y[i9] - T.y[j3]) > 3.5) crossings++; // grade-separated (bridge)
          else tooClose++;
        }
      }
    }
    for (var m14 = 0; m14 < M; m14++) {
      if (Math.abs(T.k[m14]) > 1e-4) minR = Math.min(minR, 1 / Math.abs(T.k[m14]));
    }
    return { crossings: crossings, tooClose: tooClose, minR: minR };
  };
  return T;
};
if (typeof module !== 'undefined') module.exports = { TRACKS: GT.TRACKS, buildTrack: GT.buildTrack };

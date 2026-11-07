// GT.world — turns a built track T into one static box list for the renderer:
// terrain heightfield flattened along the corridor, asphalt + curbs, guard
// rails, trees/grandstands/pit buildings, and dressing for the grade-
// separated crossings (pillars, parapets, tunnel portals).
(function () {
  globalThis.GT = globalThis.GT || {};
  var U = GT.util;

  var PAL = {
    asphalt: [0.155, 0.155, 0.17],
    asphalt2: [0.185, 0.185, 0.195],
    white: [0.85, 0.86, 0.87],
    red: [0.75, 0.13, 0.12],
    rail: [0.62, 0.64, 0.67],
    post: [0.32, 0.33, 0.36],
    concrete: [0.55, 0.55, 0.53],
    concrete2: [0.47, 0.47, 0.46],
    trunk: [0.24, 0.17, 0.11],
    stand: [0.35, 0.37, 0.42],
    pit: [0.72, 0.73, 0.74],
    glassB: [0.25, 0.32, 0.4]
  };
  // per-track vegetation palette + density
  var FLORA = {
    nord: { grass: [0.17, 0.30, 0.13], grass2: [0.22, 0.33, 0.14], tree: 0.34, treeCol: [0.10, 0.24, 0.09], city: false },
    suzaka: { grass: [0.24, 0.32, 0.16], grass2: [0.30, 0.35, 0.18], tree: 0.10, treeCol: [0.13, 0.27, 0.11], city: true },
    ardennes: { grass: [0.15, 0.27, 0.12], grass2: [0.19, 0.30, 0.13], tree: 0.44, treeCol: [0.08, 0.21, 0.08], city: false }
  };

  // ---- corridor proximity: grid bucketed sparse samples ----
  function makeGrid(T, stride) {
    var C = 24, g = new Map();
    function key(x, z) { return (Math.floor(x / C) + 4096) * 100003 + (Math.floor(z / C) + 4096); }
    for (var i = 0; i < T.M; i += stride) {
      var k = key(T.x[i], T.z[i]);
      var a = g.get(k); if (!a) g.set(k, a = []);
      a.push(i);
    }
    return { g: g, C: C, key: key };
  }
  // nearest corridor sample info around (x,z): planar dist + lowest ribbon y nearby
  function near(G, T, x, z, rad) {
    var C = G.C, gx = Math.floor(x / C), gz = Math.floor(z / C), r = Math.ceil(rad / C) + 1;
    var bd = 1e18, minY = 1e18;
    for (var a = -r; a <= r; a++) for (var b = -r; b <= r; b++) {
      var arr = G.g.get((gx + a + 4096) * 100003 + (gz + b + 4096));
      if (!arr) continue;
      for (var k = 0; k < arr.length; k++) {
        var j = arr[k], dx = T.x[j] - x, dz = T.z[j] - z, d = Math.sqrt(dx * dx + dz * dz);
        if (d < bd) bd = d;
        if (d <= rad && T.y[j] < minY) minY = T.y[j];
      }
    }
    return { d: bd, minY: minY };
  }

  // oriented push helper: local +z along track tangent at sample i
  function tRot(T, i) { return Math.atan2(T.tx[i], T.tz[i]); }
  function along(list, T, i, lat, y, w, h, len, col) {
    list.push([T.x[i] + T.nx[i] * lat, T.y[i] + y, T.z[i] + T.nz[i] * lat, w, h, len, col, tRot(T, i)]);
  }

  function build(T) {
    var list = [];
    var F = FLORA[T.id] || FLORA.nord;
    var G = makeGrid(T, 4);
    var stride = 4; // sparse sample list indices are multiples of 4

    // bbox of the corridor
    var x0 = 1e18, x1 = -1e18, z0 = 1e18, z1 = -1e18;
    for (var i = 0; i < T.M; i += 8) {
      if (T.x[i] < x0) x0 = T.x[i]; if (T.x[i] > x1) x1 = T.x[i];
      if (T.z[i] < z0) z0 = T.z[i]; if (T.z[i] > z1) z1 = T.z[i];
    }
    var sumY = 0, cntY = 0;
    for (i = 0; i < T.M; i += 16) { sumY += T.y[i]; cntY++; }
    var baseY = sumY / cntY;

    // ---- ground heightfield: fine band hugging the track, coarse band beyond ----
    function groundH(x, z) {
      var n = near(G, T, x, z, 90);
      var hill = baseY + (U.fbm2(x * 0.0045 + 40, z * 0.0045 + 90, 3) - 0.5) * 26;
      if (n.d > 70 || n.minY > 1e17) return hill;
      var w = U.smoothstep((n.d - 14) / 46);
      return U.lerp(n.minY, hill, w);
    }
    function groundCell(x, z, h, cell) {
      var f = U.fbm2(x * 0.02, z * 0.02, 2);
      var c = [U.lerp(F.grass[0], F.grass2[0], f), U.lerp(F.grass[1], F.grass2[1], f), U.lerp(F.grass[2], F.grass2[2], f)];
      var dry = U.fbm2(x * 0.006 + 7, z * 0.006 + 3, 2);
      if (dry > 0.62) { c[0] += 0.09; c[1] += 0.06; c[2] -= 0.02; } // dry patch
      list.push([x, h - 1.35, z, cell + 0.15, 2.4, cell + 0.15, c, 0]);
    }
    var CELL = 6;
    for (var cx = x0 - 60; cx <= x1 + 60; cx += CELL)
      for (var cz = z0 - 60; cz <= z1 + 60; cz += CELL) {
        var n0 = near(G, T, cx, cz, 90);
        if (n0.d > 72) continue;
        groundCell(cx, cz, groundH(cx, cz), CELL);
      }
    var CELL2 = 22;
    for (cx = x0 - 240; cx <= x1 + 240; cx += CELL2)
      for (cz = z0 - 240; cz <= z1 + 240; cz += CELL2) {
        n0 = near(G, T, cx, cz, 260);
        if (n0.d < 60 || n0.d > 240) continue;
        groundCell(cx, cz, groundH(cx, cz), CELL2);
      }

    // ---- asphalt ribbon (top face exactly at T.y) ----
    for (i = 0; i < T.M; i += stride) {
      var hw = T.hw[i];
      var ac = (i / stride) % 2 ? PAL.asphalt : PAL.asphalt2;
      along(list, T, i, 0, -0.15, hw * 2 + 0.3, 0.3, T.step * stride + 0.15, ac);
      // rumble strips on the outside of corners
      if (Math.abs(T.lineK[i]) > 0.03 && T.wall[i]) {
        var side = T.lineK[i] > 0 ? 1 : -1;   // curb on the outer edge of the bend
        var cc = ((i / stride) | 0) % 2 ? PAL.red : PAL.white;
        along(list, T, i, side * (hw + 0.45), -0.05, 0.85, 0.2, T.step * stride + 0.1, cc);
      }
    }

    // ---- start/finish: checkered band + gantry ----
    var i0 = 0;
    for (var q = 0; q < 8; q++) {
      var lat = -T.hw[i0] + (q + 0.5) * (2 * T.hw[i0] / 8);
      list.push([T.x[i0] + T.nx[i0] * lat, T.y[i0] + 0.02, T.z[i0] + T.nz[i0] * lat,
        2 * T.hw[i0] / 8, 0.08, 1.6, (q % 2) ? PAL.white : [0.1, 0.1, 0.1], tRot(T, i0)]);
    }
    var gi = Math.round(40 / T.step);            // gantry 20 m past the line
    for (var sg = -1; sg <= 1; sg += 2) {
      list.push([T.x[gi] + T.nx[gi] * sg * (T.hw[gi] + 1.2), T.y[gi] + 2.8, T.z[gi] + T.nz[gi] * sg * (T.hw[gi] + 1.2),
        0.8, 5.6, 0.8, PAL.stand, 0]);
    }
    list.push([T.x[gi], T.y[gi] + 6.0, T.z[gi], 2 * T.hw[gi] + 3.2, 1.4, 0.9, PAL.rail, tRot(T, gi)]);
    list.push([T.x[gi], T.y[gi] + 6.0, T.z[gi], 2 * T.hw[gi] - 4, 0.9, 1.1, PAL.red, tRot(T, gi)]);

    // ---- guard rails where the ribbon says wall ----
    var lastPost = -99;
    for (i = 0; i < T.M; i += 2) {
      if (!T.wall[i]) continue;
      var every4 = ((i / 2) | 0) % 2 === 0;
      for (var s2 = -1; s2 <= 1; s2 += 2) {
        var lat2 = T.hw[i] + 0.9;
        if (every4)
          along(list, T, i, s2 * lat2, 0.95, 0.25, 0.5, 3.1, PAL.rail);
        if (((i / 2) | 0) % 4 === 0 && i - lastPost >= 6)
          along(list, T, i, s2 * lat2, 0.5, 0.16, 1.15, 0.16, PAL.post);
      }
      if (((i / 2) | 0) % 4 === 0) lastPost = i;
    }

    // ---- grade separations: find self-crossings with a vertical offset ----
    var crossings = [];
    for (i = 0; i < T.M; i += 10) {
      var gxx = Math.floor(T.x[i] / G.C), gzz = Math.floor(T.z[i] / G.C);
      for (var aa = -1; aa <= 1; aa++) for (var bb = -1; bb <= 1; bb++) {
        var arr2 = G.g.get((gxx + aa + 4096) * 100003 + (gzz + bb + 4096));
        if (!arr2) continue;
        for (var k2 = 0; k2 < arr2.length; k2++) {
          var j = arr2[k2];
          var di = Math.abs(i - j); di = Math.min(di, T.M - di);
          if (di < 120) continue;                       // not a nearby same-ribbon sample
          var ddx = T.x[j] - T.x[i], ddz = T.z[j] - T.z[i];
          var dp = Math.sqrt(ddx * ddx + ddz * ddz);
          if (dp > T.hw[i] + T.hw[j] + 7) continue;
          if (Math.abs(T.y[j] - T.y[i]) < 3.4) continue;
          // true crossings cross transversally; parallel side-by-side ribbon
          // at different heights (hillside sections) is not a bridge
          if (Math.abs(T.tx[i] * T.tx[j] + T.tz[i] * T.tz[j]) > 0.5) continue;
          var up = T.y[i] > T.y[j] ? i : j, lo = up === i ? j : i;
          var seen = false;
          for (var c2 = 0; c2 < crossings.length; c2++) {
            var dw = Math.abs(crossings[c2].up - up);
            if (Math.min(dw, T.M - dw) < 60) { seen = true; break; }
          }
          if (!seen) crossings.push({ up: up, lo: lo });
        }
      }
    }
    for (var ci = 0; ci < crossings.length; ci++) {
      var up2 = crossings[ci].up, lo2 = crossings[ci].lo;
      var span = Math.round(26 / T.step);
      // pillars under the deck, out to the sides of the upper ribbon
      for (var d2 = -span; d2 <= span; d2 += 12) {
        var u2 = (up2 + d2 + T.M) % T.M;
        for (s2 = -1; s2 <= 1; s2 += 2) {
          var yb = Math.min(T.y[lo2], U.clamp(groundH(T.x[u2] + T.nx[u2] * s2 * (T.hw[u2] + 1), T.z[u2] + T.nz[u2] * s2 * (T.hw[u2] + 1)), -50, T.y[u2]));
          var yc = (T.y[u2] - 0.5 + yb) / 2, hh = Math.max(1, T.y[u2] - 0.5 - yb);
          list.push([T.x[u2] + T.nx[u2] * s2 * (T.hw[u2] + 1.0), yc, T.z[u2] + T.nz[u2] * s2 * (T.hw[u2] + 1.0),
            1.1, hh, 1.1, PAL.concrete2, 0]);
        }
      }
      // parapets along the bridge deck
      for (d2 = -span; d2 <= span; d2 += 4) {
        u2 = (up2 + d2 + T.M) % T.M;
        for (s2 = -1; s2 <= 1; s2 += 2)
          along(list, T, u2, s2 * (T.hw[u2] + 0.35), 0.65, 0.5, 1.3, 4.2, PAL.concrete);
      }
      // tunnel portals on the lower ribbon, both approaches
      for (var pe = -1; pe <= 1; pe += 2) {
        for (var dp2 = 6; dp2 <= 34; dp2 += 8) {
          var l2 = (lo2 + pe * Math.round(dp2 / T.step) + T.M) % T.M;
          for (s2 = -1; s2 <= 1; s2 += 2)
            along(list, T, l2, s2 * (T.hw[l2] + 0.7), 0.6, 0.9, 3.4, 8.4, PAL.concrete);
        }
      }
    }

    // ---- trees ----
    var trees = 0, TCAP = 750;
    for (var tx = x0 - 150; tx <= x1 + 150 && trees < TCAP; tx += 16)
      for (var tz = z0 - 150; tz <= z1 + 150 && trees < TCAP; tz += 16) {
        var jx = tx + (U.hash2(tx, tz) - 0.5) * 12, jz = tz + (U.hash2(tz + 3, tx - 7) - 0.5) * 12;
        n0 = near(G, T, jx, jz, 120);
        if (n0.d < T.hwMax + 13 || n0.d > 170) continue;
        var forest = U.fbm2(jx * 0.012 + 11, jz * 0.012 + 5, 2);
        if (U.hash2(jx * 0.7, jz * 0.7) > F.tree * (forest > 0.52 ? 1.6 : 0.35)) continue;
        var gh = groundH(jx, jz);
        var th = 3 + U.hash2(jx + 1, jz + 2) * 3.5;
        list.push([jx, gh + th * 0.5, jz, 0.55, th, 0.55, PAL.trunk, 0]);
        var tc = F.treeCol, vr = U.hash2(jx, jz + 9) * 0.06;
        list.push([jx, gh + th + 1.1, jz, 2.6 + vr * 8, 2.4, 2.6 + vr * 8, [tc[0] + vr, tc[1] + vr * 1.5, tc[2]], 0]);
        list.push([jx, gh + th + 2.9, jz, 1.5, 1.6, 1.5, [tc[0] + vr * 2, tc[1] + vr * 2, tc[2]], 0]);
        trees++;
      }

    // ---- grandstands + pit building near the start ----
    for (var s3 = -1; s3 <= 1; s3 += 2) {
      for (var row = 0; row < 5; row++) {
        var latOff = s3 * (T.hw[i0] + 2.2 + row * 2.2);
        var sx0 = 78, seg = 13;
        for (var sg3 = 0; sg3 < seg; sg3++) {
          var t3 = -10 + (sg3 + 0.5) * (sx0 / seg);
          var ii = (Math.round(t3 / T.step) + T.M) % T.M;
          var pc = U.hash2(row * 7 + sg3, s3 * 3);
          var colr = pc < 0.2 ? [0.30, 0.36, 0.55] : pc < 0.4 ? [0.60, 0.20, 0.20] : F.standC || [0.42, 0.44, 0.48];
          list.push([T.x[ii] + T.nx[ii] * latOff, T.y[ii] + 0.8 + row * 1.1, T.z[ii] + T.nz[ii] * latOff,
            2.0, 1.0, sx0 / seg - 0.3, colr, tRot(T, ii)]);
        }
        // roof columns + canopy
        if (row === 4) {
          for (sg3 = 0; sg3 < seg; sg3 += 3) {
            t3 = -10 + (sg3 + 0.5) * (sx0 / seg);
            ii = (Math.round(t3 / T.step) + T.M) % T.M;
            list.push([T.x[ii] + T.nx[ii] * latOff, T.y[ii] + 4.4, T.z[ii] + T.nz[ii] * latOff,
              0.35, 5.4, 0.35, PAL.rail, 0]);
          }
          ii = Math.round(24 / T.step) % T.M;
          list.push([T.x[i0] + T.nx[i0] * latOff, T.y[i0] + 7.6, T.z[i0] + T.nz[i0] * latOff,
            3.4 + row * 2.2 * 2, 0.35, sx0 + 2, PAL.pit, tRot(T, ii)]);
        }
      }
      // pit / team buildings behind the near stand (one side only)
      if (s3 === 1) {
        for (var bi = 0; bi < 5; bi++) {
          var tb = (Math.round((-40 + bi * 18) / T.step) + T.M) % T.M;
          var bl = T.hw[tb] + 14 + U.hash2(bi, 1) * 5;
          var bh = 4 + U.hash2(bi, 2) * 5;
          list.push([T.x[tb] + T.nx[tb] * bl, T.y[tb] + bh * 0.5, T.z[tb] + T.nz[tb] * bl,
            9 + U.hash2(bi, 3) * 6, bh, 15, PAL.pit, tRot(T, tb)]);
          list.push([T.x[tb] + T.nx[tb] * (bl + 5), T.y[tb] + bh + 0.3, T.z[tb] + T.nz[tb] * (bl + 5),
            9, 0.6, 15, [0.30, 0.32, 0.36], tRot(T, tb)]);
        }
      }
    }

    // ---- suzaka skyline: slab city blocks in the far band ----
    if (F.city) {
      for (var bx = x0 - 420; bx <= x1 + 420; bx += 60)
        for (var bz = z0 - 420; bz <= z1 + 420; bz += 60) {
          n0 = near(G, T, bx, bz, 420);
          if (n0.d < 200 || n0.d > 380) continue;
          if (U.hash2(bx, bz) > 0.55) continue;
          var hgt = 8 + U.hash2(bx + 5, bz - 3) * 34;
          var gh2 = groundH(bx, bz);
          var bc = U.hash2(bx - 2, bz + 8);
          list.push([bx, gh2 + hgt * 0.5, bz, 26 + bc * 10, hgt, 22 + bc * 12,
            [0.34 + bc * 0.16, 0.36 + bc * 0.14, 0.42 + bc * 0.1], 0]);
          list.push([bx, gh2 + hgt + 0.4, bz, 26 + bc * 10 - 2, 0.8, 22 + bc * 12 - 2, PAL.glassB, 0]);
        }
    }

    return {
      boxes: list, crossings: crossings.length,
      env: {
        sky: T.sky, fog: T.fog,
        sun: (function () {
          var l = Math.hypot(T.sun[0], T.sun[1], T.sun[2]);
          return [T.sun[0] / l, T.sun[1] / l, T.sun[2] / l];
        })(),
        fogD: { nord: 640, suzaka: 800, ardennes: 560 }[T.id] || 700
      }
    };
  }

  GT.world = { build: build };
  if (typeof module !== 'undefined') module.exports = GT.world;
})();

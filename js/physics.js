// GT.physics — arcade drift physics on a fixed 120Hz step.
// Velocity lives in the world frame; each step we split it into the car's
// forward/lateral axes, kill the lateral part at "tyre grip" rate (capped by
// the friction circle), rotate the heading with a steering-lagged yaw rate.
// Grip below what the turn demands => the excess lateral velocity survives
// as a slide: that is the drift.
(function () {
  globalThis.GT = globalThis.GT || {};
  var U = GT.util, G = 9.81;
  var DT = 1 / 120;

  function newCarState(car, x, z, heading) {
    return {
      car: car, x: x, z: z, y: 0, h: heading,
      vx: 0, vz: 0, omega: 0,
      hint: 0, idx: 0, lat: 0, onTrack: true, offDist: 0,
      vf: 0, vl: 0, slip: 0,
      // progress
      s: 0, prevS: 0, lap: 0, lapT: 0, lastLap: 0, bestLap: 0,
      sectors: 0, dist: 0, alive: true
    };
  }

  // one fixed dt step; input = {throttle, brake, steer, hand}
  function stepCar(T, st, inp, dt) {
    var car = st.car;
    // ---- stick to the ribbon: elevation-aware nearest sample ----
    // at the bridged crossings a purely planar scan snaps onto the overpass /
    // tunnel ribbon; only accept candidates near the elevation we are at
    if (st.gy === undefined) st.gy = T.y[st.hint];
    var best = -1, bd = 1e18;
    for (var d = -14; d <= 600; d++) {
      var j2 = (st.hint + d + T.M) % T.M;
      if (Math.abs(T.y[j2] - st.gy) > 3.0) continue;
      var exx = st.x - T.x[j2], ezz = st.z - T.z[j2];
      var dd = exx * exx + ezz * ezz;
      if (dd < bd) { bd = dd; best = j2; }
    }
    if (best < 0) {                    // off both ribbons entirely: planar snap
      best = T.nearest(st.x, st.z, st.hint);
      st.gy = T.y[best];
      st.rescues = (st.rescues || 0) + 1;
    }
    st.hint = st.idx = best;
    var i = best;
    st.gy = st.y = T.y[i];
    var dx = st.x - T.x[i], dz = st.z - T.z[i];
    st.lat = dx * T.nx[i] + dz * T.nz[i];            // signed: +left
    st.onTrack = Math.abs(st.lat) <= T.hw[i];
    st.offDist = Math.max(0, Math.abs(st.lat) - T.hw[i]);

    // ---- surface ----
    var surfMu = 1, surfRate = 1, extraDrag = 0;
    if (!st.onTrack) {
      var d = Math.min(st.offDist, 20);
      surfMu = 1 - 0.45 * (d / 20);                  // grass: less grip
      surfRate = 1 - 0.4 * (d / 20);
      extraDrag = 2.2 + 0.05 * d;                    // and it grabs you
    }

    // ---- decompose velocity into the car frame ----
    var ch = Math.cos(st.h), sh = Math.sin(st.h);
    var vf = st.vx * ch + st.vz * sh;
    var vl = -st.vx * sh + st.vz * ch;               // +left component
    st.vf = vf; st.vl = vl;

    // ---- engine / brakes / reverse ----
    var absV = Math.abs(vf);
    var ax = 0;
    var downf = 1 + car.downf * vf * vf / 1.5e6;
    var mu = car.grip * surfMu * downf;
    if (vf > 0.3) {
      var F = inp.throttle * car.power / Math.max(vf, 9);
      var Fmax = (car.drive === 'AWD' ? 1.55 : 0.85) * mu * car.mass * G * 0.55;
      if (F > Fmax) F = Fmax;                        // wheelspin limit
      ax += F / car.mass;
    } else if (inp.throttle > 0 && vf <= 0.3) {
      ax += inp.throttle * 3.2;                      // launch
    }
    if (inp.brake > 0) {
      var bd = inp.brake * car.brake * (st.onTrack ? 1 : 0.55);
      if (vf > 0.2) ax -= Math.min(bd, vf / dt);
      else if (inp.brake > 0.5) ax -= bd * 0.45;     // reverse crawl
    }
    // drag + rolling resistance + grass
    var c = car.drag * 1.8 + extraDrag * 0.09;
    ax -= c * vf * absV / car.mass + (0.013 * G + extraDrag * 0.35) * (vf > 0 ? 1 : vf < 0 ? -1 : 0);
    if (vf < -14) ax = Math.max(ax, 0);
    vf += ax * dt;
    if (vf > 92) vf = 92;

    // ---- how hard the tyres can bite this step (friction circle) ----
    var aLong = Math.abs(ax);
    var latAvail = mu * G * Math.sqrt(Math.max(0.25, 1 - (aLong / (mu * G * 1.4)) * (aLong / (mu * G * 1.4))));
    if (inp.hand) latAvail *= 1.18;                          // handbrake: yaw free, grip gone
    latAvail *= (1 - 0.3 * (car.oversteer - 1) * inp.throttle); // power-oversteer bias

    // ---- yaw from steering (speed-sensitised, lagged, grip-limited) ----
    var steerMax = car.steerMax * (1 - 0.6 * Math.min(1, absV / 80));
    var want = vf * Math.tan(inp.steer * steerMax) / car.wheelBase;
    // tyres cannot force a turn sharper than latAvail allows: cap omega so
    // the car understeers/steps out instead of pirouetting on its spot
    var wMax = latAvail / Math.max(3, Math.abs(vf));
    if (want > wMax) want = wMax; else if (want < -wMax) want = -wMax;
    var resp = car.resp * (inp.hand ? 1.7 : 1);
    st.omega += (want - st.omega) * Math.min(1, resp * dt);
    st.h = U.wrapAngle(st.h + st.omega * dt);

    // ---- lateral grip: kill vl, but no faster than the tyres can bite ----
    var rate = 8 * surfRate;
    if (inp.hand) rate *= 0.32;
    var dv = -vl * Math.min(1, rate * dt);
    var cap = latAvail * dt;
    if (dv < -cap) dv = -cap; else if (dv > cap) dv = cap;
    vl += dv;
    st.slip = Math.abs(vl);

    // ---- back to world, integrate position ----
    st.vx = vf * ch - vl * sh;
    st.vz = vf * sh + vl * ch;
    st.x += st.vx * dt;
    st.z += st.vz * dt;
    st.vf = vf; st.vl = vl;

    // ---- walls where the track says so; soft earth bank elsewhere ----
    var edge = T.hw[i] - car.halfW * 0.7;
    if (T.wall[i] && Math.abs(st.lat) > edge) {
      var sgn = st.lat > 0 ? 1 : -1;
      // push straight out of the rail, keep the tangential position
      var excess = Math.abs(st.lat) - edge;
      st.x -= T.nx[i] * sgn * excess;
      st.z -= T.nz[i] * sgn * excess;
      var vt = st.vx * T.tx[i] + st.vz * T.nz[i];
      var vn = st.vx * T.nx[i] + st.vz * T.nz[i];
      if (vn * sgn > 0.5) {           // genuine impact: bounce + heavy scrub
        vn = -vn * 0.3; vt *= 0.82; st.omega *= 0.4;
      } else {                        // grazing the rail: no outward creep
        if (vn * sgn > 0) vn = 0;
        vt *= 0.998;
      }
      st.vx = T.tx[i] * vt + T.nx[i] * vn;
      st.vz = T.tz[i] * vt + T.nz[i] * vn;
    } else if (st.offDist > 18) {
      // soft runoff barrier: spring the car back toward the ribbon
      var sgn2 = st.lat > 0 ? 1 : -1;
      var ov = st.offDist - 18;
      st.vx -= T.nx[i] * sgn2 * (1.5 * ov) * dt * 6;
      st.vz -= T.nz[i] * sgn2 * (1.5 * ov) * dt * 6;
    }

    // ---- progress / laps ----
    st.prevS = st.s;
    st.s = T.s[i];
    var q = (i / T.M * 4) | 0;
    st.sectors |= 1 << q;
    st.lapT += dt;
    if (st.prevS > T.L * 0.9 && st.s < T.L * 0.1 && (st.sectors & 0b1110) === 0b1110) {
      st.lap++; st.sectors = 0b0001; st.lastLap = st.lapT; st.lapT = 0;
      if (!st.bestLap || st.lastLap < st.bestLap) st.bestLap = st.lastLap;
    }
    if (!isFinite(st.x) || !isFinite(st.z) || !isFinite(st.vx)) st.alive = false;
  }

  // car-vs-car: circles of radius ~2.2m shove and share momentum
  function collideCars(a, b) {
    var dx = b.x - a.x, dz = b.z - a.z;
    var d = Math.hypot(dx, dz), R = 2.3;
    if (d > R || d < 1e-4) return;
    var nx = dx / d, nz = dz / d, pen = (R - d) * 0.5;
    a.x -= nx * pen; a.z -= nz * pen;
    b.x += nx * pen; b.z += nz * pen;
    var av = a.vx * nx + a.vz * nz, bv = b.vx * nx + b.vz * nz;
    if (av > bv) {           // closing: swap a slice of normal velocity
      var ma = a.car.mass, mb = b.car.mass, t = 1.35 * (bv - av) / (ma + mb);
      a.vx += nx * t * mb; a.vz += nz * t * mb;
      b.vx -= nx * t * ma; b.vz -= nz * t * ma;
      a.omega *= 0.7; b.omega *= 0.7;
    }
  }

  GT.physics = {
    DT: DT, newCarState: newCarState, stepCar: stepCar, collideCars: collideCars,
    // advance a car n fixed steps for an AI/game loop that ticks differently
    runSteps: function (T, st, inp, seconds) {
      var n = Math.round(seconds / DT);
      for (var k = 0; k < n; k++) stepCar(T, st, inp, DT);
    }
  };
  if (typeof module !== 'undefined') module.exports = GT.physics;
})();

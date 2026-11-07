// GT.ai — Stanley controller riding the baked racing line, with a braking
// lookahead against T.vlim, overtake offsets around slower traffic, and a
// skill knob (grip respect + pace) for the field.
(function () {
  globalThis.GT = globalThis.GT || {};
  var U = GT.util;

  function newAI(car, skill) {
    return { car: car, skill: skill, off: 0, wander: 0, phase: Math.random() * 6.28, stuck: 0 };
  }

  // sample-space ring helpers
  function aheadIdx(i, d, M) { var j = i + d; return j >= M ? j - M : j < 0 ? j + M : j; }

  function aiInput(T, ai, st, others, dt) {
    var M = T.M, STEP = T.step, v = Math.max(1, Math.abs(st.vf));

    // ---- scan ahead for the slowest corner inside the braking horizon ----
    var brakeDist = 8 + (v * v) / (2 * 7.5);         // metres to bleed speed
    var look = Math.min(1400, Math.max(30, brakeDist / STEP));
    var vt = 1e9, vi = 0;
    for (var d = 4; d < look; d += 4) {
      var j = aheadIdx(st.idx, d, M);
      if (T.vlim[j] < vt) { vt = T.vlim[j]; vi = d; }
    }
    vt *= 0.90 + 0.13 * ai.skill;                    // pace knob

    // ---- traffic: dodge with a smoothed lateral offset on the line ----
    var wantOff = 0;
    for (var k = 0; k < others.length; k++) {
      var o = others[k];
      if (o === st || !o.alive) continue;
      var ds = (o.idx - st.idx + M) % M * STEP;
      if (ds > 0 && ds < 34) {
        var dl = o.lat - st.lat;
        if (Math.abs(dl) < 3.2 && o.vf < st.vf + 2) {
          // pass on whichever side has room; the inside of a turn is roomier
          var side = dl > 0 ? -1 : 1;
          if (Math.abs(T.lineOff[st.idx]) > T.hw[st.idx] * 0.45) side = -Math.sign(T.lineOff[st.idx]) || side;
          wantOff = Math.max(-T.hw[st.idx] * 0.7, Math.min(T.hw[st.idx] * 0.7,
            T.lineOff[st.idx] + side * 2.4));
        }
      }
    }
    // light per-car weave so the field doesn't queue up single-file
    ai.wander = Math.sin(st.s * 0.021 + ai.phase) * (0.6 + 0.5 * ai.skill);
    ai.off += ((wantOff || ai.wander) - ai.off) * Math.min(1, 2.2 * dt);

    // ---- Stanley: heading error + cross-track toward the line point ----
    var la = 10 + v * 0.55;                          // metres of preview
    var j2 = aheadIdx(st.idx, Math.round(la / STEP), M);
    var tx2 = T.lineX[j2] + T.nx[j2] * ai.off, tz2 = T.lineZ[j2] + T.nz[j2] * ai.off;
    var psi = U.wrapAngle(Math.atan2(tz2 - st.z, tx2 - st.x) - st.h);
    var ex = st.x - T.lineX[st.idx], ez = st.z - T.lineZ[st.idx];
    var e = ex * T.nx[st.idx] + ez * T.nz[st.idx];   // +left of line
    var steer = psi - Math.atan2(0.9 * e, v + 4);
    // if the corner needs more steering than the car can give, scrub speed
    // (only meaningful while rolling: off-line at low speed, just turn harder)
    if (v > 10 && Math.abs(steer) > st.car.steerMax * 0.9) vt = Math.min(vt, v * 0.96);
    steer = U.clamp(steer / (st.car.steerMax * (1 - 0.6 * Math.min(1, v / 80))), -1, 1);

    // ---- throttle / brake toward the target speed ----
    var inp = { throttle: 0, brake: 0, steer: steer, hand: 0 };
    if (st.vf < vt - 1.5) inp.throttle = U.clamp((vt - st.vf) * 0.35, 0, 1);
    else if (st.vf > vt + 1.0) inp.brake = U.clamp((st.vf - vt) * 0.22, 0, 0.9);
    // if it spun / pointed backwards, point at the ribbon and recover
    let trkH = Math.atan2(T.tz[st.idx], T.tx[st.idx]);
    let align = U.wrapAngle(trkH - st.h);
    let alignErr = Math.abs(align);
    if (alignErr > 1.9) {
      inp.steer = Math.sign(align);
      inp.throttle = 0; inp.brake = st.vf > 12 ? 0.7 : 0;
    }
    // stalled (rail-grazed, nose-in on grass): power along the ribbon until
    // rolling again instead of grinding against the wall
    ai.stuck = st.vf < 2.5 ? ai.stuck + dt : 0;
    if (ai.stuck > 1.5) {
      inp = { throttle: 1, brake: 0, steer: U.clamp(align / st.car.steerMax, -1, 1), hand: 0 };
      if (st.vf < -1) inp = { throttle: 0, brake: 0.8, steer: 0, hand: 0 };
      if (st.offDist > 3) inp.steer = U.clamp(-Math.sign(st.lat) * 0.8 + align / st.car.steerMax * 0.4, -1, 1);
    }
    return inp;
  }

  GT.ai = { newAI: newAI, aiInput: aiInput };
  if (typeof module !== 'undefined') module.exports = GT.ai;
})();

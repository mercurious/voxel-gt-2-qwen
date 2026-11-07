// GT.game — glue: menus, fixed-step sim driving, chase camera, HUD, minimap,
// ghost record/replay, best laps + medals in localStorage.
(function () {
  globalThis.GT = globalThis.GT || {};
  var U = GT.util, P, A, GL, AU;

  var G = {
    mode: 'menu', track: 0, car: 0, runMode: 'attack',
    lapsToRun: 3, camMode: 0
  };
  var sim = null;
  var keys = {};
  var $ = function (id) { return document.getElementById(id); };

  // ---------------------------------------------------------------- menu ---
  var trackCache = null;
  function refLaps() {
    if (!trackCache) trackCache = GT.TRACKS.map(function (d) { return GT.buildTrack(d).refLap; });
    return trackCache;
  }

  function buildMenu() {
    var refs = refLaps();
    var tc = $('trackCards'); tc.innerHTML = '';
    GT.TRACKS.forEach(function (d, i) {
      var e = document.createElement('div');
      e.className = 'card' + (i === G.track ? ' sel' : '');
      e.innerHTML = '<div class="cname">' + d.name + '</div>' +
        '<div class="csub">' + d.real + ' · ' + d.weather + '</div>' +
        '<div class="cmeta">ref lap ' + U.fmtTime(refs[i]) + '</div>';
      e.onclick = function () { G.track = i; buildMenu(); };
      tc.appendChild(e);
    });
    var cc = $('carCards'); cc.innerHTML = '';
    GT.CARS.forEach(function (c, i) {
      var e = document.createElement('div');
      e.className = 'card car' + (i === G.car ? ' sel' : '');
      var bars = ['spd', 'acc', 'grip', 'brake'].map(function (k) {
        return '<div class="bar"><span>' + k.toUpperCase() + '</span><i style="width:' + c.st[k] + '%"></i></div>';
      }).join('');
      e.innerHTML = '<div class="chip" style="background:' + c.hex + '"></div>' +
        '<div class="cname">' + c.brand + ' ' + c.model + '</div>' +
        '<div class="csub">' + c.country + ' · ' + c.drive + '</div>' + bars;
      e.onclick = function () { G.car = i; buildMenu(); };
      cc.appendChild(e);
    });
    var d = GT.TRACKS[G.track], c = GT.CARS[G.car];
    var best = U.store.get('best.' + d.id + '.' + c.id);
    $('bestLine').textContent = best
      ? 'PB ' + U.fmtTime(best.t) + '  ' + (best.medal || '—') + '  (ref ' + U.fmtTime(refs[G.track]) + ')'
      : 'No time on record yet — go set one.';
    document.querySelectorAll('#modeRow button').forEach(function (b) {
      b.classList.toggle('sel', b.dataset.mode === G.runMode);
    });
  }

  // ---------------------------------------------------------------- race ---
  function place(T, car, row) {
    var idx = (T.M - 4 - row * 7 + T.M) % T.M;
    var st = P.newCarState(car,
      T.lineX[idx] + T.nx[idx] * (row % 2 ? 2.6 : -2.6),
      T.lineZ[idx] + T.nz[idx] * (row % 2 ? 2.6 : -2.6),
      Math.atan2(T.tz[idx], T.tx[idx]));
    st.hint = st.idx = idx;
    return st;
  }

  function beginRun() {
    var def = GT.TRACKS[G.track], car = GT.CARS[G.car];
    var T = GT.buildTrack(def);
    var w = GT.world.build(T);
    GL.init(canvasEl);              // idempotent per canvas; re-init if lost
    GL.uploadStatic(w.boxes);
    sim = {
      T: T, env: w.env, t: 0, countT: 4.2, acc: 0,
      player: null, field: [],
      lapSamples: [], ghost: null, ghostRec: null, finished: false, endT: 0,
      lapLog: [], cam: { x: 0, y: 0, z: 0 }
    };
    var rows = 0;
    sim.player = place(T, car, rows++);
    sim.player.isPlayer = true;
    if (G.runMode === 'attack') {
      var others = GT.CARS.filter(function (c2) { return c2 !== car; });
      others.forEach(function (c2, k) {
        var ai = A.newAI(c2, 0.74 + 0.045 * k + Math.random() * 0.05);
        var st = place(T, c2, rows++);
        sim.field.push({ st: st, ai: ai });
      });
    }
    var gs = U.store.get('ghost.' + def.id + '.' + car.id);
    if (gs) sim.ghost = gs;
    sim.cam.x = sim.player.x; sim.cam.z = sim.player.z; sim.cam.y = sim.player.y;
    G.mode = 'count';
    $('menu').classList.add('hidden');
    $('results').classList.add('hidden');
    $('hud').classList.remove('hidden');
    $('count').textContent = '';
  }

  function readInput() {
    var up = keys.ArrowUp || keys.KeyW, dn = keys.ArrowDown || keys.KeyS;
    var lft = keys.ArrowLeft || keys.KeyA, rgt = keys.ArrowRight || keys.KeyD;
    var i = sim.input = sim.input || { throttle: 0, brake: 0, steer: 0, hand: 0 };
    i.throttle = up ? 1 : 0;
    i.brake = dn ? 1 : 0;
    i.hand = keys.Space ? 1 : 0;
    return i;
  }
  // steering springs toward target (keyboard digital -> analog)
  function steerTick(dt) {
    var i = sim.input;
    var want = (keys.ArrowLeft || keys.KeyA ? -1 : 0) + (keys.ArrowRight || keys.KeyD ? 1 : 0);
    var rate = want === 0 ? 7 : 3.4;
    i.steer += U.clamp(want - i.steer, -rate * dt, rate * dt);
  }

  function respawn() {
    var st = sim.player, T = sim.T, i = st.idx;
    st.x = T.lineX[i]; st.z = T.lineZ[i]; st.h = Math.atan2(T.tz[i], T.tx[i]);
    st.vx = st.vz = st.omega = 0; st.vf = 0; st.vl = 0;
    st.gy = T.y[i];
  }

  // ref lap is the baked limit lap; the AI field lives around 1.2-1.35x it,
  // so medals are graded against what a strong human can actually reproduce
  function medalFor(t, ref) {
    if (t <= ref * 1.10) return 'GOLD';
    if (t <= ref * 1.18) return 'SILVER';
    if (t <= ref * 1.28) return 'BRONZE';
    return '—';
  }

  function playerLapDone(st) {
    var def = GT.TRACKS[G.track], car = st.car;
    var t = st.lastLap, ref = sim.T.refLap;
    sim.lapLog.push(t);
    AU.blip(880, 0.08, 0.15);
    // ghost candidate for this lap: samples recorded since last crossing
    if (sim.recLap && sim.recLap.length > 8) {
      var cand = sim.recLap;
      sim.recLap = [];
      var prev = U.store.get('best.' + def.id + '.' + car.id);
      if (!prev || t < prev.t) {
        var med = medalFor(t, ref);
        U.store.set('best.' + def.id + '.' + car.id, { t: t, medal: med });
        U.store.set('ghost.' + def.id + '.' + car.id, {
          t: t,
          s: cand.map(function (q) { return [+q[0].toFixed(2), +q[1].toFixed(2), +q[2].toFixed(2), +q[3].toFixed(2), +q[4].toFixed(3)]; })
        });
        sim.ghost = U.store.get('ghost.' + def.id + '.' + car.id);
        if (med !== '—') AU.blip(1320, 0.25, 0.2);
      }
    }
    if (G.runMode === 'attack' && st.lap >= G.lapsToRun) endRun();
  }

  function endRun() {
    G.mode = 'results';
    AU.setEngine(0, 0); AU.setSkid(0, 0);
    var st = sim.player, def = GT.TRACKS[G.track], car = st.car;
    var best = U.store.get('best.' + def.id + '.' + car.id);
    var laps = sim.lapLog.map(function (t, k) {
      return '<div class="laprow"><span>LAP ' + (k + 1) + '</span><b>' + U.fmtTime(t) + '</b></div>';
    }).join('');
    $('results').innerHTML =
      '<h2>RUN COMPLETE</h2>' +
      '<div class="csub">' + def.name + ' · ' + car.brand + ' ' + car.model + '</div>' +
      laps +
      '<div class="bigstat">' + (best ? 'BEST ' + U.fmtTime(best.t) + '  ' + best.medal : 'NO VALID LAP') + '</div>' +
      '<div class="btnrow"><button id="againBtn">AGAIN</button><button id="exitBtn">GARAGE</button></div>';
    $('results').classList.remove('hidden');
    $('againBtn').onclick = beginRun;
    $('exitBtn').onclick = toMenu;
  }
  function toMenu() {
    sim = null; G.mode = 'menu';
    $('results').classList.add('hidden');
    $('hud').classList.add('hidden');
    $('pause').classList.add('hidden');
    $('menu').classList.remove('hidden');
    buildMenu();
  }

  // -------------------------------------------------------------- stepping ---
  function stepSim(dt) {
    var T = sim.T, DT = P.DT;
    if (G.mode === 'count') {
      sim.countT -= dt;
      $('count').textContent = sim.countT > 0.6 ? String(Math.ceil(sim.countT - 0.6)) : 'GO';
      if (sim.countT <= -0.4) { G.mode = 'run'; $('count').textContent = ''; }
      if (sim.countT <= 0.6 && sim.countT + dt > 0.6) AU.blip(1200, 0.15, 0.3);
      else if (Math.ceil(sim.countT - 0.6) !== Math.ceil(sim.countT + dt - 0.6)) AU.blip(700, 0.12, 0.25);
      return;
    }
    var inp = readInput();
    steerTick(dt);
    sim.acc += dt;
    var guard = 0;
    while (sim.acc >= DT && guard++ < 12) {
      sim.acc -= DT;
      var all = [sim.player].concat(sim.field.map(function (f) { return f.st; }));
      var pv = sim.player.vx, pz = sim.player.vz;
      P.stepCar(T, sim.player, inp, DT);
      sim.field.forEach(function (f) {
        var ain = A.aiInput(T, f.ai, f.st, all, DT);
        P.stepCar(T, f.st, ain, DT);
      });
      for (var a = 0; a < all.length; a++)
        for (var b = a + 1; b < all.length; b++) P.collideCars(all[a], all[b]);
      // impact -> crash sfx (velocity change over one step)
      var dvx = sim.player.vx - pv, dvz = sim.player.vz - pz, dvmag = Math.hypot(dvx, dvz);
      if (dvmag > 5) AU.crash(Math.min(1, dvmag / 16));
      // per-step audio inputs settle outside; keep latest
      // ghost recording for the player's current flying lap
      if (G.mode === 'run') {
        var st = sim.player;
        sim.recLap = sim.recLap || [];
        if (st.lapT - (sim.lastRec || -1) >= 0.1) {
          sim.lastRec = st.lapT;
          sim.recLap.push([st.lapT, st.x, st.z, st.y, st.h]);
        }
        if (st.lapT < (sim.lastRec || 0)) sim.lastRec = -1;   // lap rolled over
      }
      if (sim.player.lap > (sim.lastPlayerLap || 0) && G.mode === 'run') {
        sim.lastPlayerLap = sim.player.lap;
        playerLapDone(sim.player);
      }
    }
    if (G.mode === 'run' || G.mode === 'results') {
      AU.setEngine(sim.player.vf, sim.input.throttle);
      AU.setSkid(sim.player.slip, Math.abs(sim.player.vf));
    }
  }

  function ghostPose() {
    var g = sim.ghost;
    if (!g || G.mode === 'count') return null;
    var t = sim.player.lapT, S = g.s;
    if (t > g.t) return null;
    var k = Math.min(S.length - 2, Math.max(0, Math.floor(t / 0.1)));
    var a = S[k], b = S[k + 1], f = U.clamp((t - a[0]) / Math.max(1e-3, b[0] - a[0]), 0, 1);
    var dh = U.wrapAngle(b[4] - a[4]);
    return { x: U.lerp(a[1], b[1], f), z: U.lerp(a[2], b[2], f), y: U.lerp(a[3], b[3], f), h: a[4] + dh * f };
  }

  // ---------------------------------------------------------------- render ---
  var canvasEl, mapEl, mapCtx;

  function drawCar(st, ghostAlpha) {
    var car = st.car, rot = Math.PI / 2 - st.h;
    var push = ghostAlpha ? GL.ghostBox : GL.box;
    for (var i = 0; i < car.boxes.length; i++) {
      var b = car.boxes[i], c = car.pal[b[6]];
      var x = st.x + Math.cos(rot) * b[0] + Math.sin(rot) * b[2];
      var z = st.z - Math.sin(rot) * b[0] + Math.cos(rot) * b[2];
      var col = c;
      if (ghostAlpha) col = [c[0] * 0.4 + 0.35, c[1] * 0.5 + 0.45, c[2] * 0.7 + 0.5];
      push(x, st.y + b[1], z, b[3], b[4], b[5], col, rot);
    }
  }

  function draw(dt) {
    if (!sim) return;
    GL.resetDyn();
    var st = sim.player;
    drawCar(st, 0);
    sim.field.forEach(function (f) { drawCar(f.st, 0); });
    var gp = ghostPose();
    if (gp) {
      var ghostSt = { x: gp.x, y: gp.y, z: gp.z, h: gp.h, car: st.car };
      drawCar(ghostSt, 1);
    }
    // chase camera: smoothed follow behind the car, pulls back with speed
    var v = Math.max(0, st.vf);
    var back = 8.2 + v * 0.13, upo = 3.1 + v * 0.035;
    var k = Math.min(1, dt * 4.5);
    var tx = st.x - Math.cos(st.h) * back, tz = st.z - Math.sin(st.h) * back, ty = st.y + upo;
    sim.cam.x += (tx - sim.cam.x) * k;
    sim.cam.y += (ty - sim.cam.y) * k;
    sim.cam.z += (tz - sim.cam.z) * k;
    var la = 9 + v * 0.14;
    GL.render(
      { ex: sim.cam.x, ey: sim.cam.y + 0.9, ez: sim.cam.z, cx: st.x + Math.cos(st.h) * la, cy: st.y + 1.0, cz: st.z + Math.sin(st.h) * la },
      sim.env);
    drawMap();
  }

  // minimap: static track path + live dots
  var mapPath = null, mapTf = null;
  function buildMap(T) {
    mapPath = new Path2D();
    var x0 = 1e18, x1 = -1e18, z0 = 1e18, z1 = -1e18;
    for (var i = 0; i < T.M; i += 4) {
      if (T.x[i] < x0) x0 = T.x[i]; if (T.x[i] > x1) x1 = T.x[i];
      if (T.z[i] < z0) z0 = T.z[i]; if (T.z[i] > z1) z1 = T.z[i];
    }
    var s = Math.min(mapEl.width, mapEl.height) * 0.86 / Math.max(x1 - x0, z1 - z0);
    var ox = mapEl.width / 2 - (x0 + x1) / 2 * s, oy = mapEl.height / 2 - (z0 + z1) / 2 * s;
    mapTf = { s: s, ox: ox, oy: oy };
    for (i = 0; i <= T.M; i += 4) {
      var j = i % T.M, X = T.x[j] * s + ox, Y = T.z[j] * s + oy;
      if (i === 0) mapPath.moveTo(X, Y); else mapPath.lineTo(X, Y);
    }
  }
  function drawMap() {
    if (!mapPath || sim.T !== mapFor) { buildMap(sim.T); mapFor = sim.T; }
    var w = mapEl.width, h = mapEl.height;
    mapCtx.clearRect(0, 0, w, h);
    mapCtx.strokeStyle = 'rgba(230,235,240,0.75)';
    mapCtx.lineWidth = Math.max(1.5, sim.T.hwMax * 2 * mapTf.s);
    mapCtx.lineJoin = 'round';
    mapCtx.stroke(mapPath);
    function dot(st, col, r) {
      mapCtx.fillStyle = col;
      mapCtx.beginPath();
      mapCtx.arc(st.x * mapTf.s + mapTf.ox, st.z * mapTf.s + mapTf.oy, r, 0, 6.2832);
      mapCtx.fill();
    }
    sim.field.forEach(function (f) { dot(f.st, '#8891a0', 2.2); });
    dot(sim.player, '#ff3b4e', 3.4);
  }
  var mapFor = null;

  function hud() {
    if (!sim) return;
    var st = sim.player;
    $('spd').textContent = Math.round(Math.max(0, st.vf) * 3.6);
    $('lapNow').textContent = U.fmtTime(st.lapT);
    var best = st.bestLap;
    $('lapBest').textContent = U.fmtTime(best);
    $('lapLast').textContent = U.fmtTime(st.lastLap);
    $('lapNo').textContent = G.runMode === 'attack'
      ? 'LAP ' + Math.min(st.lap + 1, G.lapsToRun) + '/' + G.lapsToRun
      : 'LAP ' + (st.lap + 1);
    if (G.runMode === 'attack') {
      var all = [sim.player].concat(sim.field.map(function (f) { return f.st; }));
      all.sort(function (a, b) { return (b.lap * 1e6 + b.idx) - (a.lap * 1e6 + a.idx); });
      var p = all.indexOf(st) + 1;
      $('posTxt').textContent = p + '/' + all.length;
    } else $('posTxt').textContent = 'PRACTICE';
    $('warn').classList.toggle('show', st.offDist > 2.5 && G.mode === 'run');
  }

  // ----------------------------------------------------------------- boot ---
  var last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    if (G.mode === 'pause') { draw(0); hud(); return; }
    if (G.mode === 'count' || G.mode === 'run' || G.mode === 'results') {
      if (G.mode !== 'results') stepSim(dt);
      draw(dt); hud();
    }
  }

  function boot() {
    P = GT.physics; A = GT.ai; GL = GT.gl; AU = GT.audio;
    canvasEl = $('gl'); mapEl = $('map'); mapCtx = mapEl.getContext('2d');
    GL.init(canvasEl);
    document.addEventListener('keydown', function (e) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0) e.preventDefault();
      keys[e.code] = true;
      if (e.code === 'KeyR' && (G.mode === 'run' || G.mode === 'count')) respawn();
      if (e.code === 'KeyM') AU.mute(!AU.on);
      if (e.code === 'Escape' && (G.mode === 'run' || G.mode === 'pause')) {
        $('pause').classList.toggle('hidden');
        G.mode = G.mode === 'run' ? 'pause' : 'run';
      }
    });
    document.addEventListener('keyup', function (e) { keys[e.code] = false; });
    $('startBtn').onclick = function () { AU.init(); beginRun(); };
    $('qMenuBtn').onclick = toMenu;
    document.querySelectorAll('#modeRow button').forEach(function (b) {
      b.onclick = function () { G.runMode = b.dataset.mode; buildMenu(); };
    });
    buildMenu();
    requestAnimationFrame(frame);
  }

  window.addEventListener('DOMContentLoaded', boot);
  // _G/_sim exist so the headless smoke test can drive the state machine
  GT.game = { boot: boot, _G: G, _sim: function () { return sim; } };
})();

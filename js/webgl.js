// GT.gl — WebGL2 instanced-box renderer. Everything in the scene is a box:
// one vertex shader builds a unit cube from gl_VertexID; per-instance attrs
// place/scale/tint/spin it. Two batches: static world + dynamic actors,
// plus a translucent pass for the ghost.
(function () {
  globalThis.GT = globalThis.GT || {};
  var GL = { gl: null, canvas: null };

  var VS = [
    '#version 300 es',
    'layout(location=0) in vec3 aPos; layout(location=1) in vec3 aScl;',
    'layout(location=2) in vec3 aCol; layout(location=3) in float aRot;',
    'uniform mat4 uVP; out vec3 vCol; out vec3 vN; out vec3 vW;',
    'const vec3 P[8]=vec3[8](vec3(-.5,-.5,-.5),vec3(.5,-.5,-.5),vec3(.5,-.5,.5),vec3(-.5,-.5,.5),',
    '  vec3(-.5,.5,-.5),vec3(.5,.5,-.5),vec3(.5,.5,.5),vec3(-.5,.5,.5));',
    // face order must match NN: -y +y +x -x +z -z, each pair CCW-seen-from-outside
    'const int F[36]=int[36](0,1,2,0,2,3, 7,6,5,7,5,4, 1,5,6,1,6,2, 0,7,4,0,3,7, 2,6,7,2,7,3, 4,5,1,4,1,0);',
    'const vec3 NN[6]=vec3[6](vec3(0,-1,0),vec3(0,1,0),vec3(1,0,0),vec3(-1,0,0),vec3(0,0,1),vec3(0,0,-1));',
    'void main(){',
    '  vec3 lp=P[F[gl_VertexID]]*aScl;',
    '  float c=cos(aRot),s=sin(aRot);',
    '  vec3 rp=vec3(c*lp.x+s*lp.z,lp.y,-s*lp.x+c*lp.z);',
    '  vec3 rn=mat3(c,0,-s, 0,1,0, s,0,c)*NN[gl_VertexID/6];',
    '  vW=aPos+rp; vN=rn; vCol=aCol; gl_Position=uVP*vec4(vW,1.0);',
    '}'
  ].join('\n');

  var FS = [
    '#version 300 es',
    'precision mediump float;',
    'in vec3 vCol; in vec3 vN; in vec3 vW; out vec4 o;',
    'uniform vec3 uCam; uniform vec3 uSun; uniform vec3 uSky; uniform vec3 uFogCol;',
    'uniform float uFogD; uniform float uAlpha;',
    'void main(){',
    '  float d=length(vW-uCam);',
    '  float dif=max(0.0,dot(vN,uSun))*0.72+0.34;',
    '  float shade=1.0-0.34*step(vN.y,0.1);',          // undersides darker
    '  vec3 c=vCol*dif*mix(shade,1.0,0.45);',
    '  float fg=1.0-exp(-pow(d/uFogD,2.0));',
    '  o=vec4(mix(c,uFogCol,fg),uAlpha);',
    '}'
  ].join('\n');

  function prog(gl, vs, fs) {
    var p = gl.createProgram();
    [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach(function (t, k) {
      var sh = gl.createShader(t); gl.shaderSource(sh, k ? fs : vs); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      gl.attachShader(p, sh);
    });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  // mat4 (column-major) helpers
  function m4perspective(fov, asp, n, f) {
    var t = 1 / Math.tan(fov / 2), o = new Float32Array(16);
    o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1;
    o[14] = 2 * f * n / (n - f); return o;
  }
  function m4look(ex, ey, ez, cx, cy, cz, upx, upy, upz) {
    var zx = ex - cx, zy = ey - cy, zz = ez - cz;
    var l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    var xx = upy * zz - upz * zy, xy = upz * zx - upx * zz, xz = upx * zy - upy * zx;
    l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    var o = new Float32Array(16);
    o[0] = xx; o[1] = yx; o[2] = zx; o[4] = xy; o[5] = yy; o[6] = zy; o[8] = xz; o[9] = yz; o[10] = zz;
    o[12] = -(xx * ex + xy * ey + xz * ez); o[13] = -(yx * ex + yy * ey + yz * ez); o[14] = -(zx * ex + zy * ey + zz * ez);
    o[15] = 1; return o;
  }
  function m4mul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }

  // instance buffer: packed [x,y,z, sx,sy,sz, r,g,b, rot] x N
  function makeBatch(gl, cap) {
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, cap * 10 * 4, gl.DYNAMIC_DRAW);
    var st = 40;
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, st, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, st, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, st, 24);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, st, 36);
    gl.vertexAttribDivisor(0, 1); gl.vertexAttribDivisor(1, 1);
    gl.vertexAttribDivisor(2, 1); gl.vertexAttribDivisor(3, 1);
    gl.bindVertexArray(null);
    return { vao: vao, buf: buf, data: new Float32Array(cap * 10), n: 0, cap: cap };
  }
  function pushBox(b, x, y, z, sx, sy, sz, col, rot) {
    if (b.n >= b.cap) return;
    var d = b.data, o = b.n * 10;
    d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = sx; d[o + 4] = sy; d[o + 5] = sz;
    d[o + 6] = col[0]; d[o + 7] = col[1]; d[o + 8] = col[2]; d[o + 9] = rot || 0;
    b.n++;
  }

  GL.init = function (canvas) {
    GL.canvas = canvas;
    var gl = GL.gl = canvas.getContext('webgl2', { antialias: true });
    if (!gl) throw new Error('WebGL2 not available');
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    GL.pg = prog(gl, VS, FS);
    gl.useProgram(GL.pg);
    GL.u = {};
    ['uVP', 'uCam', 'uSun', 'uSky', 'uFogCol', 'uFogD', 'uAlpha'].forEach(function (k) {
      GL.u[k] = gl.getUniformLocation(GL.pg, k);
    });
    GL.staticB = null;      // world, uploaded once per track
    GL.dynB = makeBatch(gl, 2048);
    GL.ghostB = makeBatch(gl, 128);
    return gl;
  };

  GL.uploadStatic = function (list) {
    var gl = GL.gl;
    var b = makeBatch(gl, list.length);
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      pushBox(b, t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7] || 0);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, b.buf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, b.data, 0, b.n * 10);
    GL.staticB = b;
  };

  GL.resetDyn = function () { GL.dynB.n = 0; GL.ghostB.n = 0; };
  GL.box = function (x, y, z, sx, sy, sz, col, rot) { pushBox(GL.dynB, x, y, z, sx, sy, sz, col, rot); };
  GL.ghostBox = function (x, y, z, sx, sy, sz, col, rot) { pushBox(GL.ghostB, x, y, z, sx, sy, sz, col, rot); };

  GL.render = function (cam, env) {
    var gl = GL.gl, c = GL.canvas;
    if (c.width !== c.clientWidth || c.height !== c.clientHeight) {
      c.width = c.clientWidth; c.height = c.clientHeight;
    }
    gl.viewport(0, 0, c.width, c.height);
    gl.clearColor(env.fog[0], env.fog[1], env.fog[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var vp = m4mul(m4perspective(1.12, c.width / c.height, 0.4, 1600),
      m4look(cam.ex, cam.ey, cam.ez, cam.cx, cam.cy, cam.cz, 0, 1, 0));
    gl.useProgram(GL.pg);
    gl.uniformMatrix4fv(GL.u.uVP, false, vp);
    gl.uniform3f(GL.u.uCam, cam.ex, cam.ey, cam.ez);
    gl.uniform3f(GL.u.uSun, env.sun[0], env.sun[1], env.sun[2]);
    gl.uniform3f(GL.u.uSky, env.sky[0], env.sky[1], env.sky[2]);
    gl.uniform3f(GL.u.uFogCol, env.fog[0], env.fog[1], env.fog[2]);
    gl.uniform1f(GL.u.uFogD, env.fogD || 700);
    gl.uniform1f(GL.u.uAlpha, 1);
    if (GL.staticB) {
      gl.bindVertexArray(GL.staticB.vao);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, GL.staticB.n);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, GL.dynB.buf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, GL.dynB.data, 0, GL.dynB.n * 10);
    gl.bindVertexArray(GL.dynB.vao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, GL.dynB.n);
    // ghost pass: blended, no depth write
    if (GL.ghostB.n) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.uniform1f(GL.u.uAlpha, 0.42);
      gl.bindBuffer(gl.ARRAY_BUFFER, GL.ghostB.buf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, GL.ghostB.data, 0, GL.ghostB.n * 10);
      gl.bindVertexArray(GL.ghostB.vao);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, GL.ghostB.n);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
    gl.bindVertexArray(null);
  };

  GT.gl = GL;
})();

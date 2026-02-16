/**
 * WebGL2 fluid simulation background with rain.
 * Fluid solver: velocity + dye, advection → divergence → pressure (Jacobi) → gradient subtract.
 * Rain: particles spawn at top, fall; on impact inject splats (velocity + dye) into the fluid.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('fluid-background');
  if (!canvas) return;

  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, powerPreference: 'high-performance' });
  if (!gl) {
    canvas.style.display = 'none';
    return;
  }

  const SIM_RES = 256;
  const JACOBI_ITERATIONS = 25;
  const RAIN_COUNT = 400;
  const SPLAT_RADIUS = 0.015;
  const SPLAT_FORCE = 0.4;
  const DYE_AMOUNT = 0.6;
  const GRAVITY = 0.0008;
  const DAMPING = 0.98;
  const DT = 1 / 60;

  let width = 0, height = 0;
  let dpr = Math.min(2, window.devicePixelRatio || 1);
  let velocityFBO = [], dyeFBO = [], pressureFBO = [];
  let divergenceFBO = null;
  let programs = {};
  let quadBuffer = null;
  let rainParticles = [];

  const baseVert = `#version 300 es
    in vec2 a_uv;
    out vec2 v_uv;
    void main() {
      v_uv = a_uv;
      gl_Position = vec4(2.0 * a_uv - 1.0, 0.0, 1.0);
    }
  `;

  const advectionFrag = `#version 300 es
    precision highp float;
    uniform sampler2D u_velocity;
    uniform sampler2D u_source;
    uniform vec2 u_texelSize;
    uniform float u_dt;
    uniform float u_dissipation;
    uniform bool u_velocityPass;
    in vec2 v_uv;
    out vec4 outColor;
    void main() {
      vec2 v = texture(u_velocity, v_uv).xy - 0.5;
      vec2 pos = v_uv - u_dt * v * 3.0;
      pos = clamp(pos, u_texelSize, 1.0 - u_texelSize);
      vec4 s = texture(u_source, pos);
      if (u_velocityPass)
        outColor = vec4(u_dissipation * s.xy, 0.0, 1.0);
      else
        outColor = u_dissipation * s;
    }
  `;

  const divergenceFrag = `#version 300 es
    precision highp float;
    uniform sampler2D u_velocity;
    uniform vec2 u_texelSize;
    in vec2 v_uv;
    out float outDiv;
    void main() {
      float L = texture(u_velocity, v_uv - vec2(u_texelSize.x, 0.0)).x;
      float R = texture(u_velocity, v_uv + vec2(u_texelSize.x, 0.0)).x;
      float B = texture(u_velocity, v_uv - vec2(0.0, u_texelSize.y)).y;
      float T = texture(u_velocity, v_uv + vec2(0.0, u_texelSize.y)).y;
      float dx = u_texelSize.x;
      outDiv = 0.5 * ((R - L) + (T - B)) / dx;
    }
  `;

  const jacobiFrag = `#version 300 es
    precision highp float;
    uniform sampler2D u_pressure;
    uniform sampler2D u_divergence;
    uniform vec2 u_texelSize;
    in vec2 v_uv;
    out float outP;
    void main() {
      float L = texture(u_pressure, v_uv - vec2(u_texelSize.x, 0.0)).r;
      float R = texture(u_pressure, v_uv + vec2(u_texelSize.x, 0.0)).r;
      float B = texture(u_pressure, v_uv - vec2(0.0, u_texelSize.y)).r;
      float T = texture(u_pressure, v_uv + vec2(0.0, u_texelSize.y)).r;
      float div = texture(u_divergence, v_uv).r;
      float dx2 = u_texelSize.x * u_texelSize.y;
      outP = (L + R + B + T - div * dx2) * 0.25;
    }
  `;

  const gradientFrag = `#version 300 es
    precision highp float;
    uniform sampler2D u_velocity;
    uniform sampler2D u_pressure;
    uniform vec2 u_texelSize;
    in vec2 v_uv;
    out vec4 outVelocity;
    void main() {
      float L = texture(u_pressure, v_uv - vec2(u_texelSize.x, 0.0)).r;
      float R = texture(u_pressure, v_uv + vec2(u_texelSize.x, 0.0)).r;
      float B = texture(u_pressure, v_uv - vec2(0.0, u_texelSize.y)).r;
      float T = texture(u_pressure, v_uv + vec2(0.0, u_texelSize.y)).r;
      vec2 v = texture(u_velocity, v_uv).xy;
      v -= 0.5 * vec2(R - L, T - B);
      outVelocity = vec4(v, 0.0, 1.0);
    }
  `;

  const splatFrag = `#version 300 es
    precision highp float;
    uniform sampler2D u_source;
    uniform vec2 u_point;
    uniform vec4 u_value;
    uniform float u_radius;
    in vec2 v_uv;
    out vec4 outColor;
    void main() {
      float d = distance(v_uv, u_point);
      float w = exp(-d * d / (u_radius * u_radius));
      outColor = texture(u_source, v_uv) + u_value * w;
    }
  `;

  const copyFrag = `#version 300 es
    precision highp float;
    uniform sampler2D u_source;
    in vec2 v_uv;
    out vec4 outColor;
    void main() { outColor = texture(u_source, v_uv); }
  `;

  const displayFrag = `#version 300 es
    precision highp float;
    uniform sampler2D u_dye;
    uniform float u_brightness;
    uniform float u_darken;
    in vec2 v_uv;
    out vec4 outColor;
    void main() {
      vec4 c = texture(u_dye, v_uv);
      c.rgb *= u_brightness;
      c = mix(vec4(u_darken, u_darken, u_darken, 1.0), c, c.a);
      outColor = c;
    }
  `;

  function createProgram(vertSrc, fragSrc) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vertSrc);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.warn('vert compile:', gl.getShaderInfoLog(vs));
      return null;
    }
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragSrc);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.warn('frag compile:', gl.getShaderInfoLog(fs));
      return null;
    }
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn('link:', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }

  function createFBO(w, h, internalFormat, format, type, filter) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter || gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter || gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return { fbo, tex, w, h };
  }

  function initResources() {
    quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);

    programs.advection = createProgram(baseVert, advectionFrag);
    programs.divergence = createProgram(baseVert, divergenceFrag);
    programs.jacobi = createProgram(baseVert, jacobiFrag);
    programs.gradient = createProgram(baseVert, gradientFrag);
    programs.splat = createProgram(baseVert, splatFrag);
    programs.copy = createProgram(baseVert, copyFrag);
    programs.display = createProgram(baseVert, displayFrag);

    const allPrograms = [programs.advection, programs.divergence, programs.jacobi, programs.gradient, programs.splat, programs.copy, programs.display];
    if (allPrograms.some(function (p) { return !p; })) {
      console.warn('Fluid background: shader compile/link failed, disabling.');
      canvas.style.display = 'none';
      return null;
    }

    const r = SIM_RES;
    const velFormat = gl.RG32F;
    const velType = gl.FLOAT;
    velocityFBO = [
      createFBO(r, r, velFormat, gl.RG, velType),
      createFBO(r, r, velFormat, gl.RG, velType)
    ];
    dyeFBO = [
      createFBO(r, r, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE),
      createFBO(r, r, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE)
    ];
    pressureFBO = [
      createFBO(r, r, gl.R32F, gl.RED, gl.FLOAT),
      createFBO(r, r, gl.R32F, gl.RED, gl.FLOAT)
    ];
    divergenceFBO = createFBO(r, r, gl.R32F, gl.RED, gl.FLOAT);
    return true;
  }

  function resize() {
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (w === width && h === height) return;
    width = w;
    height = h;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }

  function clearFBO(fbo, r, g, b, a) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fbo);
    gl.clearColor(r || 0, g || 0, b || 0, a !== undefined ? a : 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function drawFullscreenQuad(program) {
    gl.useProgram(program);
    const uvLoc = gl.getAttribLocation(program, 'a_uv');
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /** Advect: write to dest, sample velocity from velTex and source from sourceTex (no read/write same FBO). */
  function advect(dest, velTex, sourceTex, dissipation, dt, isVelocityPass) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dest.fbo);
    gl.viewport(0, 0, dest.w, dest.h);
    gl.useProgram(programs.advection);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velTex.tex);
    gl.uniform1i(gl.getUniformLocation(programs.advection, 'u_velocity'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, sourceTex.tex);
    gl.uniform1i(gl.getUniformLocation(programs.advection, 'u_source'), 1);
    const texelSize = 1 / SIM_RES;
    gl.uniform2f(gl.getUniformLocation(programs.advection, 'u_texelSize'), texelSize, texelSize);
    gl.uniform1f(gl.getUniformLocation(programs.advection, 'u_dt'), dt);
    gl.uniform1f(gl.getUniformLocation(programs.advection, 'u_dissipation'), dissipation);
    gl.uniform1i(gl.getUniformLocation(programs.advection, 'u_velocityPass'), isVelocityPass ? 1 : 0);
    drawFullscreenQuad(programs.advection);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function computeDivergence(velocity) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, divergenceFBO.fbo);
    gl.viewport(0, 0, divergenceFBO.w, divergenceFBO.h);
    gl.useProgram(programs.divergence);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.tex);
    gl.uniform1i(gl.getUniformLocation(programs.divergence, 'u_velocity'), 0);
    const texelSize = 1 / SIM_RES;
    gl.uniform2f(gl.getUniformLocation(programs.divergence, 'u_texelSize'), texelSize, texelSize);
    drawFullscreenQuad(programs.divergence);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function jacobiIteration(pressure, divergence, output) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, output.fbo);
    gl.viewport(0, 0, output.w, output.h);
    gl.useProgram(programs.jacobi);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pressure.tex);
    gl.uniform1i(gl.getUniformLocation(programs.jacobi, 'u_pressure'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, divergence.tex);
    gl.uniform1i(gl.getUniformLocation(programs.jacobi, 'u_divergence'), 1);
    const texelSize = 1 / SIM_RES;
    gl.uniform2f(gl.getUniformLocation(programs.jacobi, 'u_texelSize'), texelSize, texelSize);
    drawFullscreenQuad(programs.jacobi);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function subtractGradient(velocity, pressure, output) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, output.fbo);
    gl.viewport(0, 0, output.w, output.h);
    gl.useProgram(programs.gradient);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.tex);
    gl.uniform1i(gl.getUniformLocation(programs.gradient, 'u_velocity'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, pressure.tex);
    gl.uniform1i(gl.getUniformLocation(programs.gradient, 'u_pressure'), 1);
    const texelSize = 1 / SIM_RES;
    gl.uniform2f(gl.getUniformLocation(programs.gradient, 'u_texelSize'), texelSize, texelSize);
    drawFullscreenQuad(programs.gradient);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function copyFBO(source, dest) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dest.fbo);
    gl.viewport(0, 0, dest.w, dest.h);
    gl.useProgram(programs.copy);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, source.tex);
    gl.uniform1i(gl.getUniformLocation(programs.copy, 'u_source'), 0);
    drawFullscreenQuad(programs.copy);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function splat(source, dest, pointX, pointY, value, radius) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dest.fbo);
    gl.viewport(0, 0, dest.w, dest.h);
    gl.useProgram(programs.splat);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, source.tex);
    gl.uniform1i(gl.getUniformLocation(programs.splat, 'u_source'), 0);
    gl.uniform2f(gl.getUniformLocation(programs.splat, 'u_point'), pointX, pointY);
    gl.uniform4f(gl.getUniformLocation(programs.splat, 'u_value'), value[0], value[1], value[2], value[3]);
    gl.uniform1f(gl.getUniformLocation(programs.splat, 'u_radius'), radius);
    drawFullscreenQuad(programs.splat);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function copyToScreen(dye, brightness, darken) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(programs.display);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dye.tex);
    gl.uniform1i(gl.getUniformLocation(programs.display, 'u_dye'), 0);
    gl.uniform1f(gl.getUniformLocation(programs.display, 'u_brightness'), brightness);
    gl.uniform1f(gl.getUniformLocation(programs.display, 'u_darken'), darken);
    drawFullscreenQuad(programs.display);
  }

  function initRain() {
    rainParticles.length = 0;
    for (let i = 0; i < RAIN_COUNT; i++) {
      rainParticles.push({
        x: Math.random(),
        y: Math.random(),
        vx: 0,
        vy: 0
      });
    }
  }

  function updateRainAndSplat(velReadIdx, dyeReadIdx) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const dyeR = isDark ? 0.15 : 0.2;
    const dyeG = isDark ? 0.25 : 0.45;
    const dyeB = isDark ? 0.5 : 0.75;

    copyFBO(velocityFBO[velReadIdx], velocityFBO[1 - velReadIdx]);
    copyFBO(dyeFBO[dyeReadIdx], dyeFBO[1 - dyeReadIdx]);
    let velSrc = 1 - velReadIdx;
    let velDst = velReadIdx;
    let dyeSrc = 1 - dyeReadIdx;
    let dyeDst = dyeReadIdx;

    for (let i = 0; i < rainParticles.length; i++) {
      const p = rainParticles[i];
      p.vy += GRAVITY;
      p.y -= p.vy;
      p.x += p.vx * 0.5;
      p.vx *= DAMPING;
      p.vy *= DAMPING;

      if (p.y < 0) {
        const u = Math.max(0, Math.min(1, p.x));
        const v = 0.02;
        splat(velocityFBO[velSrc], velocityFBO[velDst], u, v, [0, SPLAT_FORCE * 0.5, 0, 1], SPLAT_RADIUS);
        splat(dyeFBO[dyeSrc], dyeFBO[dyeDst], u, v, [dyeR * DYE_AMOUNT, dyeG * DYE_AMOUNT, dyeB * DYE_AMOUNT, DYE_AMOUNT], SPLAT_RADIUS);
        copyFBO(velocityFBO[velDst], velocityFBO[velSrc]);
        copyFBO(dyeFBO[dyeDst], dyeFBO[dyeSrc]);
        p.x = Math.random();
        p.y = 1;
        p.vy = 0;
        p.vx = 0;
      }
    }
    return { velIdx: velSrc, dyeIdx: dyeSrc };
  }

  let velIdx = 0;
  let dyeIdx = 0;
  let frameId = 0;

  function step() {
    try {
      resize();
      if (width <= 0 || height <= 0) {
        frameId = requestAnimationFrame(step);
        return;
      }

      const afterRain = updateRainAndSplat(velIdx, dyeIdx);
      velIdx = afterRain.velIdx;
      dyeIdx = afterRain.dyeIdx;

      const vRead = velocityFBO[velIdx];
      const vWrite = velocityFBO[1 - velIdx];
      advect(vWrite, vRead, vRead, 0.98, DT, true);
      velIdx = 1 - velIdx;
      computeDivergence(velocityFBO[velIdx]);

      clearFBO(pressureFBO[0], 0, 0, 0, 1);
      let pRead = pressureFBO[0];
      let pWrite = pressureFBO[1];
      for (let i = 0; i < JACOBI_ITERATIONS; i++) {
        jacobiIteration(pRead, divergenceFBO, pWrite);
        const t = pRead;
        pRead = pWrite;
        pWrite = t;
      }
      subtractGradient(velocityFBO[velIdx], pRead, vWrite);
      velIdx = 1 - velIdx;

      const dyeRead = dyeFBO[dyeIdx];
      const dyeWrite = dyeFBO[1 - dyeIdx];
      advect(dyeWrite, velocityFBO[velIdx], dyeRead, 0.995, DT, false);
      dyeIdx = 1 - dyeIdx;

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const brightness = isDark ? 0.7 : 0.85;
      const darken = isDark ? 0.06 : 0.92;
      copyToScreen(dyeFBO[dyeIdx], brightness, darken);
    } catch (e) {
      console.warn('Fluid background error:', e);
      canvas.style.display = 'none';
      return;
    }
    frameId = requestAnimationFrame(step);
  }

  function initSim() {
    clearFBO(velocityFBO[0], 0.5, 0.5, 0, 1);
    clearFBO(velocityFBO[1], 0.5, 0.5, 0, 1);
    clearFBO(dyeFBO[0], 0, 0, 0, 0);
    clearFBO(dyeFBO[1], 0, 0, 0, 0);
    initRain();
  }

  if (!initResources()) return;
  initSim();
  step();

  window.addEventListener('resize', resize);
})();

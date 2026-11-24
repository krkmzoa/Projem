/* Su dalgası efekti: bir resmi WebGL ile, suyun yüzeyinden bakılıyormuş gibi hafifçe dalgalandırır.
   Kullanım: var stop = Ripple.start(canvas, resimAdresi, { onReady: fn });  → false dönerse WebGL yok.
   stop() çağrılınca çizim durur. Ekran kartında çalışır; pil ve işlemciyi yormaz. */
(function (global) {
  'use strict';

  var VS = 'attribute vec2 p; varying vec2 v; void main(){ v = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }';

  var FS = [
    'precision mediump float;',
    'uniform sampler2D img; uniform vec2 res; uniform vec2 isz; uniform float t;',
    'varying vec2 v;',
    'float h(vec2 q){ return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }',
    'float n(vec2 q){ vec2 i = floor(q), f = fract(q); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }',
    'float fbm(vec2 q){ float a = 0.5, s = 0.0; for (int k = 0; k < 4; k++) { s += a * n(q); q = q * 2.03 + 1.7; a *= 0.5; } return s; }',
    // resmi ekranı dolduracak şekilde yerleştir (background-size: cover)
    'vec2 cover(vec2 u){ float rs = res.x / res.y, ri = isz.x / isz.y;',
    '  vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0); return (u - 0.5) * s + 0.5; }',
    'void main(){',
    '  vec2 q = v * vec2(res.x / res.y, 1.0) * 2.6;',
    '  float s = t * 0.12;',
    // yavaş akan su: iki katmanlı gürültü + hafif sinüs dalgaları
    '  vec2 d = vec2(fbm(q + vec2(s, s * 0.6)), fbm(q + vec2(-s * 0.7, s) + 4.3)) - 0.5;',
    '  d += 0.35 * vec2(sin(q.y * 3.1 + t * 0.55), cos(q.x * 2.7 + t * 0.47));',
    '  vec4 c = texture2D(img, cover(v + d * 0.011));',
    // su yüzeyindeki ışık oyunu (çok hafif)
    '  float l = fbm(q * 1.8 + d * 2.5 + vec2(s * 1.6, -s));',
    '  c.rgb += (smoothstep(0.55, 0.85, l) - 0.12) * 0.07;',
    '  gl_FragColor = vec4(c.rgb, 1.0);',
    '}'
  ].join('\n');

  function sh(gl, type, src) {
    var o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o));
    return o;
  }

  function start(canvas, src, opts) {
    opts = opts || {};
    var gl = null;
    try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false }) || canvas.getContext('experimental-webgl'); } catch (e) { gl = null; }
    if (!gl) return false;

    var prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl, gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, sh(gl, gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    } catch (e) { return false; }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(prog, 'res'), uIsz = gl.getUniformLocation(prog, 'isz'), uT = gl.getUniformLocation(prog, 't');
    var tex = gl.createTexture(), ready = false, raf = 0, stopped = false, t0 = 0;
    var still = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function size() {
      var dpr = Math.min(global.devicePixelRatio || 1, 1.5);
      var w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    }
    function frame(now) {
      if (stopped) return;
      if (!t0) t0 = now;
      size();
      gl.uniform1f(uT, still ? 0 : (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!still) raf = global.requestAnimationFrame(frame);
    }

    // src: resim adresi ya da hazır bir <img>/<video>/<canvas> (videonun o anki karesi kullanılır)
    function upload(im) {
      if (stopped) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im); } catch (e) { stop(); return; }
      gl.uniform2f(uIsz, im.videoWidth || im.naturalWidth || im.width, im.videoHeight || im.naturalHeight || im.height);
      ready = true;
      raf = global.requestAnimationFrame(function (n) { frame(n); if (opts.onReady) opts.onReady(); });
    }
    if (typeof src === 'string') { var im = new Image(); im.onload = function () { upload(im); }; im.src = src; }
    else upload(src);

    // Sekme arka plandayken çizme (pil)
    function vis() {
      if (stopped || !ready) return;
      if (document.hidden) { global.cancelAnimationFrame(raf); raf = 0; }
      else if (!raf && !still) raf = global.requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange', vis);

    function stop() {
      stopped = true;
      global.cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', vis);
    }
    return stop;
  }

  global.Ripple = { start: start };
})(window);

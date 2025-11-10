// WebGL background shader for Pantalla 2
// Subtle teal gradient with gentle motion and grain
(function () {
  const layer = document.querySelector('.background-layer');
  const canvas = document.getElementById('bgCanvas');
  if (!layer || !canvas) return;

  const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
  if (!gl) {
    console.warn('[Shader] WebGL no soportado, se usa imagen de fondo.');
    return;
  }

  // Oculta la imagen de fallback cuando el shader inicia
  layer.classList.add('shader-ready');

  const vertexSrc = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentSrc = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_time;

    // Utilidad: hash simple que devuelve un valor en [0,1]
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float n = mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
      return n;
    }

    // fBm: varias octavas de ruido para textura granulada natural
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = rot * p * 2.0;
        a *= 0.5;
      }
      return v; // [0,1]
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      // Mantener proporción vertical
      float aspect = u_resolution.x / u_resolution.y;
      vec2 p = vec2(uv.x * aspect, uv.y);

      // Gradiente base (colores inspirados en fondo teal)
      vec3 topColor = vec3(0.020, 0.290, 0.380);   // azul petróleo
      vec3 midColor = vec3(0.090, 0.520, 0.620);   // teal medio
      vec3 bottomColor = vec3(0.120, 0.630, 0.670); // teal claro

      float grad1 = smoothstep(0.0, 0.55, uv.y);
      float grad2 = smoothstep(0.55, 1.0, uv.y);
      vec3 base = mix(topColor, midColor, grad1);
      base = mix(base, bottomColor, grad2);

      // Ondulación sutil (ligeramente más visible)
      float wave = sin(uv.y * 3.5 + u_time * 0.25) * 0.022;
      wave += sin((uv.x + uv.y) * 2.0 - u_time * 0.20) * 0.014;
      base += vec3(wave * 0.25);

      // Campo de flujo para desplazar el grano
      vec2 flow = vec2(
        fbm(uv * 2.0 + vec2(u_time * 0.15, 0.0)),
        fbm(uv * 2.0 + vec2(0.0, -u_time * 0.15))
      );
      flow = (flow - 0.5) * 0.04; // magnitud del desplazamiento del ruido

      // Grano animado tipo película (más perceptible, evitando patrones fijos)
      float grainA = fbm((uv + flow) * 90.0 + vec2(u_time * 0.40, -u_time * 0.36));
      float grainB = fbm((uv - flow) * 150.0 - vec2(u_time * 0.48, u_time * 0.32));
      float granular = mix(grainA, grainB, 0.45);
      base += (granular - 0.5) * 0.12;   // intensidad del grano

      // Vignette ligero para suavizar bordes
      float d = distance(uv, vec2(0.5, 0.5));
      float vignette = 1.0 - 0.12 * smoothstep(0.35, 0.85, d);
      base *= vignette;

      gl_FragColor = vec4(base, 1.0);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      console.error('[Shader] Error compilando', info);
      gl.deleteShader(shader);
      throw new Error('Fallo al compilar shader');
    }
    return shader;
  }

  const vsh = compile(gl.VERTEX_SHADER, vertexSrc);
  const fsh = compile(gl.FRAGMENT_SHADER, fragmentSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vsh);
  gl.attachShader(program, fsh);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('[Shader] Error al linkear programa', gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  // Fullscreen quad
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]),
    gl.STATIC_DRAW
  );
  const aPos = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uTime = gl.getUniformLocation(program, 'u_time');

  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = layer.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
  }

  let start = performance.now();
  function frame(now) {
    const t = (now - start) / 1000.0;
    gl.uniform1f(uTime, t);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(frame);
  }

  // Inicializa
  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();
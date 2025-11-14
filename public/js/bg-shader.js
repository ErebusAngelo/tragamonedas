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

  // El fallback se ocultará cuando el shader esté listo

  const vertexSrc = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // Permitir especificar el .frag vía data-attribute en el canvas
  const FRAG_URL = canvas.dataset.frag || 'assets/pantalla2.frag';

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

  let uResolution = null;
  let uTime = null;
  let uPhase = null;
  const PHASE_SPEED = 0.0005; // velocidad de avance de la fase (más lenta y sutil)
  let program = null;

  function startShader(fragmentSource) {
    const vsh = compile(gl.VERTEX_SHADER, vertexSrc);
    const fsh = compile(gl.FRAGMENT_SHADER, fragmentSource);
    program = gl.createProgram();
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

    uResolution = gl.getUniformLocation(program, 'resolution');
    uTime = gl.getUniformLocation(program, 'time');
    uPhase = gl.getUniformLocation(program, 'phase');

    start = performance.now();
    resize();
    requestAnimationFrame(frame);
    // Oculta el fallback cuando el shader está listo
    layer.classList.add('shader-ready');
  }

  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = layer.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (uResolution) {
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    }
  }

  let start = performance.now();
  function frame(now) {
    const t = (now - start) / 1000.0;
    if (uTime) gl.uniform1f(uTime, t);
    if (uPhase) gl.uniform1f(uPhase, t * PHASE_SPEED);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(frame);
  }

  // Inicializa
  resize();
  window.addEventListener('resize', resize);
  fetch(FRAG_URL)
    .then(res => {
      if (!res.ok) throw new Error('No se pudo cargar el .frag: ' + res.status);
      return res.text();
    })
    .then(src => startShader(src))
    .catch(err => {
      console.error('[Shader] Error inicializando shader externo', err);
    });
})();
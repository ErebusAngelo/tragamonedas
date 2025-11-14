precision mediump float;

uniform vec2 resolution;
uniform float time;
uniform float phase; // fase controlable para animar el ruido

// Gradient noise (Perlin-like) para evitar artefactos direccionales
vec2 random2(vec2 p) {
  float x = fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  float y = fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453123);
  return vec2(x, y) * 2.0 - 1.0; // [-1,1]
}

float gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float n00 = dot(random2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
  float n10 = dot(random2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float n01 = dot(random2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float n11 = dot(random2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  float n = mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y);
  return 0.5 + 0.5 * n; // [0,1]
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  // rotación 45° para reducir sesgos en ejes
  mat2 rot = mat2(0.707, -0.707, 0.707, 0.707);
  for (int i = 0; i < 5; i++) {
    v += a * gnoise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

// Ruido tipo value con fase para animación visible
float rand(vec2 st) {
  return fract(sin(dot(floor(st.xy), vec2(12.9898, 78.233))) * 43000.3);
}

float noise(vec2 st, float fase) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = sin(rand(i) * fase);
  float b = sin(rand(i + vec2(1.0, 0.0)) * fase);
  float c = sin(rand(i + vec2(0.0, 1.0)) * fase);
  float d = sin(rand(i + vec2(1.0, 1.0)) * fase);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main(void) {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  // Base teal con gradiente vertical suave
  vec3 c1 = vec3(0.0, 0.67, 0.72) * 0.9;
  vec3 c2 = mix(c1, c1 * 0.2, uv.y);
  vec3 base = mix(c1, c2, smoothstep(0.0, 1.0, uv.y));

  // Ajuste de aspecto
  float aspect = resolution.x / resolution.y;
  vec2 uvAspect = vec2(uv.x * aspect, uv.y);

  // Movimiento suave: rotación lenta y drift pequeño (sin patrones tipo gusanitos)
  float theta = time * 0.03;
  mat2 rot2 = mat2(cos(theta), -sin(theta), sin(theta), cos(theta));
  vec2 drift = vec2(sin(time * 0.017), cos(time * 0.013)) * 0.02;
  vec2 p = rot2 * (uvAspect * 1.35) + drift;

  // Grano general con fBm en dos escalas y animación
  float grainA = fbm(p * 950.0);
  float grainB = fbm(p * 1400.0);
  float grain = mix(grainA, grainB, 0.5) - 0.5; // centrado

  // Micro-grano sutil usando gnoise de alta frecuencia
  float micro = gnoise(p * 2200.0 + vec2(time * 0.04, -time * 0.035)) - 0.5;

  // Overlay de ruido con fase controlable para hacerlo más visible
  float overlay = noise(p * 850.0, phase * 7.0) * 0.12;

  vec3 color = base + vec3(grain * 0.18 + micro * 0.05 + overlay);
  gl_FragColor = vec4(color, 1.0);
}
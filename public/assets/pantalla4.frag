precision mediump float;
 
uniform vec2 resolution;
uniform float time;
 
#define pi 3.14159265359
vec2 rotate2d(vec2 _st, float _angle){
    _st -= 0.5;
    _st = mat2(cos(_angle),-sin(_angle),
               sin(_angle), cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}
vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}
float random (in vec2 _st) {
    return fract(sin(dot(floor(_st.xy),
                         vec2(12.9898,78.233)))*
        43000.3);
}
 
float random (in vec2 _st,in float _time) {
    return fract(sin(dot(floor(_st.xy),
                         vec2(12.9898,78.233)))*
        43000.3+_time);
}
 
float noise (in vec2 st,float fase) {
    vec2 i = floor(st);
    vec2 f = fract(st);
 
    float fase2 = fase;
    // Four corners in 2D of a tile
    float a = sin(random(i)*fase2);
    float b =  sin(random(i + vec2(1.0, 0.0))*fase2);
    float c =  sin(random(i + vec2(0.0, 1.0))*fase2);
    float d =  sin(random(i + vec2(1.0, 1.0))*fase2);
 
    // Smooth Interpolation
 
    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);
 
    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}
 
void main(void) {
     vec2 uv = gl_FragCoord.xy / resolution.xy;
     uv = rotate2d(uv,0.9);
     float t = time;
     vec3 c1 = vec3(240./255.,90./255.,42./255.);
     vec3 c2 = vec3(200./255.,60./255.,22./255.)*.7;
     float n = noise(uv*3.,t*2.);
     n = clamp(n,0.0,1.0);
 
     n = sin(uv.x*5.+pi/2.+0.3+sin(uv.y*20.+t*3.+sin(uv.y*40.-t)*.1)*.1 )*.5+.5;
     n = smoothstep(0.08,.8,n);
     vec3 dib = mix(c2,c1,n);
     gl_FragColor = vec4(dib, 1.0);
}
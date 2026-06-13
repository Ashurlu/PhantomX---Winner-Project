import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/utils";

/**
 * Raw WebGL animated shader background (no extra deps).
 * Used on the Login / landing screen. Falls back to a static gradient when
 * prefers-reduced-motion is set or WebGL is unavailable.
 */
const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;

// hash / noise
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p); vec2 f=fract(p);
  float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
  vec2 u=f*f*(3.-2.*f);
  return mix(a,b,u.x)+ (c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
}
float fbm(vec2 p){
  float v=0., a=0.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv * 3.0;
  float t = u_time * 0.06;
  float n = fbm(p + vec2(t, -t*0.5) + fbm(p*1.5 - t));
  // violet -> cyan palette over near-black
  vec3 violet = vec3(0.545, 0.361, 0.965);
  vec3 cyan   = vec3(0.133, 0.827, 0.933);
  vec3 base   = vec3(0.039, 0.039, 0.059);
  vec3 col = base;
  col += violet * smoothstep(0.35, 0.95, n) * 0.55;
  col += cyan   * smoothstep(0.55, 1.0, fbm(p*0.8 + t)) * 0.30;
  // vignette
  float d = distance(uv, vec2(0.5));
  col *= 1.0 - d*0.9;
  gl_FragColor = vec4(col, 1.0);
}
`;

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

export function AnimatedShaderHero({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (prefersReducedMotion()) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const start = performance.now();
    const loop = () => {
      const time = (performance.now() - start) / 1000;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        background:
          "radial-gradient(circle at 30% 30%, #1a1030, #0A0A0F 70%)",
      }}
    />
  );
}

export default AnimatedShaderHero;

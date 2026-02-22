"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

// ─── Shaders ──────────────────────────────────────────────────────

const baseVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const smokeFragmentShader = `
  uniform float iTime;
  uniform vec3  iResolution;
  uniform vec2  iMouse;
  uniform vec2  iPrevMouse[MAX_TRAIL_LENGTH];
  uniform float iOpacity;
  uniform float iScale;
  uniform vec3  iBaseColor;
  uniform float iBrightness;
  uniform float iEdgeIntensity;
  varying vec2  vUv;

  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453123); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f *= f * (3. - 2. * f);
    return mix(mix(hash(i + vec2(0.,0.)), hash(i + vec2(1.,0.)), f.x),
               mix(hash(i + vec2(0.,1.)), hash(i + vec2(1.,1.)), f.x), f.y);
  }
  float fbm(vec2 p){
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for(int i=0;i<5;i++){
      v += a * noise(p);
      p = m * p * 2.0;
      a *= 0.5;
    }
    return v;
  }
  vec3 tint1(vec3 base){ return mix(base, vec3(1.0), 0.15); }
  vec3 tint2(vec3 base){ return mix(base, vec3(0.8, 0.9, 1.0), 0.25); }

  vec4 blob(vec2 p, vec2 mousePos, float intensity, float activity) {
    vec2 relP = p - mousePos;
    vec2 q = vec2(fbm(relP * iScale + iTime * 0.1), fbm(relP * iScale + vec2(5.2,1.3) + iTime * 0.1));
    vec2 r = vec2(fbm(relP * iScale + q * 1.5 + iTime * 0.15), fbm(relP * iScale + q * 1.5 + vec2(8.3,2.8) + iTime * 0.15));

    float smoke = fbm(relP * iScale + r * 0.8);
    float radius = 0.5 + 0.3 * (1.0 / iScale);
    float distFactor = 1.0 - smoothstep(0.0, radius * activity, length(relP));
    float alpha = pow(smoke, 2.5) * distFactor;

    vec3 c1 = tint1(iBaseColor);
    vec3 c2 = tint2(iBaseColor);
    vec3 color = mix(c1, c2, sin(iTime * 0.5) * 0.5 + 0.5);

    return vec4(color * alpha * intensity, alpha * intensity);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy / iResolution.xy * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
    vec2 mouse = (iMouse * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);

    vec3 colorAcc = vec3(0.0);
    float alphaAcc = 0.0;

    vec4 b = blob(uv, mouse, 1.0, iOpacity);
    colorAcc += b.rgb;
    alphaAcc += b.a;

    for (int i = 0; i < MAX_TRAIL_LENGTH; i++) {
      vec2 pm = (iPrevMouse[i] * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
      float t = 1.0 - float(i) / float(MAX_TRAIL_LENGTH);
      t = pow(t, 2.0);
      if (t > 0.01) {
        vec4 bt = blob(uv, pm, t * 0.8, iOpacity);
        colorAcc += bt.rgb;
        alphaAcc += bt.a;
      }
    }

    colorAcc *= iBrightness;

    vec2 uv01 = gl_FragCoord.xy / iResolution.xy;
    float edgeDist = min(min(uv01.x, 1.0 - uv01.x), min(uv01.y, 1.0 - uv01.y));
    float distFromEdge = clamp(edgeDist * 2.0, 0.0, 1.0);
    float k = clamp(iEdgeIntensity, 0.0, 1.0);
    float edgeMask = mix(1.0 - k, 1.0, distFromEdge);

    float outAlpha = clamp(alphaAcc * iOpacity * edgeMask, 0.0, 1.0);
    gl_FragColor = vec4(colorAcc, outAlpha);
  }
`;

const filmGrainShaderDef = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    iTime: { value: 0 },
    intensity: { value: 0.05 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float iTime;
    uniform float intensity;
    varying vec2 vUv;
    float hash1(float n){ return fract(sin(n)*43758.5453); }
    void main(){
      vec4 color = texture2D(tDiffuse, vUv);
      float n = hash1(vUv.x*1000.0 + vUv.y*2000.0 + iTime) * 2.0 - 1.0;
      color.rgb += n * intensity * color.rgb;
      gl_FragColor = color;
    }
  `,
};

const unpremultiplyShaderDef = {
  uniforms: { tDiffuse: { value: null as THREE.Texture | null } },
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float a = max(c.a, 1e-5);
      vec3 straight = c.rgb / a;
      gl_FragColor = vec4(clamp(straight, 0.0, 1.0), c.a);
    }
  `,
};

// ─── Component ────────────────────────────────────────────────────

interface WarSmokeProps {
  color?: string;
  brightness?: number;
  edgeIntensity?: number;
  trailLength?: number;
  inertia?: number;
  grainIntensity?: number;
  bloomStrength?: number;
  bloomRadius?: number;
  bloomThreshold?: number;
  fadeDelayMs?: number;
  fadeDurationMs?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function WarSmoke({
  color = "#ff8647",
  brightness = 2,
  edgeIntensity = 0,
  trailLength = 50,
  inertia = 0.5,
  grainIntensity = 0.05,
  bloomStrength = 0.1,
  bloomRadius = 1,
  bloomThreshold = 0.025,
  fadeDelayMs = 1000,
  fadeDurationMs = 1500,
  className,
  style,
}: WarSmokeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctn = containerRef.current;
    if (!ctn) return;

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.pointerEvents = "none";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    ctn.appendChild(renderer.domElement);

    // ── Scene ──
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geom = new THREE.PlaneGeometry(2, 2);

    // ── Trail ──
    const maxTrail = Math.max(1, Math.floor(trailLength));
    const trailBuf = Array.from({ length: maxTrail }, () => new THREE.Vector2(0.5, 0.5));
    let head = 0;
    const currentMouse = new THREE.Vector2(0.5, 0.5);
    const velocity = new THREE.Vector2(0, 0);
    let fadeOpacity = 1.0;
    let lastMoveTime = performance.now();

    // ── Material ──
    const baseColor = new THREE.Color(color);
    const material = new THREE.ShaderMaterial({
      defines: { MAX_TRAIL_LENGTH: maxTrail },
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector3(1, 1, 1) },
        iMouse: { value: new THREE.Vector2(0.5, 0.5) },
        iPrevMouse: { value: trailBuf.map((v) => v.clone()) },
        iOpacity: { value: 1.0 },
        iScale: { value: 1.0 },
        iBaseColor: { value: new THREE.Vector3(baseColor.r, baseColor.g, baseColor.b) },
        iBrightness: { value: brightness },
        iEdgeIntensity: { value: edgeIntensity },
      },
      vertexShader: baseVertexShader,
      fragmentShader: smokeFragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geom, material);
    scene.add(mesh);

    // ── Post-processing ──
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      bloomStrength,
      bloomRadius,
      bloomThreshold,
    );
    composer.addPass(bloomPass);

    const grainPass = new ShaderPass({
      ...filmGrainShaderDef,
      uniforms: {
        tDiffuse: { value: null },
        iTime: { value: 0 },
        intensity: { value: grainIntensity },
      },
    });
    composer.addPass(grainPass);

    const unpremPass = new ShaderPass(unpremultiplyShaderDef);
    composer.addPass(unpremPass);

    // ── Resize ──
    function resize() {
      if (!ctn) return;
      const rect = ctn.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 0.75);

      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      composer.setSize(w, h);

      const wpx = Math.max(1, Math.floor(w * dpr));
      const hpx = Math.max(1, Math.floor(h * dpr));
      material.uniforms.iResolution.value.set(wpx, hpx, 1);
      bloomPass.setSize(wpx, hpx);

      const base = 600;
      const current = Math.min(Math.max(1, w), Math.max(1, h));
      material.uniforms.iScale.value = Math.max(0.5, Math.min(2.0, current / base));
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(ctn);
    resize();

    // ── Visibility ──
    let isVisible = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) ensureLoop();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(ctn);

    // ── Mouse (document-level for overlay compatibility) ──
    const handleMouseMove = (e: MouseEvent) => {
      const rect = ctn.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
      const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / Math.max(1, rect.height)));
      currentMouse.set(x, y);
      lastMoveTime = performance.now();
      ensureLoop();
    };
    document.addEventListener("mousemove", handleMouseMove);

    // ── Animation loop ──
    const start = performance.now();
    let rafId = 0;
    let running = false;

    function ensureLoop() {
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(animate);
      }
    }

    function animate() {
      if (!isVisible) {
        running = false;
        return;
      }

      const now = performance.now();
      const t = (now - start) / 1000;
      const dt = now - lastMoveTime;
      const isActive = dt < 100;

      if (isActive) {
        velocity.set(
          currentMouse.x - material.uniforms.iMouse.value.x,
          currentMouse.y - material.uniforms.iMouse.value.y,
        );
        (material.uniforms.iMouse.value as THREE.Vector2).copy(currentMouse);
        fadeOpacity = 1.0;
      } else {
        velocity.multiplyScalar(inertia);
        if (velocity.lengthSq() > 1e-6) {
          (material.uniforms.iMouse.value as THREE.Vector2).add(velocity);
        }
        if (dt > fadeDelayMs) {
          const k = Math.min(1, (dt - fadeDelayMs) / fadeDurationMs);
          fadeOpacity = Math.max(0, 1 - k);
        }
      }

      // Update trail
      head = (head + 1) % maxTrail;
      trailBuf[head].copy(material.uniforms.iMouse.value as THREE.Vector2);
      const arr = material.uniforms.iPrevMouse.value as THREE.Vector2[];
      for (let i = 0; i < maxTrail; i++) {
        const srcIdx = (head - i + maxTrail) % maxTrail;
        arr[i].copy(trailBuf[srcIdx]);
      }

      material.uniforms.iOpacity.value = fadeOpacity;
      material.uniforms.iTime.value = t;
      grainPass.uniforms.iTime.value = t;

      composer.render();

      if (fadeOpacity <= 0.001) {
        running = false;
        return;
      }

      rafId = requestAnimationFrame(animate);
    }

    ensureLoop();

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("mousemove", handleMouseMove);
      scene.clear();
      geom.dispose();
      material.dispose();
      composer.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === ctn) {
        ctn.removeChild(renderer.domElement);
      }
    };
  }, [
    color,
    brightness,
    edgeIntensity,
    trailLength,
    inertia,
    grainIntensity,
    bloomStrength,
    bloomRadius,
    bloomThreshold,
    fadeDelayMs,
    fadeDurationMs,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className ?? ""}`}
      style={style}
    />
  );
}

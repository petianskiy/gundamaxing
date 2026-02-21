/**
 * Brush Asset Generator
 * Generates stamp PNGs (256x256 grayscale alpha masks) and grain texture PNGs (512x512 tileable).
 * Run: npx tsx scripts/generate-brush-assets.ts
 */

import { createCanvas } from "canvas";
import * as fs from "fs";
import * as path from "path";

const STAMP_SIZE = 256;
const GRAIN_SIZE = 512;
const OUT_DIR = path.join(__dirname, "..", "public", "brushes");

// ─── Perlin Noise ─────────────────────────────────────────────────

function createPerlinNoise(width: number, height: number, scale: number, seed = 0): Float32Array {
  const size = width * height;
  const result = new Float32Array(size);

  // Simple value noise with interpolation
  const gridSize = Math.max(2, Math.ceil(scale));
  const grid = new Float32Array(gridSize * gridSize);
  const rng = mulberry32(seed);
  for (let i = 0; i < grid.length; i++) grid[i] = rng();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const gx = (x / width) * (gridSize - 1);
      const gy = (y / height) * (gridSize - 1);
      const ix = Math.floor(gx);
      const iy = Math.floor(gy);
      const fx = gx - ix;
      const fy = gy - iy;

      const sx = smoothstep(fx);
      const sy = smoothstep(fy);

      const i00 = ix + iy * gridSize;
      const i10 = Math.min(ix + 1, gridSize - 1) + iy * gridSize;
      const i01 = ix + Math.min(iy + 1, gridSize - 1) * gridSize;
      const i11 = Math.min(ix + 1, gridSize - 1) + Math.min(iy + 1, gridSize - 1) * gridSize;

      const v = lerp(lerp(grid[i00], grid[i10], sx), lerp(grid[i01], grid[i11], sx), sy);
      result[y * width + x] = v;
    }
  }
  return result;
}

function multiOctaveNoise(
  width: number,
  height: number,
  octaves: number,
  baseScale: number,
  persistence: number,
  seed = 0
): Float32Array {
  const result = new Float32Array(width * height);
  let amplitude = 1;
  let totalAmp = 0;

  for (let o = 0; o < octaves; o++) {
    const scale = baseScale * Math.pow(2, o);
    const noise = createPerlinNoise(width, height, scale, seed + o * 1000);
    for (let i = 0; i < result.length; i++) {
      result[i] += noise[i] * amplitude;
    }
    totalAmp += amplitude;
    amplitude *= persistence;
  }

  for (let i = 0; i < result.length; i++) result[i] /= totalAmp;
  return result;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mulberry32(seed: number) {
  let a = seed | 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

// ─── Stamp Generators ──────────────────────────────────────────────

function generateSoftRound(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const cx = STAMP_SIZE / 2, cy = STAMP_SIZE / 2, r = STAMP_SIZE / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.7, "rgba(255,255,255,0.4)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, STAMP_SIZE, STAMP_SIZE);
  return canvas.toBuffer("image/png");
}

function generateHardRound(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const cx = STAMP_SIZE / 2, cy = STAMP_SIZE / 2, r = STAMP_SIZE / 2 - 2;
  const gradient = ctx.createRadialGradient(cx, cy, r - 2, cx, cy, r);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  return canvas.toBuffer("image/png");
}

function generateCharcoal(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(STAMP_SIZE, STAMP_SIZE);
  const noise = multiOctaveNoise(STAMP_SIZE, STAMP_SIZE, 4, 8, 0.6, 42);
  const cx = STAMP_SIZE / 2, cy = STAMP_SIZE / 2, r = STAMP_SIZE / 2;

  for (let y = 0; y < STAMP_SIZE; y++) {
    for (let x = 0; x < STAMP_SIZE; x++) {
      const d = dist(x, y, cx, cy) / r;
      const mask = clamp(1 - d * 1.1, 0, 1);
      const n = noise[y * STAMP_SIZE + x];
      const v = mask * (0.3 + n * 0.7);
      const alpha = clamp(v * 255, 0, 255);
      const i = (y * STAMP_SIZE + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer("image/png");
}

function generateInkSplat(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const cx = STAMP_SIZE / 2, cy = STAMP_SIZE / 2;
  const rng = mulberry32(123);

  ctx.fillStyle = "white";
  // Main blob
  ctx.beginPath();
  ctx.arc(cx, cy, STAMP_SIZE * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Random overlapping circles
  for (let i = 0; i < 20; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = rng() * STAMP_SIZE * 0.25;
    const r = STAMP_SIZE * (0.05 + rng() * 0.15);
    ctx.globalAlpha = 0.5 + rng() * 0.5;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Small splatter dots
  ctx.globalAlpha = 0.7;
  for (let i = 0; i < 30; i++) {
    const angle = rng() * Math.PI * 2;
    const d = STAMP_SIZE * (0.2 + rng() * 0.25);
    const r = 1 + rng() * 4;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * d, cy + Math.sin(angle) * d, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toBuffer("image/png");
}

function generateWatercolorBlob(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(STAMP_SIZE, STAMP_SIZE);
  const noise1 = multiOctaveNoise(STAMP_SIZE, STAMP_SIZE, 5, 6, 0.5, 77);
  const noise2 = multiOctaveNoise(STAMP_SIZE, STAMP_SIZE, 3, 4, 0.7, 88);
  const cx = STAMP_SIZE / 2, cy = STAMP_SIZE / 2, r = STAMP_SIZE / 2;

  for (let y = 0; y < STAMP_SIZE; y++) {
    for (let x = 0; x < STAMP_SIZE; x++) {
      const d = dist(x, y, cx, cy) / r;
      const n1 = noise1[y * STAMP_SIZE + x];
      const n2 = noise2[y * STAMP_SIZE + x];
      const edgeNoise = n1 * 0.3;
      const threshold = 0.8 + edgeNoise;
      const mask = clamp(1 - d / threshold, 0, 1);
      const concentration = 0.3 + n2 * 0.4;
      const alpha = clamp(mask * concentration * 255, 0, 255);
      const i = (y * STAMP_SIZE + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer("image/png");
}

function generateSprayDots(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const cx = STAMP_SIZE / 2, cy = STAMP_SIZE / 2, r = STAMP_SIZE / 2;
  const rng = mulberry32(456);

  ctx.fillStyle = "white";
  for (let i = 0; i < 200; i++) {
    const angle = rng() * Math.PI * 2;
    const d = Math.sqrt(rng()) * r * 0.9;
    const dotR = 0.5 + rng() * 3;
    ctx.globalAlpha = 0.3 + rng() * 0.7;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * d, cy + Math.sin(angle) * d, dotR, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toBuffer("image/png");
}

function generateBristle(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const rng = mulberry32(789);

  ctx.strokeStyle = "white";
  ctx.lineCap = "round";

  const bristleCount = 6;
  const spacing = STAMP_SIZE / (bristleCount + 1);

  for (let i = 0; i < bristleCount; i++) {
    const baseX = spacing * (i + 1);
    ctx.lineWidth = 2 + rng() * 4;
    ctx.globalAlpha = 0.5 + rng() * 0.5;
    ctx.beginPath();
    ctx.moveTo(baseX + (rng() - 0.5) * 8, 10);
    for (let y = 30; y < STAMP_SIZE - 10; y += 20) {
      ctx.lineTo(baseX + (rng() - 0.5) * 12, y);
    }
    ctx.lineTo(baseX + (rng() - 0.5) * 8, STAMP_SIZE - 10);
    ctx.stroke();
  }

  return canvas.toBuffer("image/png");
}

function generateFlatBrush(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const rng = mulberry32(101);
  const w = STAMP_SIZE * 0.8, h = STAMP_SIZE * 0.5;
  const x = (STAMP_SIZE - w) / 2, y = (STAMP_SIZE - h) / 2;

  ctx.fillStyle = "white";
  ctx.globalAlpha = 0.9;
  const radius = 8;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.fill();

  // Add vertical grain lines
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1;
  for (let lx = x + 5; lx < x + w; lx += 4 + rng() * 6) {
    ctx.globalAlpha = 0.1 + rng() * 0.2;
    ctx.beginPath();
    ctx.moveTo(lx, y + 5);
    ctx.lineTo(lx + (rng() - 0.5) * 3, y + h - 5);
    ctx.stroke();
  }

  return canvas.toBuffer("image/png");
}

function generateFanBrush(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const rng = mulberry32(202);
  const cx = STAMP_SIZE / 2, base = STAMP_SIZE * 0.85;

  ctx.strokeStyle = "white";
  ctx.lineCap = "round";

  for (let i = 0; i < 12; i++) {
    const spread = (i / 11 - 0.5) * STAMP_SIZE * 0.7;
    ctx.lineWidth = 1 + rng() * 2;
    ctx.globalAlpha = 0.4 + rng() * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, base);
    ctx.lineTo(cx + spread, 20 + rng() * 30);
    ctx.stroke();
  }

  return canvas.toBuffer("image/png");
}

function generatePaletteKnife(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(STAMP_SIZE, STAMP_SIZE);
  const noise = multiOctaveNoise(STAMP_SIZE, STAMP_SIZE, 3, 12, 0.5, 303);
  const w = STAMP_SIZE * 0.85, h = STAMP_SIZE * 0.35;
  const ox = (STAMP_SIZE - w) / 2, oy = (STAMP_SIZE - h) / 2;

  for (let y = 0; y < STAMP_SIZE; y++) {
    for (let x = 0; x < STAMP_SIZE; x++) {
      const inRect = x >= ox && x <= ox + w && y >= oy && y <= oy + h;
      if (!inRect) continue;
      const n = noise[y * STAMP_SIZE + x];
      const edgeFade = Math.min(
        (x - ox) / 8, (ox + w - x) / 8,
        (y - oy) / 6, (oy + h - y) / 6
      );
      const alpha = clamp((0.7 + n * 0.3) * Math.min(1, edgeFade) * 255, 0, 255);
      const i = (y * STAMP_SIZE + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer("image/png");
}

function generateSponge(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const cx = STAMP_SIZE / 2, cy = STAMP_SIZE / 2, r = STAMP_SIZE / 2;
  const rng = mulberry32(404);

  // Generate random "cell" centers
  const cells: { x: number; y: number }[] = [];
  for (let i = 0; i < 60; i++) {
    cells.push({ x: rng() * STAMP_SIZE, y: rng() * STAMP_SIZE });
  }

  const img = ctx.createImageData(STAMP_SIZE, STAMP_SIZE);
  for (let y = 0; y < STAMP_SIZE; y++) {
    for (let x = 0; x < STAMP_SIZE; x++) {
      const d = dist(x, y, cx, cy) / r;
      if (d > 1) continue;

      // Find nearest cell center
      let minDist = Infinity;
      for (const cell of cells) {
        const cd = dist(x, y, cell.x, cell.y);
        if (cd < minDist) minDist = cd;
      }

      const cellEdge = clamp(minDist / 20, 0, 1);
      const mask = clamp(1 - d * 1.1, 0, 1);
      const alpha = clamp(cellEdge * mask * 255, 0, 255);
      const i = (y * STAMP_SIZE + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer("image/png");
}

function generateDryBrush(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const rng = mulberry32(505);
  const cx = STAMP_SIZE / 2, cy = STAMP_SIZE / 2, r = STAMP_SIZE / 2;

  const img = ctx.createImageData(STAMP_SIZE, STAMP_SIZE);
  const noise = multiOctaveNoise(STAMP_SIZE, STAMP_SIZE, 3, 16, 0.6, 505);

  for (let y = 0; y < STAMP_SIZE; y++) {
    for (let x = 0; x < STAMP_SIZE; x++) {
      const d = dist(x, y, cx, cy) / r;
      const mask = clamp(1 - d * 1.1, 0, 1);
      const n = noise[y * STAMP_SIZE + x];
      // Horizontal streaks: use sine wave modulated by noise
      const streak = Math.sin(y * 0.4 + n * 3) * 0.5 + 0.5;
      const alpha = clamp(mask * streak * n * 255, 0, 255);
      const i = (y * STAMP_SIZE + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer("image/png");
}

function generateStipple(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const cx = STAMP_SIZE / 2, cy = STAMP_SIZE / 2, r = STAMP_SIZE / 2;
  const rng = mulberry32(606);

  ctx.fillStyle = "white";
  for (let i = 0; i < 400; i++) {
    const angle = rng() * Math.PI * 2;
    const d = Math.sqrt(rng()) * r * 0.95;
    const dotR = 0.5 + rng() * 5;
    ctx.globalAlpha = 0.4 + rng() * 0.6;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * d, cy + Math.sin(angle) * d, dotR, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toBuffer("image/png");
}

function generateChalk(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(STAMP_SIZE, STAMP_SIZE);
  const noise = multiOctaveNoise(STAMP_SIZE, STAMP_SIZE, 3, 6, 0.65, 707);
  const cx = STAMP_SIZE / 2, cy = STAMP_SIZE / 2, r = STAMP_SIZE / 2;

  for (let y = 0; y < STAMP_SIZE; y++) {
    for (let x = 0; x < STAMP_SIZE; x++) {
      const d = dist(x, y, cx, cy) / r;
      const edgeFade = clamp(1 - d, 0, 1);
      const softEdge = smoothstep(edgeFade);
      const n = noise[y * STAMP_SIZE + x];
      const alpha = clamp(softEdge * (0.4 + n * 0.6) * 255, 0, 255);
      const i = (y * STAMP_SIZE + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer("image/png");
}

function generateMarker(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const w = STAMP_SIZE * 0.7, h = STAMP_SIZE * 0.8;
  const ox = (STAMP_SIZE - w) / 2, oy = (STAMP_SIZE - h) / 2;

  ctx.fillStyle = "white";
  ctx.globalAlpha = 0.85;
  const r = Math.min(w, h) * 0.15;
  ctx.beginPath();
  ctx.moveTo(ox + r, oy);
  ctx.lineTo(ox + w - r, oy);
  ctx.quadraticCurveTo(ox + w, oy, ox + w, oy + r);
  ctx.lineTo(ox + w, oy + h - r);
  ctx.quadraticCurveTo(ox + w, oy + h, ox + w - r, oy + h);
  ctx.lineTo(ox + r, oy + h);
  ctx.quadraticCurveTo(ox, oy + h, ox, oy + h - r);
  ctx.lineTo(ox, oy + r);
  ctx.quadraticCurveTo(ox, oy, ox + r, oy);
  ctx.fill();

  return canvas.toBuffer("image/png");
}

function generateCalligraphyNib(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const cx = STAMP_SIZE / 2, cy = STAMP_SIZE / 2;
  const rx = STAMP_SIZE * 0.45, ry = STAMP_SIZE * 0.08;

  ctx.fillStyle = "white";
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 6);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toBuffer("image/png");
}

function generateNoiseCircle(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(STAMP_SIZE, STAMP_SIZE);
  const rng = mulberry32(808);
  const cx = STAMP_SIZE / 2, cy = STAMP_SIZE / 2, r = STAMP_SIZE / 2;

  for (let y = 0; y < STAMP_SIZE; y++) {
    for (let x = 0; x < STAMP_SIZE; x++) {
      const d = dist(x, y, cx, cy) / r;
      if (d > 1) continue;
      const mask = clamp(1 - d, 0, 1);
      const n = rng();
      const alpha = clamp(mask * n * 255, 0, 255);
      const i = (y * STAMP_SIZE + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer("image/png");
}

function generateCloud(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const rng = mulberry32(909);
  const cx = STAMP_SIZE / 2, cy = STAMP_SIZE / 2;

  for (let i = 0; i < 15; i++) {
    const bx = cx + (rng() - 0.5) * STAMP_SIZE * 0.4;
    const by = cy + (rng() - 0.5) * STAMP_SIZE * 0.4;
    const br = STAMP_SIZE * (0.1 + rng() * 0.2);
    const gradient = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    gradient.addColorStop(0, `rgba(255,255,255,${0.3 + rng() * 0.4})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, STAMP_SIZE, STAMP_SIZE);
  }

  return canvas.toBuffer("image/png");
}

function generateGrass(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const rng = mulberry32(111);

  ctx.strokeStyle = "white";
  ctx.lineCap = "round";

  for (let i = 0; i < 25; i++) {
    const baseX = 20 + rng() * (STAMP_SIZE - 40);
    const baseY = STAMP_SIZE - 10;
    const height = 40 + rng() * (STAMP_SIZE - 80);
    ctx.lineWidth = 1 + rng() * 2;
    ctx.globalAlpha = 0.4 + rng() * 0.6;
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    const tipX = baseX + (rng() - 0.5) * 30;
    const cpX = baseX + (rng() - 0.5) * 20;
    ctx.quadraticCurveTo(cpX, baseY - height * 0.6, tipX, baseY - height);
    ctx.stroke();
  }

  return canvas.toBuffer("image/png");
}

function generateStarBurst(): Buffer {
  const canvas = createCanvas(STAMP_SIZE, STAMP_SIZE);
  const ctx = canvas.getContext("2d");
  const cx = STAMP_SIZE / 2, cy = STAMP_SIZE / 2;
  const rng = mulberry32(222);

  ctx.strokeStyle = "white";
  ctx.lineCap = "round";

  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2 + (rng() - 0.5) * 0.15;
    const length = STAMP_SIZE * (0.2 + rng() * 0.25);
    ctx.lineWidth = 1 + rng() * 3;
    ctx.globalAlpha = 0.3 + rng() * 0.7;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
    ctx.stroke();
  }

  return canvas.toBuffer("image/png");
}

// ─── Grain Generators ──────────────────────────────────────────────

function generateGrainPaper(): Buffer {
  const canvas = createCanvas(GRAIN_SIZE, GRAIN_SIZE);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(GRAIN_SIZE, GRAIN_SIZE);
  const noise1 = multiOctaveNoise(GRAIN_SIZE, GRAIN_SIZE, 4, 8, 0.5, 1001);
  const rng = mulberry32(1001);

  for (let i = 0; i < GRAIN_SIZE * GRAIN_SIZE; i++) {
    const base = 180 + noise1[i] * 50;
    const fine = rng() * 30 - 15;
    const v = clamp(base + fine, 0, 255);
    const idx = i * 4;
    img.data[idx] = img.data[idx + 1] = img.data[idx + 2] = 255;
    img.data[idx + 3] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer("image/png");
}

function generateGrainCanvasWeave(): Buffer {
  const canvas = createCanvas(GRAIN_SIZE, GRAIN_SIZE);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(GRAIN_SIZE, GRAIN_SIZE);

  for (let y = 0; y < GRAIN_SIZE; y++) {
    for (let x = 0; x < GRAIN_SIZE; x++) {
      const hLine = Math.sin(y * Math.PI * 0.5) * 0.5 + 0.5;
      const vLine = Math.sin(x * Math.PI * 0.5) * 0.5 + 0.5;
      const weave = Math.max(hLine, vLine);
      const v = clamp(140 + weave * 80, 0, 255);
      const idx = (y * GRAIN_SIZE + x) * 4;
      img.data[idx] = img.data[idx + 1] = img.data[idx + 2] = 255;
      img.data[idx + 3] = v;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer("image/png");
}

function generateGrainWatercolorPaper(): Buffer {
  const canvas = createCanvas(GRAIN_SIZE, GRAIN_SIZE);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(GRAIN_SIZE, GRAIN_SIZE);
  const noise = multiOctaveNoise(GRAIN_SIZE, GRAIN_SIZE, 5, 6, 0.55, 2002);

  for (let i = 0; i < GRAIN_SIZE * GRAIN_SIZE; i++) {
    const v = clamp(100 + noise[i] * 155, 0, 255);
    const idx = i * 4;
    img.data[idx] = img.data[idx + 1] = img.data[idx + 2] = 255;
    img.data[idx + 3] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer("image/png");
}

function generateGrainRough(): Buffer {
  const canvas = createCanvas(GRAIN_SIZE, GRAIN_SIZE);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(GRAIN_SIZE, GRAIN_SIZE);
  const noise = multiOctaveNoise(GRAIN_SIZE, GRAIN_SIZE, 4, 12, 0.7, 3003);

  for (let i = 0; i < GRAIN_SIZE * GRAIN_SIZE; i++) {
    const v = clamp(noise[i] * 255, 0, 255);
    const idx = i * 4;
    img.data[idx] = img.data[idx + 1] = img.data[idx + 2] = 255;
    img.data[idx + 3] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer("image/png");
}

function generateGrainLinen(): Buffer {
  const canvas = createCanvas(GRAIN_SIZE, GRAIN_SIZE);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(GRAIN_SIZE, GRAIN_SIZE);
  const rng = mulberry32(4004);

  for (let y = 0; y < GRAIN_SIZE; y++) {
    for (let x = 0; x < GRAIN_SIZE; x++) {
      const diag = Math.sin((x + y) * 0.8) * 0.5 + 0.5;
      const jitter = rng() * 0.15;
      const v = clamp((diag + jitter) * 200 + 55, 0, 255);
      const idx = (y * GRAIN_SIZE + x) * 4;
      img.data[idx] = img.data[idx + 1] = img.data[idx + 2] = 255;
      img.data[idx + 3] = v;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer("image/png");
}

function generateGrainConcrete(): Buffer {
  const canvas = createCanvas(GRAIN_SIZE, GRAIN_SIZE);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(GRAIN_SIZE, GRAIN_SIZE);
  const noise = multiOctaveNoise(GRAIN_SIZE, GRAIN_SIZE, 6, 8, 0.6, 5005);
  const rng = mulberry32(5005);

  for (let i = 0; i < GRAIN_SIZE * GRAIN_SIZE; i++) {
    const base = noise[i] * 180;
    const speckle = rng() < 0.05 ? rng() * 100 : 0;
    const v = clamp(60 + base + speckle, 0, 255);
    const idx = i * 4;
    img.data[idx] = img.data[idx + 1] = img.data[idx + 2] = 255;
    img.data[idx + 3] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer("image/png");
}

function generateGrainNoise(): Buffer {
  const canvas = createCanvas(GRAIN_SIZE, GRAIN_SIZE);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(GRAIN_SIZE, GRAIN_SIZE);
  const rng = mulberry32(6006);

  for (let i = 0; i < GRAIN_SIZE * GRAIN_SIZE; i++) {
    const v = rng() * 255;
    const idx = i * 4;
    img.data[idx] = img.data[idx + 1] = img.data[idx + 2] = 255;
    img.data[idx + 3] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer("image/png");
}

function generateGrainDots(): Buffer {
  const canvas = createCanvas(GRAIN_SIZE, GRAIN_SIZE);
  const ctx = canvas.getContext("2d");
  const rng = mulberry32(7007);

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(0, 0, GRAIN_SIZE, GRAIN_SIZE);

  ctx.fillStyle = "white";
  const spacing = 12;
  for (let y = 0; y < GRAIN_SIZE; y += spacing) {
    for (let x = 0; x < GRAIN_SIZE; x += spacing) {
      const r = 1.5 + rng() * 2;
      ctx.globalAlpha = 0.4 + rng() * 0.5;
      ctx.beginPath();
      ctx.arc(x + spacing / 2 + (rng() - 0.5) * 2, y + spacing / 2 + (rng() - 0.5) * 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return canvas.toBuffer("image/png");
}

// ─── Main ──────────────────────────────────────────────────────────

const stamps = [
  { id: "soft-round", name: "Soft Round", gen: generateSoftRound },
  { id: "hard-round", name: "Hard Round", gen: generateHardRound },
  { id: "charcoal", name: "Charcoal", gen: generateCharcoal },
  { id: "ink-splat", name: "Ink Splat", gen: generateInkSplat },
  { id: "watercolor-blob", name: "Watercolor Blob", gen: generateWatercolorBlob },
  { id: "spray-dots", name: "Spray Dots", gen: generateSprayDots },
  { id: "bristle", name: "Bristle", gen: generateBristle },
  { id: "flat-brush", name: "Flat Brush", gen: generateFlatBrush },
  { id: "fan-brush", name: "Fan Brush", gen: generateFanBrush },
  { id: "palette-knife", name: "Palette Knife", gen: generatePaletteKnife },
  { id: "sponge", name: "Sponge", gen: generateSponge },
  { id: "dry-brush", name: "Dry Brush", gen: generateDryBrush },
  { id: "stipple", name: "Stipple", gen: generateStipple },
  { id: "chalk", name: "Chalk", gen: generateChalk },
  { id: "marker", name: "Marker", gen: generateMarker },
  { id: "calligraphy-nib", name: "Calligraphy Nib", gen: generateCalligraphyNib },
  { id: "noise-circle", name: "Noise Circle", gen: generateNoiseCircle },
  { id: "cloud", name: "Cloud", gen: generateCloud },
  { id: "grass", name: "Grass", gen: generateGrass },
  { id: "star-burst", name: "Star Burst", gen: generateStarBurst },
];

const grains = [
  { id: "paper", name: "Paper", gen: generateGrainPaper },
  { id: "canvas-weave", name: "Canvas Weave", gen: generateGrainCanvasWeave },
  { id: "watercolor-paper", name: "Watercolor Paper", gen: generateGrainWatercolorPaper },
  { id: "rough", name: "Rough", gen: generateGrainRough },
  { id: "linen", name: "Linen", gen: generateGrainLinen },
  { id: "concrete", name: "Concrete", gen: generateGrainConcrete },
  { id: "noise", name: "Noise", gen: generateGrainNoise },
  { id: "dots", name: "Dots", gen: generateGrainDots },
];

function main() {
  const stampsDir = path.join(OUT_DIR, "stamps");
  const grainsDir = path.join(OUT_DIR, "grains");

  fs.mkdirSync(stampsDir, { recursive: true });
  fs.mkdirSync(grainsDir, { recursive: true });

  console.log("Generating stamps...");
  for (const stamp of stamps) {
    const buf = stamp.gen();
    const outPath = path.join(stampsDir, `${stamp.id}.png`);
    fs.writeFileSync(outPath, buf);
    console.log(`  ✓ ${stamp.name} (${buf.length} bytes)`);
  }

  console.log("\nGenerating grains...");
  for (const grain of grains) {
    const buf = grain.gen();
    const outPath = path.join(grainsDir, `${grain.id}.png`);
    fs.writeFileSync(outPath, buf);
    console.log(`  ✓ ${grain.name} (${buf.length} bytes)`);
  }

  // Write manifest
  const manifest = {
    stamps: stamps.map((s) => ({
      id: s.id,
      name: s.name,
      file: `stamps/${s.id}.png`,
      size: STAMP_SIZE,
    })),
    grains: grains.map((g) => ({
      id: g.id,
      name: g.name,
      file: `grains/${g.id}.png`,
      size: GRAIN_SIZE,
      tileable: true,
    })),
  };

  const manifestPath = path.join(OUT_DIR, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✓ Manifest written to ${manifestPath}`);
  console.log(`\nDone! Generated ${stamps.length} stamps + ${grains.length} grains.`);
}

main();

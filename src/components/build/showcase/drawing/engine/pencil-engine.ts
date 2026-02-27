// ─── Pencil Engine ──────────────────────────────────────────────
// Notability-style graphite pencil renderer for HTML Canvas 2D.
// Pressure-sensitive, procedural grain, adaptive smoothing.
// No image assets — everything is generated at runtime.

import type { StrokePoint, DirtyRect } from "./brush-types";
import { clamp, lerp, mergeDirtyRects } from "./brush-types";

// ─── Settings ───────────────────────────────────────────────────

export interface PencilSettings {
  size: number; // 1-50 base stroke diameter
  color: string; // hex color like "#ffffff"
  opacity: number; // 0-1 base opacity
  pressureGamma: number; // 0.5-3.0, default 1.7 — maps pressure to width curve
  minWidthRatio: number; // 0.05-0.5, default 0.15 — minimum width as fraction of size
  texture: number; // 0-1, default 0.4 — grain intensity
  smoothing: number; // 0-1, default 0.5 — stroke smoothing amount
  tiltShading: boolean; // whether to use tilt for shading
  isEraser: boolean; // if true, use destination-out blend mode
}

export const DEFAULT_PENCIL_SETTINGS: PencilSettings = {
  size: 4,
  color: "#000000",
  opacity: 0.85,
  pressureGamma: 1.7,
  minWidthRatio: 0.15,
  texture: 0.4,
  smoothing: 0.5,
  tiltShading: false,
  isEraser: false,
};

// ─── One Euro Filter ────────────────────────────────────────────
// Low-latency adaptive smoothing. Reduces jitter at low speed while
// keeping latency minimal during fast movement.

const TAU = 1 / (2 * Math.PI);

export class OneEuroFilter {
  private frequency: number;
  private mincutoff: number;
  private beta: number;
  private dcutoff: number;
  private xPrev: number;
  private dxPrev: number;
  private lastTimestamp: number;
  private initialized: boolean;

  constructor(
    frequency: number,
    mincutoff: number = 1.0,
    beta: number = 0.0,
    dcutoff: number = 1.0,
  ) {
    this.frequency = frequency;
    this.mincutoff = mincutoff;
    this.beta = beta;
    this.dcutoff = dcutoff;
    this.xPrev = 0;
    this.dxPrev = 0;
    this.lastTimestamp = -1;
    this.initialized = false;
  }

  private alpha(cutoff: number, te: number): number {
    const tau = TAU / cutoff;
    return 1 / (1 + tau / te);
  }

  filter(value: number, timestamp: number): number {
    if (!this.initialized) {
      this.xPrev = value;
      this.dxPrev = 0;
      this.lastTimestamp = timestamp;
      this.initialized = true;
      return value;
    }

    const te = Math.max(1 / this.frequency, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    // Derivative estimation
    const dx = (value - this.xPrev) / te;
    const alphaD = this.alpha(this.dcutoff, te);
    const dxSmoothed = lerp(this.dxPrev, dx, alphaD);
    this.dxPrev = dxSmoothed;

    // Adaptive cutoff based on derivative magnitude
    const cutoff = this.mincutoff + this.beta * Math.abs(dxSmoothed);
    const alphaV = this.alpha(cutoff, te);
    const result = lerp(this.xPrev, value, alphaV);
    this.xPrev = result;

    return result;
  }

  reset(): void {
    this.initialized = false;
    this.xPrev = 0;
    this.dxPrev = 0;
    this.lastTimestamp = -1;
  }
}

// ─── Helpers ────────────────────────────────────────────────────

export function parseHexToRgb(hex: string): [number, number, number] {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function generateNoiseTexture(width: number, height: number): ImageData {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  return imageData;
}

// ─── PencilStroke ───────────────────────────────────────────────

export class PencilStroke {
  private ctx: CanvasRenderingContext2D;
  private settings: PencilSettings;
  private points: StrokePoint[];
  private filterX: OneEuroFilter;
  private filterY: OneEuroFilter;
  private filterP: OneEuroFilter;
  private lastSmoothed: { x: number; y: number; pressure: number } | null;
  private noisePattern: ImageData | null;
  private strokeLength: number;
  private pointCount: number;
  private rgb: [number, number, number];

  constructor(ctx: CanvasRenderingContext2D, settings: PencilSettings) {
    this.ctx = ctx;
    this.settings = { ...settings };
    this.points = [];
    this.lastSmoothed = null;
    this.noisePattern = null;
    this.strokeLength = 0;
    this.pointCount = 0;
    this.rgb = parseHexToRgb(settings.color);

    // Map smoothing 0-1 to beta 0-10
    const beta = settings.smoothing * 10;
    const freq = 120; // target frame rate
    this.filterX = new OneEuroFilter(freq, 1.0, beta);
    this.filterY = new OneEuroFilter(freq, 1.0, beta);
    this.filterP = new OneEuroFilter(freq, 1.0, beta * 0.5); // less aggressive on pressure
  }

  addPoint(
    x: number,
    y: number,
    pressure: number,
    tiltX?: number,
    tiltY?: number,
  ): DirtyRect | null {
    // Default pressure for mouse/trackpad
    if (pressure <= 0) pressure = 0.5;

    const timestamp = performance.now();
    const point: StrokePoint = { x, y, pressure, tiltX, tiltY, timestamp };
    this.points.push(point);
    this.pointCount++;

    // Smooth through One Euro Filters
    let sx: number;
    let sy: number;
    let sp: number;
    if (this.settings.smoothing < 0.05) {
      sx = x;
      sy = y;
      sp = pressure;
    } else {
      sx = this.filterX.filter(x, timestamp);
      sy = this.filterY.filter(y, timestamp);
      sp = this.filterP.filter(pressure, timestamp);
    }
    sp = clamp(sp, 0, 1);

    const { size, opacity, pressureGamma, minWidthRatio, texture, tiltShading, isEraser } =
      this.settings;
    const [r, g, b] = this.rgb;

    // First point: render a single dot
    if (!this.lastSmoothed) {
      this.lastSmoothed = { x: sx, y: sy, pressure: sp };

      const width = size * (minWidthRatio + (1 - minWidthRatio) * Math.pow(sp, pressureGamma));
      const radius = width * 0.5 * 0.3; // start taper — first dot is small
      const alpha = clamp(opacity * (0.5 + 0.5 * sp), 0, 1);
      const grainAlpha = alpha * (1 - texture * (Math.random() * 0.5));

      const prevComposite = this.ctx.globalCompositeOperation;
      if (isEraser) this.ctx.globalCompositeOperation = "destination-out";

      this.ctx.beginPath();
      this.ctx.arc(sx, sy, Math.max(0.5, radius), 0, Math.PI * 2);
      this.ctx.fillStyle = isEraser
        ? `rgba(0,0,0,${grainAlpha})`
        : `rgba(${r},${g},${b},${grainAlpha})`;
      this.ctx.fill();

      if (isEraser) this.ctx.globalCompositeOperation = prevComposite;

      const pad = size + 2;
      return { x: sx - pad, y: sy - pad, width: pad * 2, height: pad * 2 };
    }

    // Compute segment from last smoothed point to current
    const prev = this.lastSmoothed;
    const dx = sx - prev.x;
    const dy = sy - prev.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Skip near-zero distance to avoid redundant draws
    if (dist < 0.5) return null;

    const dt = 1 / 120; // approximate frame interval
    const speed = dist / Math.max(dt, 0.001);

    // Width at previous and current positions
    const prevWidth =
      size * (minWidthRatio + (1 - minWidthRatio) * Math.pow(prev.pressure, pressureGamma));
    const currWidth =
      size * (minWidthRatio + (1 - minWidthRatio) * Math.pow(sp, pressureGamma));

    // Opacity modulated by pressure and speed
    let baseAlpha = opacity * (0.5 + 0.5 * sp);
    baseAlpha *= clamp(1.0 - speed * 0.001, 0.7, 1.0);

    // Tilt shading modulation
    if (tiltShading && tiltX !== undefined && tiltY !== undefined) {
      const tiltMag = Math.sqrt(tiltX * tiltX + tiltY * tiltY);
      // More tilt = darker (like pressing pencil at angle)
      baseAlpha *= clamp(0.8 + tiltMag * 0.006, 0.8, 1.2);
    }

    baseAlpha = clamp(baseAlpha, 0, 1);

    // Walk along the segment placing dabs
    const maxRadius = Math.max(prevWidth, currWidth) * 0.5;
    const step = Math.max(1, maxRadius * 0.3);
    const steps = Math.ceil(dist / step);

    let dirty: DirtyRect | null = null;
    const prevComposite = this.ctx.globalCompositeOperation;
    if (isEraser) this.ctx.globalCompositeOperation = "destination-out";

    for (let i = 0; i <= steps; i++) {
      const t = steps > 0 ? i / steps : 1;
      const dabX = prev.x + dx * t;
      const dabY = prev.y + dy * t;
      let dabRadius = lerp(prevWidth, currWidth, t) * 0.5;

      // Start taper: first 5 points, scale radius from 30% to 100%
      if (this.pointCount <= 5) {
        const taperT = clamp((this.pointCount - 1 + t) / 5, 0, 1);
        dabRadius *= lerp(0.3, 1.0, taperT);
      }

      dabRadius = Math.max(0.25, dabRadius);

      // Grain jitter on opacity
      const grainAlpha = baseAlpha * (1 - texture * (Math.random() * 0.5));

      this.ctx.beginPath();
      this.ctx.arc(dabX, dabY, dabRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = isEraser
        ? `rgba(0,0,0,${grainAlpha})`
        : `rgba(${r},${g},${b},${grainAlpha})`;
      this.ctx.fill();

      // Accumulate dirty rect
      const pad = dabRadius + 1;
      const dabDirty: DirtyRect = {
        x: dabX - pad,
        y: dabY - pad,
        width: pad * 2,
        height: pad * 2,
      };
      dirty = mergeDirtyRects(dirty, dabDirty);
    }

    if (isEraser) this.ctx.globalCompositeOperation = prevComposite;

    this.strokeLength += dist;
    this.lastSmoothed = { x: sx, y: sy, pressure: sp };

    return dirty;
  }

  end(): void {
    if (this.points.length < 2 || !this.lastSmoothed) return;

    const { size, opacity, pressureGamma, minWidthRatio, texture, isEraser } = this.settings;
    const [r, g, b] = this.rgb;
    const last = this.lastSmoothed;
    const sp = last.pressure;

    // Taper the end by drawing a few diminishing dabs along the final direction
    const prevPoint = this.points[this.points.length - 2];
    const lastPoint = this.points[this.points.length - 1];
    const dx = lastPoint.x - prevPoint.x;
    const dy = lastPoint.y - prevPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.5) return;

    const nx = dx / dist;
    const ny = dy / dist;
    const baseWidth =
      size * (minWidthRatio + (1 - minWidthRatio) * Math.pow(sp, pressureGamma));
    const taperLength = Math.min(baseWidth * 2, 12);
    const taperSteps = Math.ceil(taperLength / 1.5);

    const prevComposite = this.ctx.globalCompositeOperation;
    if (isEraser) this.ctx.globalCompositeOperation = "destination-out";

    for (let i = 1; i <= taperSteps; i++) {
      const t = i / taperSteps;
      const dabX = last.x + nx * taperLength * t;
      const dabY = last.y + ny * taperLength * t;
      const dabRadius = Math.max(0.25, baseWidth * 0.5 * (1 - t));
      const alpha = clamp(opacity * (0.5 + 0.5 * sp) * (1 - t), 0, 1);
      const grainAlpha = alpha * (1 - texture * (Math.random() * 0.5));

      this.ctx.beginPath();
      this.ctx.arc(dabX, dabY, dabRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = isEraser
        ? `rgba(0,0,0,${grainAlpha})`
        : `rgba(${r},${g},${b},${grainAlpha})`;
      this.ctx.fill();
    }

    if (isEraser) this.ctx.globalCompositeOperation = prevComposite;
  }

  getPoints(): StrokePoint[] {
    return this.points;
  }
}

// ─── Replay ─────────────────────────────────────────────────────

export function replayStroke(
  ctx: CanvasRenderingContext2D,
  points: StrokePoint[],
  settings: PencilSettings,
): void {
  if (points.length === 0) return;

  const stroke = new PencilStroke(ctx, settings);
  for (const pt of points) {
    stroke.addPoint(pt.x, pt.y, pt.pressure, pt.tiltX, pt.tiltY);
  }
  stroke.end();
}

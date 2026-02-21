// ─── Brush Engine ────────────────────────────────────────────────
// Orchestrates stamp-based rendering for a single stroke.
// beginStroke() → strokeTo() (×N) → endStroke()

import type {
  BrushPreset,
  StrokePoint,
  DabParams,
  DirtyRect,
} from "./brush-types";
import { lerp, clamp } from "./brush-types";
import {
  Stabilizer,
  createInterpolationState,
  addPointAndGetDabs,
  getStrokeTotalDistance,
  type InterpolationState,
} from "./stroke-interpolator";
import { renderDab } from "./stamp-renderer";

// ─── Seeded random for reproducible jitter ───────────────────────

let rngSeed = 0;
function seededRandom(): number {
  rngSeed = (rngSeed * 16807 + 0) % 2147483647;
  return (rngSeed - 1) / 2147483646;
}

// ─── Stroke State ────────────────────────────────────────────────

export interface StrokeState {
  preset: BrushPreset;
  color: string;
  /** Base brush size in canvas pixels */
  baseSize: number;
  /** Base brush opacity 0-1 */
  baseOpacity: number;
  stabilizer: Stabilizer;
  interpolation: InterpolationState;
  /** Total dabs rendered in this stroke (for taper estimation) */
  dabCount: number;
  /** Accumulated dirty rect for this stroke */
  dirtyRect: DirtyRect | null;
  /** Raw points collected (for undo command) */
  rawPoints: StrokePoint[];
  /** Estimated total stroke length for taper (updated during stroke) */
  estimatedLength: number;
  /** Previous point velocity for dynamics */
  lastVelocity: number;
}

// ─── Public API ──────────────────────────────────────────────────

export function beginStroke(
  preset: BrushPreset,
  color: string,
  size: number,
  opacity: number,
  point: StrokePoint,
  ctx: CanvasRenderingContext2D
): StrokeState {
  rngSeed = Math.floor(point.timestamp) % 2147483647 || 1;

  const stabilizer = new Stabilizer(preset.stabilization);
  const smoothed = stabilizer.push(point);
  const interpolation = createInterpolationState();

  const state: StrokeState = {
    preset,
    color,
    baseSize: size,
    baseOpacity: opacity,
    stabilizer,
    interpolation,
    dabCount: 0,
    dirtyRect: null,
    rawPoints: [point],
    estimatedLength: 0,
    lastVelocity: 0,
  };

  // Calculate spacing in pixels
  const spacingPx = Math.max(1, (preset.spacing / 100) * size);

  // Generate initial dabs
  const dabs = addPointAndGetDabs(interpolation, smoothed, spacingPx, size);

  // Apply dynamics and render
  for (const dab of dabs) {
    const processed = applyDynamics(state, dab, point);
    renderDab(ctx, processed, color, preset);
    expandDirtyRect(state, processed);
    state.dabCount++;
  }

  return state;
}

export function strokeTo(
  state: StrokeState,
  point: StrokePoint,
  ctx: CanvasRenderingContext2D
): DirtyRect | null {
  state.rawPoints.push(point);

  // Calculate velocity from last point
  const lastPt = state.rawPoints[state.rawPoints.length - 2];
  if (lastPt) {
    const dt = Math.max(1, point.timestamp - lastPt.timestamp);
    const dx = point.x - lastPt.x;
    const dy = point.y - lastPt.y;
    state.lastVelocity = Math.sqrt(dx * dx + dy * dy) / dt;
  }

  const smoothed = state.stabilizer.push(point);
  const spacingPx = Math.max(1, (state.preset.spacing / 100) * state.baseSize);

  // Reset dirty rect for this segment
  const prevDirty = state.dirtyRect;
  state.dirtyRect = null;

  const dabs = addPointAndGetDabs(
    state.interpolation,
    smoothed,
    spacingPx,
    state.baseSize
  );

  for (const dab of dabs) {
    const processed = applyDynamics(state, dab, point);
    renderDab(ctx, processed, state.color, state.preset);
    expandDirtyRect(state, processed);
    state.dabCount++;
  }

  state.estimatedLength = getStrokeTotalDistance(state.interpolation);

  // Return the dirty rect for this segment (for compositor)
  const result = state.dirtyRect;
  state.dirtyRect = prevDirty
    ? mergeDirtyRects(prevDirty, result)
    : result;
  return result;
}

export function endStroke(state: StrokeState): {
  dirtyRect: DirtyRect | null;
  totalDistance: number;
  dabCount: number;
} {
  state.stabilizer.reset();
  return {
    dirtyRect: state.dirtyRect,
    totalDistance: getStrokeTotalDistance(state.interpolation),
    dabCount: state.dabCount,
  };
}

// ─── Dynamics Processing ─────────────────────────────────────────

function applyDynamics(
  state: StrokeState,
  dab: DabParams,
  point: StrokePoint
): DabParams {
  const { preset, baseSize, baseOpacity, lastVelocity } = state;
  const pressure = clamp(point.pressure, 0, 1);

  // Velocity factor (normalized: 0 at rest, 1 at ~1000px/s)
  const velocityFactor = clamp(lastVelocity / 1000, 0, 1);

  // ─── Size dynamics ───────────────────
  let sizeMul = lerp(
    preset.sizeDynamics.pressureMin,
    preset.sizeDynamics.pressureMax,
    pressure
  );
  if (preset.sizeDynamics.velocityInfluence > 0) {
    sizeMul *= lerp(
      1,
      1 - velocityFactor,
      preset.sizeDynamics.velocityInfluence
    );
  }

  // ─── Opacity dynamics ────────────────
  let opacityMul = lerp(
    preset.opacityDynamics.pressureMin,
    preset.opacityDynamics.pressureMax,
    pressure
  );
  if (preset.opacityDynamics.velocityInfluence > 0) {
    opacityMul *= lerp(
      1,
      1 - velocityFactor,
      preset.opacityDynamics.velocityInfluence
    );
  }

  // ─── Flow dynamics ───────────────────
  let flowMul = lerp(
    preset.flowDynamics.pressureMin,
    preset.flowDynamics.pressureMax,
    pressure
  );

  // ─── Angle dynamics ──────────────────
  let angleMul = lerp(
    preset.angleDynamics.pressureMin,
    preset.angleDynamics.pressureMax,
    pressure
  );

  // ─── Taper ───────────────────────────
  // Estimate stroke position for taper
  const totalDist = state.estimatedLength || 1;
  const currentDist = getStrokeTotalDistance(state.interpolation);
  const strokePos = clamp(currentDist / Math.max(totalDist, 1), 0, 1);

  let taperFactor = 1;
  if (preset.taperStart > 0 && strokePos < preset.taperStart) {
    const t = strokePos / preset.taperStart;
    taperFactor = lerp(preset.taperSizeMin, 1, t);
    opacityMul *= t;
  }
  if (preset.taperEnd > 0 && strokePos > 1 - preset.taperEnd) {
    const t = (1 - strokePos) / preset.taperEnd;
    taperFactor = lerp(preset.taperSizeMin, 1, t);
    opacityMul *= t;
  }

  // ─── Scatter/Jitter ──────────────────
  let jitterX = 0;
  let jitterY = 0;
  if (preset.scatter > 0) {
    const scatterAmt = (preset.scatter / 100) * baseSize * sizeMul;
    jitterX = (seededRandom() - 0.5) * scatterAmt;
    jitterY = (seededRandom() - 0.5) * scatterAmt;
  }

  let sizeJitter = 1;
  if (preset.jitterSize > 0) {
    sizeJitter = 1 + (seededRandom() - 0.5) * (preset.jitterSize / 50);
  }

  let opacityJitter = 1;
  if (preset.jitterOpacity > 0) {
    opacityJitter = 1 + (seededRandom() - 0.5) * (preset.jitterOpacity / 50);
  }

  let rotationJitter = 0;
  if (preset.jitterRotation > 0) {
    rotationJitter = (seededRandom() - 0.5) * preset.jitterRotation;
  }

  // ─── Final values ────────────────────
  return {
    x: dab.x + jitterX,
    y: dab.y + jitterY,
    size: clamp(baseSize * sizeMul * taperFactor * sizeJitter, 0.5, 2000),
    opacity: clamp(baseOpacity * opacityMul * opacityJitter, 0, 1),
    flow: clamp(flowMul, 0, 1),
    rotation: angleMul + rotationJitter,
    strokePosition: strokePos,
  };
}

// ─── Dirty Rect Helpers ──────────────────────────────────────────

function expandDirtyRect(state: StrokeState, dab: DabParams): void {
  const halfSize = dab.size / 2 + 2; // +2 for anti-aliasing margin
  const minX = dab.x - halfSize;
  const minY = dab.y - halfSize;
  const maxX = dab.x + halfSize;
  const maxY = dab.y + halfSize;

  if (!state.dirtyRect) {
    state.dirtyRect = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  } else {
    const r = state.dirtyRect;
    const newMinX = Math.min(r.x, minX);
    const newMinY = Math.min(r.y, minY);
    const newMaxX = Math.max(r.x + r.width, maxX);
    const newMaxY = Math.max(r.y + r.height, maxY);
    state.dirtyRect = {
      x: newMinX,
      y: newMinY,
      width: newMaxX - newMinX,
      height: newMaxY - newMinY,
    };
  }
}

function mergeDirtyRects(
  a: DirtyRect,
  b: DirtyRect | null
): DirtyRect {
  if (!b) return a;
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxX = Math.max(a.x + a.width, b.x + b.width);
  const maxY = Math.max(a.y + a.height, b.y + b.height);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

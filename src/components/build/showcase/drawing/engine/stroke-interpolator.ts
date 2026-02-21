// ─── Stroke Interpolator ─────────────────────────────────────────
// Catmull-Rom spline interpolation + stabilization for smooth strokes.
// Produces evenly-spaced dab positions along the stroke path.

import type { StrokePoint, DabParams } from "./brush-types";
import { lerp, clamp } from "./brush-types";

// ─── Stabilization (moving average) ──────────────────────────────

export class Stabilizer {
  private buffer: StrokePoint[] = [];
  private windowSize: number;

  constructor(stabilization: number) {
    // Map 0-100 to window size 1-20
    this.windowSize = Math.max(1, Math.round((stabilization / 100) * 19) + 1);
  }

  push(point: StrokePoint): StrokePoint {
    this.buffer.push(point);
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }

    if (this.buffer.length === 1) return point;

    // Weighted moving average (more recent = more weight)
    let totalWeight = 0;
    let avgX = 0;
    let avgY = 0;
    let avgPressure = 0;

    for (let i = 0; i < this.buffer.length; i++) {
      const weight = i + 1; // Linear weight: oldest=1, newest=length
      avgX += this.buffer[i].x * weight;
      avgY += this.buffer[i].y * weight;
      avgPressure += this.buffer[i].pressure * weight;
      totalWeight += weight;
    }

    return {
      x: avgX / totalWeight,
      y: avgY / totalWeight,
      pressure: avgPressure / totalWeight,
      tilt: point.tilt,
      timestamp: point.timestamp,
    };
  }

  reset(): void {
    this.buffer = [];
  }
}

// ─── Catmull-Rom Interpolation ───────────────────────────────────

function catmullRom(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

function interpolatePoint(
  p0: StrokePoint,
  p1: StrokePoint,
  p2: StrokePoint,
  p3: StrokePoint,
  t: number
): StrokePoint {
  return {
    x: catmullRom(p0.x, p1.x, p2.x, p3.x, t),
    y: catmullRom(p0.y, p1.y, p2.y, p3.y, t),
    pressure: lerp(p1.pressure, p2.pressure, t),
    tilt: p1.tilt,
    timestamp: lerp(p1.timestamp, p2.timestamp, t),
  };
}

// ─── Spacing-based dab generation ────────────────────────────────

export interface InterpolationState {
  /** Raw stabilized points collected so far */
  points: StrokePoint[];
  /** Distance remaining from last dab to fill before next dab */
  distanceRemainder: number;
  /** Total distance traveled along stroke */
  totalDistance: number;
}

export function createInterpolationState(): InterpolationState {
  return {
    points: [],
    distanceRemainder: 0,
    totalDistance: 0,
  };
}

/**
 * Add a new point to the stroke and generate dabs at the configured spacing.
 * @param state - Mutable interpolation state
 * @param point - New stabilized stroke point
 * @param spacingPx - Spacing in pixels between dabs
 * @param brushSize - Current brush diameter in pixels (for dynamic spacing)
 * @returns Array of dab positions to render
 */
export function addPointAndGetDabs(
  state: InterpolationState,
  point: StrokePoint,
  spacingPx: number,
  brushSize: number
): DabParams[] {
  state.points.push(point);
  const pts = state.points;

  if (pts.length < 2) {
    // First point — emit a single dab at the start position
    return [
      {
        x: point.x,
        y: point.y,
        size: brushSize,
        opacity: 1,
        flow: 1,
        rotation: 0,
        strokePosition: 0,
      },
    ];
  }

  const dabs: DabParams[] = [];
  const n = pts.length;

  // Use Catmull-Rom between pts[n-2] and pts[n-1]
  // Control points: p0=n-3, p1=n-2, p2=n-1, p3=n (extrapolated)
  const p1 = pts[n - 2];
  const p2 = pts[n - 1];
  const p0 = n >= 3 ? pts[n - 3] : p1;
  const p3 = p2; // Extrapolate to p2 for the end segment

  // Estimate segment length for step count
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const segmentLength = Math.sqrt(dx * dx + dy * dy);

  if (segmentLength < 0.01) return dabs;

  // Walk along the segment generating dabs at spacing intervals
  const effectiveSpacing = Math.max(1, spacingPx);
  const steps = Math.max(1, Math.ceil(segmentLength / 0.5)); // Sub-pixel resolution
  const stepT = 1 / steps;

  let dist = state.distanceRemainder;

  for (let i = 1; i <= steps; i++) {
    const t = i * stepT;
    const interpPt = interpolatePoint(p0, p1, p2, p3, t);

    // Calculate distance from previous sample
    const prevT = (i - 1) * stepT;
    const prevPt = i === 1 ? p1 : interpolatePoint(p0, p1, p2, p3, prevT);
    const ddx = interpPt.x - prevPt.x;
    const ddy = interpPt.y - prevPt.y;
    const stepDist = Math.sqrt(ddx * ddx + ddy * ddy);

    dist += stepDist;
    state.totalDistance += stepDist;

    while (dist >= effectiveSpacing) {
      dist -= effectiveSpacing;

      // Calculate approximate stroke position (0-1 is not known yet, will be set later)
      dabs.push({
        x: interpPt.x,
        y: interpPt.y,
        size: brushSize,
        opacity: 1,
        flow: 1,
        rotation: 0,
        strokePosition: 0, // Set by brush engine based on total distance
      });
    }
  }

  state.distanceRemainder = dist;
  return dabs;
}

/**
 * Estimate total stroke length for taper calculations.
 * Called at end-of-stroke to normalize strokePosition values.
 */
export function getStrokeTotalDistance(state: InterpolationState): number {
  return state.totalDistance;
}

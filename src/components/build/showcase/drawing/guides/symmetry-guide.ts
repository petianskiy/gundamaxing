export type SymmetryMode = "off" | "vertical" | "horizontal" | "quadrant" | "radial";

export interface SymmetryState {
  mode: SymmetryMode;
  /** Number of radial segments (used when mode === "radial") */
  radialCount: number;
  /** Center point of symmetry axes (default: canvas center) */
  center: { x: number; y: number };
}

export function createSymmetryState(canvasWidth: number, canvasHeight: number): SymmetryState {
  return {
    mode: "off",
    radialCount: 8,
    center: {
      x: canvasWidth / 2,
      y: canvasHeight / 2,
    },
  };
}

/**
 * Given a dab position (x, y), returns an array of all mirrored positions.
 * The original position is always included as the first element.
 * For "off" mode, returns just the original position.
 */
export function getMirroredPositions(
  state: SymmetryState,
  x: number,
  y: number
): { x: number; y: number }[] {
  const { mode, center, radialCount } = state;
  const positions: { x: number; y: number }[] = [{ x, y }];

  if (mode === "off") {
    return positions;
  }

  if (mode === "vertical") {
    const mirroredX = center.x * 2 - x;
    positions.push({ x: mirroredX, y });
  } else if (mode === "horizontal") {
    const mirroredY = center.y * 2 - y;
    positions.push({ x, y: mirroredY });
  } else if (mode === "quadrant") {
    // Combine vertical and horizontal mirroring
    const mirroredX = center.x * 2 - x;
    const mirroredY = center.y * 2 - y;
    positions.push(
      { x: mirroredX, y },           // vertical mirror
      { x, y: mirroredY },           // horizontal mirror
      { x: mirroredX, y: mirroredY } // both mirrors
    );
  } else if (mode === "radial") {
    // Calculate angle from center to point
    const dx = x - center.x;
    const dy = y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const baseAngle = Math.atan2(dy, dx);

    // Add rotated positions at equal intervals
    const angleStep = (Math.PI * 2) / radialCount;
    for (let i = 1; i < radialCount; i++) {
      const angle = baseAngle + angleStep * i;
      const mirroredX = center.x + distance * Math.cos(angle);
      const mirroredY = center.y + distance * Math.sin(angle);
      positions.push({ x: mirroredX, y: mirroredY });
    }
  }

  return positions;
}

/**
 * Render the symmetry guide lines onto a canvas context.
 * These are non-printing visual guides (drawn on the display canvas overlay).
 */
export function renderSymmetryGuide(
  state: SymmetryState,
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
): void {
  const { mode, center, radialCount } = state;

  if (mode === "off") {
    return;
  }

  ctx.save();
  ctx.strokeStyle = "#4488ff";
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);

  if (mode === "vertical" || mode === "quadrant") {
    // Draw vertical center line
    ctx.beginPath();
    ctx.moveTo(center.x, 0);
    ctx.lineTo(center.x, canvasHeight);
    ctx.stroke();
  }

  if (mode === "horizontal" || mode === "quadrant") {
    // Draw horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, center.y);
    ctx.lineTo(canvasWidth, center.y);
    ctx.stroke();
  }

  if (mode === "radial") {
    // Draw N lines from center at equal angles
    const angleStep = (Math.PI * 2) / radialCount;
    const maxDist = Math.max(
      Math.sqrt(center.x * center.x + center.y * center.y),
      Math.sqrt((canvasWidth - center.x) ** 2 + center.y ** 2),
      Math.sqrt(center.x ** 2 + (canvasHeight - center.y) ** 2),
      Math.sqrt((canvasWidth - center.x) ** 2 + (canvasHeight - center.y) ** 2)
    );

    for (let i = 0; i < radialCount; i++) {
      const angle = angleStep * i;
      const endX = center.x + maxDist * Math.cos(angle);
      const endY = center.y + maxDist * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }

  ctx.restore();
}

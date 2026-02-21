export type GuideType = "none" | "grid" | "isometric" | "perspective";

export interface DrawingGuideState {
  type: GuideType;
  /** Grid spacing in pixels */
  gridSpacing: number;
  /** Opacity of guide lines 0-1 */
  opacity: number;
  /** Color of guide lines */
  color: string;
}

export function createDrawingGuideState(): DrawingGuideState {
  return {
    type: "none",
    gridSpacing: 32,
    opacity: 0.3,
    color: "#888888",
  };
}

/**
 * Render the drawing guide onto a canvas context.
 */
export function renderDrawingGuide(
  state: DrawingGuideState,
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
): void {
  const { type, gridSpacing, opacity, color } = state;

  if (type === "none") {
    return;
  }

  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = opacity;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);

  if (type === "grid") {
    // Draw vertical lines
    for (let x = 0; x <= canvasWidth; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= canvasHeight; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
  } else if (type === "isometric") {
    // Isometric grid with 30° and 150° angles
    const spacing = gridSpacing;
    const angle30 = Math.PI / 6; // 30 degrees
    const angle150 = (5 * Math.PI) / 6; // 150 degrees

    // Draw lines at 30° angle (going up-right)
    const dx30 = Math.cos(angle30) * spacing;
    const dy30 = -Math.sin(angle30) * spacing;

    for (let offset = -canvasHeight; offset < canvasWidth + canvasHeight; offset += spacing) {
      ctx.beginPath();
      const startX = offset;
      const startY = 0;
      const endX = startX + (canvasHeight / Math.tan(angle30));
      const endY = canvasHeight;
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Draw lines at 150° angle (going up-left)
    for (let offset = -canvasHeight; offset < canvasWidth + canvasHeight; offset += spacing) {
      ctx.beginPath();
      const startX = offset;
      const startY = 0;
      const endX = startX - (canvasHeight / Math.tan(Math.PI - angle150));
      const endY = canvasHeight;
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= canvasHeight; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
  } else if (type === "perspective") {
    // 2-point perspective with vanishing points at left/right edges
    const horizonY = canvasHeight / 2;
    const leftVP = { x: 0, y: horizonY };
    const rightVP = { x: canvasWidth, y: horizonY };

    // Draw horizon line
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(canvasWidth, horizonY);
    ctx.stroke();
    ctx.restore();

    // Draw lines converging to left vanishing point
    const numLines = 8;
    for (let i = 0; i <= numLines; i++) {
      const t = i / numLines;

      // Lines from top edge
      const topX = canvasWidth * t;
      ctx.beginPath();
      ctx.moveTo(topX, 0);
      ctx.lineTo(leftVP.x, leftVP.y);
      ctx.stroke();

      // Lines from bottom edge
      const bottomX = canvasWidth * t;
      ctx.beginPath();
      ctx.moveTo(bottomX, canvasHeight);
      ctx.lineTo(leftVP.x, leftVP.y);
      ctx.stroke();

      // Lines from right edge
      const rightY = canvasHeight * t;
      ctx.beginPath();
      ctx.moveTo(canvasWidth, rightY);
      ctx.lineTo(leftVP.x, leftVP.y);
      ctx.stroke();
    }

    // Draw lines converging to right vanishing point
    for (let i = 0; i <= numLines; i++) {
      const t = i / numLines;

      // Lines from top edge
      const topX = canvasWidth * t;
      ctx.beginPath();
      ctx.moveTo(topX, 0);
      ctx.lineTo(rightVP.x, rightVP.y);
      ctx.stroke();

      // Lines from bottom edge
      const bottomX = canvasWidth * t;
      ctx.beginPath();
      ctx.moveTo(bottomX, canvasHeight);
      ctx.lineTo(rightVP.x, rightVP.y);
      ctx.stroke();

      // Lines from left edge
      const leftY = canvasHeight * t;
      ctx.beginPath();
      ctx.moveTo(0, leftY);
      ctx.lineTo(rightVP.x, rightVP.y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

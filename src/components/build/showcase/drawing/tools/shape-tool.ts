import type { ShapeState } from "./tool-types";

/**
 * Sets start point for shape drawing
 */
export function beginShape(state: ShapeState, x: number, y: number): void {
  state.start = { x, y };
  state.end = { x, y };
  state.active = true;
}

/**
 * Updates end point for shape drawing
 */
export function updateShape(state: ShapeState, x: number, y: number): void {
  state.end = { x, y };
}

/**
 * Renders the shape preview (while dragging)
 */
export function renderShapePreview(
  state: ShapeState,
  ctx: CanvasRenderingContext2D,
  color: string
): void {
  if (!state.start || !state.end) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = state.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = state.opacity;

  drawShape(state, ctx, state.start.x, state.start.y, state.end.x, state.end.y);

  ctx.restore();
}

/**
 * Renders the final shape to the layer canvas
 */
export function commitShape(
  state: ShapeState,
  ctx: CanvasRenderingContext2D,
  color: string,
  size: number
): void {
  if (!state.start || !state.end) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = state.opacity;

  drawShape(state, ctx, state.start.x, state.start.y, state.end.x, state.end.y);

  ctx.restore();
}

/**
 * Resets shape state
 */
export function endShape(state: ShapeState): void {
  state.start = null;
  state.end = null;
  state.active = false;
}

// ─── Internal ────────────────────────────────────────────────────

function drawShape(
  state: ShapeState,
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  switch (state.type) {
    case "line":
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      break;

    case "rect": {
      const w = x2 - x1;
      const h = y2 - y1;
      if (state.filled) {
        ctx.fillRect(x1, y1, w, h);
      } else {
        ctx.strokeRect(x1, y1, w, h);
      }
      break;
    }

    case "ellipse": {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const rx = Math.abs(x2 - x1) / 2;
      const ry = Math.abs(y2 - y1) / 2;
      if (rx <= 0 || ry <= 0) break;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      if (state.filled) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
      break;
    }

    case "polygon": {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const r = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 2;
      const sides = state.sideCount;
      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const a = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const px = cx + r * Math.cos(a);
        const py = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (state.filled) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
      break;
    }

    case "triangle": {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const halfW = Math.abs(x2 - x1) / 2;
      const halfH = Math.abs(y2 - y1) / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - halfH);
      ctx.lineTo(cx + halfW, cy + halfH);
      ctx.lineTo(cx - halfW, cy + halfH);
      ctx.closePath();
      if (state.filled) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
      break;
    }

    case "star": {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const outerR = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 2;
      const innerR = outerR * state.starInnerRatio;
      const points = state.starPointCount;
      ctx.beginPath();
      for (let i = 0; i <= points * 2; i++) {
        const a = (i * Math.PI) / points - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        const px = cx + r * Math.cos(a);
        const py = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (state.filled) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
      break;
    }
  }
}

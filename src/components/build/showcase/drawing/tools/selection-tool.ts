import type { SelectionState, SelectionMode } from "./tool-types";

/**
 * Begin a selection at the given point.
 */
export function beginSelection(
  state: SelectionState,
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  state.active = true;
  state.points = [{ x, y }];

  // Clear any existing selection
  state.mask = null;
  state.bounds = null;
}

/**
 * Continue a selection (drag/freehand).
 */
export function updateSelection(
  state: SelectionState,
  x: number,
  y: number
): void {
  if (!state.active) return;

  if (state.mode === "freehand") {
    // Add point to freehand path
    state.points.push({ x, y });
  } else {
    // For rect/ellipse, update the end point
    if (state.points.length === 1) {
      state.points.push({ x, y });
    } else {
      state.points[1] = { x, y };
    }
  }
}

/**
 * Finalize the selection, creating the mask canvas.
 */
export function endSelection(
  state: SelectionState,
  canvasWidth: number,
  canvasHeight: number
): void {
  if (!state.active || state.points.length === 0) {
    state.active = false;
    return;
  }

  state.active = false;

  // Create mask canvas
  const mask = document.createElement("canvas");
  mask.width = canvasWidth;
  mask.height = canvasHeight;
  const ctx = mask.getContext("2d");

  if (!ctx) return;

  // Clear mask to transparent
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Draw selection based on mode
  ctx.fillStyle = "white";
  ctx.beginPath();

  if (state.mode === "rect") {
    if (state.points.length < 2) return;

    const start = state.points[0];
    const end = state.points[1];
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    ctx.rect(x, y, width, height);
    state.bounds = { x, y, width, height };

  } else if (state.mode === "ellipse") {
    if (state.points.length < 2) return;

    const start = state.points[0];
    const end = state.points[1];
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;

    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    state.bounds = { x, y, width, height };

  } else if (state.mode === "freehand") {
    if (state.points.length < 3) return;

    // Draw freehand path
    ctx.moveTo(state.points[0].x, state.points[0].y);
    for (let i = 1; i < state.points.length; i++) {
      ctx.lineTo(state.points[i].x, state.points[i].y);
    }
    ctx.closePath();

    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const point of state.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
    state.bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  ctx.fill();
  state.mask = mask;

  // Apply feathering if set
  if (state.feather > 0) {
    applyFeather(state, state.feather);
  }
}

/**
 * Clear/deselect.
 */
export function clearSelection(state: SelectionState): void {
  state.mask = null;
  state.bounds = null;
  state.active = false;
  state.points = [];
}

/**
 * Render marching ants border for the current selection onto a context.
 */
export function renderSelectionBorder(
  state: SelectionState,
  ctx: CanvasRenderingContext2D,
  offset: number
): void {
  if (!state.bounds) return;

  const { x, y, width, height } = state.bounds;

  ctx.save();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.lineDashOffset = -offset;
  ctx.strokeRect(x, y, width, height);

  // Draw white dashed line on top for contrast
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineDashOffset = -offset + 4;
  ctx.strokeRect(x, y, width, height);

  ctx.restore();
}

/**
 * Apply feathering to the selection mask using a box blur.
 */
export function applyFeather(state: SelectionState, amount: number): void {
  if (!state.mask || amount <= 0) return;

  const mask = state.mask;
  const ctx = mask.getContext("2d");
  if (!ctx) return;

  // Get image data
  const imageData = ctx.getImageData(0, 0, mask.width, mask.height);
  const data = imageData.data;

  // Apply horizontal box blur
  const tempData = new Uint8ClampedArray(data);
  const radius = Math.floor(amount);

  // Horizontal pass
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      let sum = 0;
      let count = 0;

      for (let kx = -radius; kx <= radius; kx++) {
        const px = x + kx;
        if (px >= 0 && px < mask.width) {
          const idx = (y * mask.width + px) * 4;
          sum += data[idx]; // Use red channel as alpha
          count++;
        }
      }

      const idx = (y * mask.width + x) * 4;
      const avg = sum / count;
      tempData[idx] = avg;
      tempData[idx + 1] = avg;
      tempData[idx + 2] = avg;
      tempData[idx + 3] = 255;
    }
  }

  // Vertical pass
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      let sum = 0;
      let count = 0;

      for (let ky = -radius; ky <= radius; ky++) {
        const py = y + ky;
        if (py >= 0 && py < mask.height) {
          const idx = (py * mask.width + x) * 4;
          sum += tempData[idx];
          count++;
        }
      }

      const idx = (y * mask.width + x) * 4;
      const avg = sum / count;
      data[idx] = avg;
      data[idx + 1] = avg;
      data[idx + 2] = avg;
      data[idx + 3] = 255;
    }
  }

  // Put blurred data back
  ctx.putImageData(imageData, 0, 0);
  state.feather = amount;
}

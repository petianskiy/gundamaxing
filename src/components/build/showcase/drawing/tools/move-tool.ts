import type { TransformState } from './tool-types';

/**
 * Cuts selected pixels from layer into state.canvas, clears the source area on the layer
 */
export function beginTransform(
  state: TransformState,
  layerCanvas: HTMLCanvasElement,
  selectionBounds: { x: number; y: number; width: number; height: number }
): void {
  const layerCtx = layerCanvas.getContext('2d');
  if (!layerCtx) return;

  // Store original bounds
  state.originalBounds = { ...selectionBounds };
  state.currentBounds = { ...selectionBounds };

  // Create temp canvas to hold selected pixels
  state.canvas = document.createElement('canvas');
  state.canvas.width = selectionBounds.width;
  state.canvas.height = selectionBounds.height;

  const tempCtx = state.canvas.getContext('2d');
  if (!tempCtx) return;

  // Copy selected pixels to temp canvas
  tempCtx.drawImage(
    layerCanvas,
    selectionBounds.x,
    selectionBounds.y,
    selectionBounds.width,
    selectionBounds.height,
    0,
    0,
    selectionBounds.width,
    selectionBounds.height
  );

  // Store original image data for potential cancel
  state.originalImageData = layerCtx.getImageData(
    selectionBounds.x,
    selectionBounds.y,
    selectionBounds.width,
    selectionBounds.height
  );

  // Clear the selected area on the layer
  layerCtx.clearRect(
    selectionBounds.x,
    selectionBounds.y,
    selectionBounds.width,
    selectionBounds.height
  );
}

/**
 * Applies translate/scale/rotate based on which handle is being dragged
 */
export function updateTransform(
  state: TransformState,
  dx: number,
  dy: number,
  handle: string | null
): void {
  if (!state.currentBounds) return;

  if (!handle) {
    // Move entire selection
    state.currentBounds.x += dx;
    state.currentBounds.y += dy;
  } else if (handle === 'rotate') {
    // Rotation handle
    const centerX = state.currentBounds.x + state.currentBounds.width / 2;
    const centerY = state.currentBounds.y + state.currentBounds.height / 2;
    const angle = Math.atan2(dy, dx);
    state.rotation = (state.rotation || 0) + angle;
  } else {
    // Scale handles (nw, n, ne, e, se, s, sw, w)
    const bounds = state.currentBounds;

    switch (handle) {
      case 'nw':
        bounds.x += dx;
        bounds.y += dy;
        bounds.width -= dx;
        bounds.height -= dy;
        break;
      case 'n':
        bounds.y += dy;
        bounds.height -= dy;
        break;
      case 'ne':
        bounds.y += dy;
        bounds.width += dx;
        bounds.height -= dy;
        break;
      case 'e':
        bounds.width += dx;
        break;
      case 'se':
        bounds.width += dx;
        bounds.height += dy;
        break;
      case 's':
        bounds.height += dy;
        break;
      case 'sw':
        bounds.x += dx;
        bounds.width -= dx;
        bounds.height += dy;
        break;
      case 'w':
        bounds.x += dx;
        bounds.width -= dx;
        break;
    }

    // Prevent negative dimensions
    if (bounds.width < 1) bounds.width = 1;
    if (bounds.height < 1) bounds.height = 1;
  }
}

/**
 * Composites the transformed temp canvas back onto the layer
 */
export function commitTransform(
  state: TransformState,
  layerCtx: CanvasRenderingContext2D
): void {
  if (!state.canvas || !state.currentBounds) return;

  layerCtx.save();

  const bounds = state.currentBounds;
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  // Apply rotation if present
  if (state.rotation) {
    layerCtx.translate(centerX, centerY);
    layerCtx.rotate(state.rotation);
    layerCtx.translate(-centerX, -centerY);
  }

  // Draw transformed pixels
  layerCtx.drawImage(
    state.canvas,
    0,
    0,
    state.canvas.width,
    state.canvas.height,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height
  );

  layerCtx.restore();

  // Clear transform state
  state.canvas = null;
  state.originalImageData = null;
  state.originalBounds = null;
  state.currentBounds = null;
  state.rotation = 0;
}

/**
 * Restores original pixels without applying transform
 */
export function cancelTransform(
  state: TransformState,
  layerCtx: CanvasRenderingContext2D
): void {
  if (!state.originalImageData || !state.originalBounds) return;

  // Restore original pixels
  layerCtx.putImageData(
    state.originalImageData,
    state.originalBounds.x,
    state.originalBounds.y
  );

  // Clear transform state
  state.canvas = null;
  state.originalImageData = null;
  state.originalBounds = null;
  state.currentBounds = null;
  state.rotation = 0;
}

/**
 * Draws 8 handle squares + rotation handle on the transform bounding box
 */
export function renderTransformHandles(
  state: TransformState,
  ctx: CanvasRenderingContext2D
): void {
  if (!state.currentBounds) return;

  const bounds = state.currentBounds;
  const handleSize = 8;
  const rotateHandleDistance = 30;

  ctx.save();

  // Draw bounding box
  ctx.strokeStyle = '#0080ff';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.setLineDash([]);

  // Draw 8 resize handles
  const handles = [
    { name: 'nw', x: bounds.x, y: bounds.y },
    { name: 'n', x: bounds.x + bounds.width / 2, y: bounds.y },
    { name: 'ne', x: bounds.x + bounds.width, y: bounds.y },
    { name: 'e', x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
    { name: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { name: 's', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
    { name: 'sw', x: bounds.x, y: bounds.y + bounds.height },
    { name: 'w', x: bounds.x, y: bounds.y + bounds.height / 2 },
  ];

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0080ff';
  ctx.lineWidth = 2;

  handles.forEach((handle) => {
    ctx.fillRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.strokeRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
  });

  // Draw rotation handle
  const centerX = bounds.x + bounds.width / 2;
  const rotateY = bounds.y - rotateHandleDistance;

  // Line from top center to rotation handle
  ctx.beginPath();
  ctx.moveTo(centerX, bounds.y);
  ctx.lineTo(centerX, rotateY);
  ctx.strokeStyle = '#0080ff';
  ctx.stroke();

  // Rotation handle circle
  ctx.beginPath();
  ctx.arc(centerX, rotateY, handleSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#0080ff';
  ctx.stroke();

  ctx.restore();
}

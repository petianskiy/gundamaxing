/**
 * Flood fill starting at (x, y) on the given canvas context.
 * @param ctx - The canvas context to fill
 * @param startX - Starting X coordinate
 * @param startY - Starting Y coordinate
 * @param fillColor - Color to fill with (hex string like "#ff0000")
 * @param tolerance - Color matching tolerance (0-255)
 * @param selectionMask - Optional selection mask canvas (only fill within selected area)
 */
export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: string,
  tolerance: number = 0,
  selectionMask: HTMLCanvasElement | null = null
): void {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;

  // Round and clamp starting coordinates
  startX = Math.floor(startX);
  startY = Math.floor(startY);

  if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
    return;
  }

  // Parse fill color from hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const fillRgb = hexToRgb(fillColor);

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Get selection mask data if provided
  let maskData: Uint8ClampedArray | null = null;
  if (selectionMask) {
    const maskCtx = selectionMask.getContext('2d');
    if (maskCtx) {
      const maskImageData = maskCtx.getImageData(0, 0, width, height);
      maskData = maskImageData.data;
    }
  }

  // Get target color at starting point
  const startIdx = (startY * width + startX) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  // Check if target color is same as fill color
  if (
    targetR === fillRgb.r &&
    targetG === fillRgb.g &&
    targetB === fillRgb.b &&
    targetA === 255
  ) {
    return;
  }

  // Color matching function with tolerance
  const colorMatches = (idx: number): boolean => {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    // Calculate Euclidean distance in RGB space
    const distance = Math.sqrt(
      Math.pow(r - targetR, 2) +
        Math.pow(g - targetG, 2) +
        Math.pow(b - targetB, 2) +
        Math.pow(a - targetA, 2)
    );

    return distance <= tolerance;
  };

  // Check if pixel is within selection mask
  const isInSelection = (idx: number): boolean => {
    if (!maskData) return true;
    const alpha = maskData[idx + 3];
    return alpha > 128;
  };

  // Visited pixels tracking
  const visited = new Uint8Array(width * height);

  // Scanline flood fill algorithm
  const stack: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

  while (stack.length > 0) {
    const { x, y } = stack.pop()!;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const idx = (y * width + x) * 4;
    const visitedIdx = y * width + x;

    if (visited[visitedIdx]) continue;
    if (!colorMatches(idx)) continue;
    if (!isInSelection(idx)) continue;

    // Mark as visited
    visited[visitedIdx] = 1;

    // Fill the pixel
    data[idx] = fillRgb.r;
    data[idx + 1] = fillRgb.g;
    data[idx + 2] = fillRgb.b;
    data[idx + 3] = 255;

    // Scanline left
    let leftX = x - 1;
    while (leftX >= 0) {
      const leftIdx = (y * width + leftX) * 4;
      const leftVisitedIdx = y * width + leftX;
      if (
        visited[leftVisitedIdx] ||
        !colorMatches(leftIdx) ||
        !isInSelection(leftIdx)
      ) {
        break;
      }
      visited[leftVisitedIdx] = 1;
      data[leftIdx] = fillRgb.r;
      data[leftIdx + 1] = fillRgb.g;
      data[leftIdx + 2] = fillRgb.b;
      data[leftIdx + 3] = 255;
      leftX--;
    }

    // Scanline right
    let rightX = x + 1;
    while (rightX < width) {
      const rightIdx = (y * width + rightX) * 4;
      const rightVisitedIdx = y * width + rightX;
      if (
        visited[rightVisitedIdx] ||
        !colorMatches(rightIdx) ||
        !isInSelection(rightIdx)
      ) {
        break;
      }
      visited[rightVisitedIdx] = 1;
      data[rightIdx] = fillRgb.r;
      data[rightIdx + 1] = fillRgb.g;
      data[rightIdx + 2] = fillRgb.b;
      data[rightIdx + 3] = 255;
      rightX++;
    }

    // Add neighboring rows to stack
    for (let scanX = leftX + 1; scanX < rightX; scanX++) {
      stack.push({ x: scanX, y: y - 1 });
      stack.push({ x: scanX, y: y + 1 });
    }
  }

  // Put the modified image data back
  ctx.putImageData(imageData, 0, 0);
}

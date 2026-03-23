/**
 * Client-side card edge detection using Canvas ImageData.
 * Uses Sobel gradient-based edge detection + contour finding.
 * Designed for detecting a single card on a mostly uniform background.
 */

export interface Point { x: number; y: number }

export interface CardDetectionResult {
  corners: [Point, Point, Point, Point]; // TL, TR, BR, BL
  area: number;
  frameRatio: number; // 0-1 how much of the frame the card fills
}

/**
 * Detect the largest rectangular card-like shape in the image.
 * Returns null if no clear card is found.
 */
export function detectCard(
  imageData: ImageData,
  minAreaRatio = 0.08,
  maxAreaRatio = 0.85,
): CardDetectionResult | null {
  const { width, height, data } = imageData;
  const totalPixels = width * height;

  // Step 1: Convert to grayscale
  const gray = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // Step 2: Simple box blur (3x3) for noise reduction
  const blurred = new Uint8Array(totalPixels);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += gray[(y + dy) * width + (x + dx)];
        }
      }
      blurred[y * width + x] = Math.round(sum / 9);
    }
  }

  // Step 3: Sobel edge detection
  const edges = new Uint8Array(totalPixels);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      // Sobel X
      const gx =
        -blurred[(y - 1) * width + (x - 1)] + blurred[(y - 1) * width + (x + 1)]
        - 2 * blurred[y * width + (x - 1)] + 2 * blurred[y * width + (x + 1)]
        - blurred[(y + 1) * width + (x - 1)] + blurred[(y + 1) * width + (x + 1)];
      // Sobel Y
      const gy =
        -blurred[(y - 1) * width + (x - 1)] - 2 * blurred[(y - 1) * width + x] - blurred[(y - 1) * width + (x + 1)]
        + blurred[(y + 1) * width + (x - 1)] + 2 * blurred[(y + 1) * width + x] + blurred[(y + 1) * width + (x + 1)];
      const mag = Math.sqrt(gx * gx + gy * gy);
      edges[idx] = mag > 50 ? 255 : 0;
    }
  }

  // Step 4: Find bounding box of the largest connected edge region
  // Simplified: use a line-scanning approach to find the largest rectangular contour
  // Scan horizontal and vertical projection profiles
  const hProj = new Float32Array(height);
  const vProj = new Float32Array(width);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x] > 0) {
        hProj[y]++;
        vProj[x]++;
      }
    }
  }

  // Find the edges of the card by looking for strong edge density thresholds
  const hThreshold = width * 0.05;
  const vThreshold = height * 0.05;

  let top = 0, bottom = height - 1, left = 0, right = width - 1;

  // Find top edge
  for (let y = 0; y < height; y++) {
    if (hProj[y] > hThreshold) { top = y; break; }
  }
  // Find bottom edge
  for (let y = height - 1; y >= 0; y--) {
    if (hProj[y] > hThreshold) { bottom = y; break; }
  }
  // Find left edge
  for (let x = 0; x < width; x++) {
    if (vProj[x] > vThreshold) { left = x; break; }
  }
  // Find right edge
  for (let x = width - 1; x >= 0; x--) {
    if (vProj[x] > vThreshold) { right = x; break; }
  }

  const cardW = right - left;
  const cardH = bottom - top;
  const area = cardW * cardH;
  const areaRatio = area / totalPixels;

  if (areaRatio < minAreaRatio || areaRatio > maxAreaRatio) return null;
  if (cardW < 50 || cardH < 50) return null;

  // Check aspect ratio (card should be roughly 3:4 portrait or 4:3 landscape)
  const aspect = Math.max(cardW, cardH) / Math.min(cardW, cardH);
  if (aspect > 2.5 || aspect < 1.1) return null;

  return {
    corners: [
      { x: left, y: top },
      { x: right, y: top },
      { x: right, y: bottom },
      { x: left, y: bottom },
    ],
    area,
    frameRatio: areaRatio,
  };
}

/**
 * Check if the detection is stable across recent frames.
 */
export function isStable(
  history: CardDetectionResult[],
  threshold = 0.02,
  minFrames = 5,
): boolean {
  if (history.length < minFrames) return false;
  const recent = history.slice(-minFrames);

  for (let i = 1; i < recent.length; i++) {
    const prev = recent[i - 1];
    const curr = recent[i];
    for (let c = 0; c < 4; c++) {
      const dx = Math.abs(curr.corners[c].x - prev.corners[c].x) / (curr.corners[1].x - curr.corners[0].x || 1);
      const dy = Math.abs(curr.corners[c].y - prev.corners[c].y) / (curr.corners[2].y - curr.corners[0].y || 1);
      if (dx > threshold || dy > threshold) return false;
    }
  }
  return true;
}

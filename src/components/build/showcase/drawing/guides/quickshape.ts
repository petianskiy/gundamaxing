export interface QuickShapeResult {
  detected: boolean;
  type: "line" | "circle" | "ellipse" | "rect" | "triangle" | null;
  /** The snap points/parameters if detected */
  params: {
    /** For line: start and end points */
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
    /** For circle/ellipse: center and radii */
    centerX?: number;
    centerY?: number;
    radiusX?: number;
    radiusY?: number;
    /** For rect: top-left corner and dimensions */
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    /** For triangle: 3 vertices */
    points?: { x: number; y: number }[];
  } | null;
}

/**
 * Analyze a set of stroke points and detect if they form a recognizable shape.
 * Returns the detected shape or null if no shape detected.
 */
export function detectQuickShape(points: { x: number; y: number }[]): QuickShapeResult {
  if (points.length < 5) {
    return { detected: false, type: null, params: null };
  }

  // Try to detect line first (simplest shape)
  const lineResult = detectLine(points);
  if (lineResult.detected) return lineResult;

  // Check if path closes (end near start)
  const closes = pathCloses(points);

  if (closes) {
    // Try circle
    const circleResult = detectCircle(points);
    if (circleResult.detected) return circleResult;

    // Try ellipse
    const ellipseResult = detectEllipse(points);
    if (ellipseResult.detected) return ellipseResult;

    // Try triangle
    const triangleResult = detectTriangle(points);
    if (triangleResult.detected) return triangleResult;

    // Try rectangle
    const rectResult = detectRectangle(points);
    if (rectResult.detected) return rectResult;
  }

  return { detected: false, type: null, params: null };
}

/**
 * Render the detected shape onto a canvas context.
 */
export function renderQuickShape(
  result: QuickShapeResult,
  ctx: CanvasRenderingContext2D,
  color: string,
  lineWidth: number
): void {
  if (!result.detected || !result.params) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (result.type === "line" && result.params.startX !== undefined) {
    ctx.beginPath();
    ctx.moveTo(result.params.startX, result.params.startY!);
    ctx.lineTo(result.params.endX!, result.params.endY!);
    ctx.stroke();
  } else if (result.type === "circle" && result.params.centerX !== undefined) {
    ctx.beginPath();
    ctx.arc(
      result.params.centerX,
      result.params.centerY!,
      result.params.radiusX!,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  } else if (result.type === "ellipse" && result.params.centerX !== undefined) {
    ctx.beginPath();
    ctx.ellipse(
      result.params.centerX,
      result.params.centerY!,
      result.params.radiusX!,
      result.params.radiusY!,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  } else if (result.type === "rect" && result.params.x !== undefined) {
    ctx.beginPath();
    ctx.rect(result.params.x, result.params.y!, result.params.width!, result.params.height!);
    ctx.stroke();
  } else if (result.type === "triangle" && result.params.points) {
    const pts = result.params.points;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();
}

// Helper functions

function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function pathCloses(points: { x: number; y: number }[]): boolean {
  const start = points[0];
  const end = points[points.length - 1];
  const pathLength = calculatePathLength(points);
  const endToStartDist = distance(start, end);
  // Path closes if end is within 10% of path length from start
  return endToStartDist < pathLength * 0.1;
}

function calculatePathLength(points: { x: number; y: number }[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += distance(points[i - 1], points[i]);
  }
  return length;
}

function getCentroid(points: { x: number; y: number }[]): { x: number; y: number } {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function detectLine(points: { x: number; y: number }[]): QuickShapeResult {
  // Calculate total curvature by measuring deviation from straight line
  const start = points[0];
  const end = points[points.length - 1];
  const lineLength = distance(start, end);

  if (lineLength < 10) {
    return { detected: false, type: null, params: null };
  }

  let totalDeviation = 0;
  for (const point of points) {
    // Calculate perpendicular distance from point to line
    const deviation = perpendicularDistance(point, start, end);
    totalDeviation += deviation;
  }

  const avgDeviation = totalDeviation / points.length;
  const deviationRatio = avgDeviation / lineLength;

  // If average deviation is less than 5% of line length, it's a line
  if (deviationRatio < 0.05) {
    return {
      detected: true,
      type: "line",
      params: {
        startX: start.x,
        startY: start.y,
        endX: end.x,
        endY: end.y,
      },
    };
  }

  return { detected: false, type: null, params: null };
}

function perpendicularDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) return distance(point, lineStart);

  const t = Math.max(
    0,
    Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared)
  );

  const projectionX = lineStart.x + t * dx;
  const projectionY = lineStart.y + t * dy;

  return distance(point, { x: projectionX, y: projectionY });
}

function detectCircle(points: { x: number; y: number }[]): QuickShapeResult {
  const center = getCentroid(points);
  const distances = points.map((p) => distance(p, center));
  const avgRadius = distances.reduce((a, b) => a + b, 0) / distances.length;

  // Calculate variance of distances
  const variance =
    distances.reduce((sum, d) => sum + (d - avgRadius) ** 2, 0) / distances.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / avgRadius;

  // If variance is low (within 10% of average), it's a circle
  if (coefficientOfVariation < 0.1 && avgRadius > 10) {
    return {
      detected: true,
      type: "circle",
      params: {
        centerX: center.x,
        centerY: center.y,
        radiusX: avgRadius,
        radiusY: avgRadius,
      },
    };
  }

  return { detected: false, type: null, params: null };
}

function detectEllipse(points: { x: number; y: number }[]): QuickShapeResult {
  const center = getCentroid(points);

  // Calculate distances in X and Y separately
  const xDistances = points.map((p) => Math.abs(p.x - center.x));
  const yDistances = points.map((p) => Math.abs(p.y - center.y));

  const avgRadiusX = Math.max(...xDistances);
  const avgRadiusY = Math.max(...yDistances);

  // Check if it fits an ellipse equation
  let totalError = 0;
  for (const p of points) {
    const normalizedX = (p.x - center.x) / avgRadiusX;
    const normalizedY = (p.y - center.y) / avgRadiusY;
    const ellipseValue = normalizedX ** 2 + normalizedY ** 2;
    totalError += Math.abs(ellipseValue - 1);
  }

  const avgError = totalError / points.length;

  // If average error is low and radii are different enough, it's an ellipse
  const radiusRatio = Math.max(avgRadiusX, avgRadiusY) / Math.min(avgRadiusX, avgRadiusY);
  if (avgError < 0.15 && radiusRatio > 1.3 && Math.min(avgRadiusX, avgRadiusY) > 10) {
    return {
      detected: true,
      type: "ellipse",
      params: {
        centerX: center.x,
        centerY: center.y,
        radiusX: avgRadiusX,
        radiusY: avgRadiusY,
      },
    };
  }

  return { detected: false, type: null, params: null };
}

function findCorners(points: { x: number; y: number }[]): number[] {
  const corners: number[] = [];
  const angleThreshold = Math.PI / 4; // 45 degrees

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
    const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
    let angleDiff = Math.abs(angle2 - angle1);

    // Normalize angle difference to [0, PI]
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

    if (angleDiff > angleThreshold) {
      corners.push(i);
    }
  }

  return corners;
}

function detectRectangle(points: { x: number; y: number }[]): QuickShapeResult {
  const corners = findCorners(points);

  // Rectangle should have 4 corners
  if (corners.length < 3 || corners.length > 5) {
    return { detected: false, type: null, params: null };
  }

  // Get corner points (sample evenly if we have too many)
  const cornerPoints: { x: number; y: number }[] = [];
  if (corners.length === 4) {
    cornerPoints.push(...corners.map((i) => points[i]));
  } else {
    // Use first, quarter, half, three-quarter points
    const step = Math.floor(points.length / 4);
    for (let i = 0; i < 4; i++) {
      cornerPoints.push(points[i * step]);
    }
  }

  // Find bounding box
  const xs = cornerPoints.map((p) => p.x);
  const ys = cornerPoints.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = maxX - minX;
  const height = maxY - minY;

  if (width < 10 || height < 10) {
    return { detected: false, type: null, params: null };
  }

  // Check if corners are roughly rectangular
  const aspectRatio = Math.max(width, height) / Math.min(width, height);
  if (aspectRatio > 10) {
    return { detected: false, type: null, params: null };
  }

  return {
    detected: true,
    type: "rect",
    params: {
      x: minX,
      y: minY,
      width,
      height,
    },
  };
}

function detectTriangle(points: { x: number; y: number }[]): QuickShapeResult {
  const corners = findCorners(points);

  // Triangle should have 3 corners
  if (corners.length < 2 || corners.length > 4) {
    return { detected: false, type: null, params: null };
  }

  // Get 3 corner points (sample evenly)
  const step = Math.floor(points.length / 3);
  const trianglePoints = [points[0], points[step], points[step * 2]];

  // Check if triangle is reasonably sized
  const side1 = distance(trianglePoints[0], trianglePoints[1]);
  const side2 = distance(trianglePoints[1], trianglePoints[2]);
  const side3 = distance(trianglePoints[2], trianglePoints[0]);

  if (Math.min(side1, side2, side3) < 10) {
    return { detected: false, type: null, params: null };
  }

  // Check if it's not too degenerate (not too flat)
  const maxSide = Math.max(side1, side2, side3);
  const minSide = Math.min(side1, side2, side3);
  if (maxSide / minSide > 10) {
    return { detected: false, type: null, params: null };
  }

  return {
    detected: true,
    type: "triangle",
    params: {
      points: trianglePoints,
    },
  };
}

export interface BrushPoint {
  x: number;
  y: number;
  pressure: number;
}

export interface Brush {
  name: string;
  id: string;
  draw: (
    ctx: CanvasRenderingContext2D,
    points: BrushPoint[],
    color: string,
    size: number
  ) => void;
}

function drawPen(
  ctx: CanvasRenderingContext2D,
  points: BrushPoint[],
  color: string,
  size: number
) {
  if (points.length < 2) return;
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  points: BrushPoint[],
  color: string,
  size: number
) {
  if (points.length < 2) return;
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawWatercolor(
  ctx: CanvasRenderingContext2D,
  points: BrushPoint[],
  color: string,
  size: number
) {
  ctx.globalCompositeOperation = "source-over";
  const radius = size * 1.5;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const layers = 3;
    for (let l = 0; l < layers; l++) {
      const offsetX = (Math.random() - 0.5) * radius * 0.6;
      const offsetY = (Math.random() - 0.5) * radius * 0.6;
      const r = radius * (0.6 + Math.random() * 0.4);
      ctx.globalAlpha = 0.02 + Math.random() * 0.04;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x + offsetX, p.y + offsetY, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawSpray(
  ctx: CanvasRenderingContext2D,
  points: BrushPoint[],
  color: string,
  size: number
) {
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = color;
  const density = Math.max(10, size * 3);
  for (const p of points) {
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * size * 1.5;
      const dotSize = Math.random() * 1.5 + 0.5;
      ctx.globalAlpha = Math.random() * 0.3 + 0.1;
      ctx.beginPath();
      ctx.arc(
        p.x + Math.cos(angle) * dist,
        p.y + Math.sin(angle) * dist,
        dotSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawEraser(
  ctx: CanvasRenderingContext2D,
  points: BrushPoint[],
  _color: string,
  size: number
) {
  if (points.length < 2) return;
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = "rgba(0,0,0,1)";
  ctx.lineWidth = size * 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
}

export const BRUSHES: Brush[] = [
  { name: "Pen", id: "pen", draw: drawPen },
  { name: "Marker", id: "marker", draw: drawMarker },
  { name: "Watercolor", id: "watercolor", draw: drawWatercolor },
  { name: "Spray", id: "spray", draw: drawSpray },
  { name: "Eraser", id: "eraser", draw: drawEraser },
];

"use client";

import { useMemo } from "react";
import type { ShowcaseShapeElement, ShapeFill } from "@/lib/types";

interface ShapeElementProps {
  element: ShowcaseShapeElement;
  isEditing?: boolean;
}

// Generate polygon points for various shapes
function getShapePoints(shapeType: string, w: number, h: number): string {
  switch (shapeType) {
    case "triangle":
      return `${w / 2},0 ${w},${h} 0,${h}`;
    case "star": {
      const cx = w / 2;
      const cy = h / 2;
      const outerR = Math.min(w, h) / 2;
      const innerR = outerR * 0.38;
      const points: string[] = [];
      for (let i = 0; i < 5; i++) {
        const outerAngle = (Math.PI / 2) * -1 + (i * 2 * Math.PI) / 5;
        const innerAngle = outerAngle + Math.PI / 5;
        points.push(`${cx + outerR * Math.cos(outerAngle)},${cy + outerR * Math.sin(outerAngle)}`);
        points.push(`${cx + innerR * Math.cos(innerAngle)},${cy + innerR * Math.sin(innerAngle)}`);
      }
      return points.join(" ");
    }
    case "hexagon": {
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) / 2;
      const points: string[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 6) + (i * 2 * Math.PI) / 6;
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return points.join(" ");
    }
    case "pentagon": {
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) / 2;
      const points: string[] = [];
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI / 2) * -1 + (i * 2 * Math.PI) / 5;
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return points.join(" ");
    }
    case "arrow":
      return `0,${h * 0.25} ${w * 0.6},${h * 0.25} ${w * 0.6},0 ${w},${h / 2} ${w * 0.6},${h} ${w * 0.6},${h * 0.75} 0,${h * 0.75}`;
    case "diamond":
      return `${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`;
    default:
      return "";
  }
}

function FillDefs({ fill, shapeId }: { fill: ShapeFill; shapeId: string }) {
  if (fill.type === "gradient") {
    const angleRad = (fill.angle * Math.PI) / 180;
    const x1 = 50 - 50 * Math.cos(angleRad);
    const y1 = 50 - 50 * Math.sin(angleRad);
    const x2 = 50 + 50 * Math.cos(angleRad);
    const y2 = 50 + 50 * Math.sin(angleRad);
    return (
      <defs>
        <linearGradient
          id={`grad-${shapeId}`}
          x1={`${x1}%`}
          y1={`${y1}%`}
          x2={`${x2}%`}
          y2={`${y2}%`}
        >
          {fill.colors.map((color, i) => (
            <stop
              key={i}
              offset={`${(i / (fill.colors.length - 1)) * 100}%`}
              stopColor={color}
            />
          ))}
        </linearGradient>
      </defs>
    );
  }
  if (fill.type === "image") {
    return (
      <defs>
        <pattern
          id={`pat-${shapeId}`}
          patternUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <image
            href={fill.imageUrl}
            width="100%"
            height="100%"
            preserveAspectRatio={fill.objectFit === "cover" ? "xMidYMid slice" : "xMidYMid meet"}
          />
        </pattern>
      </defs>
    );
  }
  return null;
}

function getFillAttr(fill: ShapeFill, shapeId: string): string {
  switch (fill.type) {
    case "solid":
      return fill.color;
    case "gradient":
      return `url(#grad-${shapeId})`;
    case "image":
      return `url(#pat-${shapeId})`;
    case "none":
      return "none";
    default:
      return "none";
  }
}

export function ShapeElement({ element }: ShapeElementProps) {
  const { shapeType, fill, stroke, strokeWidth, opacity, cornerRadius, shadow } = element;
  const shapeId = element.id;

  // Use a fixed viewBox size for consistent rendering
  const vw = 100;
  const vh = 100;

  const fillAttr = useMemo(() => getFillAttr(fill, shapeId), [fill, shapeId]);
  const strokeAttr = stroke || "none";
  const strokeW = stroke ? strokeWidth : 0;

  // Inset for stroke so it doesn't clip
  const inset = strokeW / 2;
  const innerW = vw - strokeW;
  const innerH = vh - strokeW;

  const filterStyle = shadow
    ? "drop-shadow(0 4px 12px rgba(0,0,0,0.4))"
    : undefined;

  const renderShape = () => {
    switch (shapeType) {
      case "rectangle":
        return (
          <rect
            x={inset}
            y={inset}
            width={innerW}
            height={innerH}
            rx={cornerRadius}
            ry={cornerRadius}
            fill={fillAttr}
            stroke={strokeAttr}
            strokeWidth={strokeW}
          />
        );
      case "circle":
        return (
          <ellipse
            cx={vw / 2}
            cy={vh / 2}
            rx={innerW / 2}
            ry={innerH / 2}
            fill={fillAttr}
            stroke={strokeAttr}
            strokeWidth={strokeW}
          />
        );
      case "triangle":
      case "star":
      case "hexagon":
      case "pentagon":
      case "arrow":
      case "diamond": {
        const points = getShapePoints(shapeType, innerW, innerH);
        return (
          <polygon
            points={points}
            fill={fillAttr}
            stroke={strokeAttr}
            strokeWidth={strokeW}
            strokeLinejoin="round"
            transform={`translate(${inset}, ${inset})`}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full" style={{ opacity }}>
      <svg
        viewBox={`0 0 ${vw} ${vh}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        style={{ filter: filterStyle }}
      >
        <FillDefs fill={fill} shapeId={shapeId} />
        {renderShape()}
      </svg>
    </div>
  );
}

"use client";

import { X } from "lucide-react";
import type { ShapeType, ShowcaseShapeElement, ShapeFill } from "@/lib/types";

interface ShapePickerPanelProps {
  onSelect: (shape: ShowcaseShapeElement) => void;
  onClose: () => void;
}

interface ShapeDefinition {
  type: ShapeType;
  name: string;
  previewPath: string; // SVG path/element for preview
}

const SHAPES: ShapeDefinition[] = [
  {
    type: "rectangle",
    name: "Rectangle",
    previewPath: "rect",
  },
  {
    type: "circle",
    name: "Circle",
    previewPath: "circle",
  },
  {
    type: "triangle",
    name: "Triangle",
    previewPath: "triangle",
  },
  {
    type: "star",
    name: "Star",
    previewPath: "star",
  },
  {
    type: "hexagon",
    name: "Hexagon",
    previewPath: "hexagon",
  },
  {
    type: "arrow",
    name: "Arrow",
    previewPath: "arrow",
  },
  {
    type: "diamond",
    name: "Diamond",
    previewPath: "diamond",
  },
  {
    type: "pentagon",
    name: "Pentagon",
    previewPath: "pentagon",
  },
];

function ShapePreviewIcon({ shapeType }: { shapeType: ShapeType }) {
  const size = 40;
  const stroke = "currentColor";
  const fill = "none";
  const sw = 1.5;

  switch (shapeType) {
    case "rectangle":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <rect x={4} y={8} width={32} height={24} fill={fill} stroke={stroke} strokeWidth={sw} rx={2} />
        </svg>
      );
    case "circle":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <ellipse cx={20} cy={20} rx={16} ry={14} fill={fill} stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case "triangle":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <polygon points="20,4 36,36 4,36" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        </svg>
      );
    case "star": {
      const cx = 20, cy = 20, outerR = 16, innerR = 6;
      const points: string[] = [];
      for (let i = 0; i < 5; i++) {
        const outerAngle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const innerAngle = outerAngle + Math.PI / 5;
        points.push(`${cx + outerR * Math.cos(outerAngle)},${cy + outerR * Math.sin(outerAngle)}`);
        points.push(`${cx + innerR * Math.cos(innerAngle)},${cy + innerR * Math.sin(innerAngle)}`);
      }
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <polygon points={points.join(" ")} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        </svg>
      );
    }
    case "hexagon": {
      const cx = 20, cy = 20, r = 16;
      const points: string[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 6 + (i * 2 * Math.PI) / 6;
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <polygon points={points.join(" ")} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        </svg>
      );
    }
    case "arrow":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <polygon points="4,14 24,14 24,6 36,20 24,34 24,26 4,26" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <polygon points="20,4 36,20 20,36 4,20" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        </svg>
      );
    case "pentagon": {
      const cx = 20, cy = 20, r = 16;
      const points: string[] = [];
      for (let i = 0; i < 5; i++) {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <polygon points={points.join(" ")} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        </svg>
      );
    }
    default:
      return null;
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function ShapePickerPanel({ onSelect, onClose }: ShapePickerPanelProps) {
  const handleSelectShape = (shapeType: ShapeType) => {
    const defaultFill: ShapeFill = { type: "solid", color: "#ffffff" };
    const element: ShowcaseShapeElement = {
      id: generateId(),
      type: "shape",
      x: 40,
      y: 40,
      width: 20,
      height: 20,
      zIndex: 0, // will be set by the editor
      rotation: 0,
      shapeType,
      fill: defaultFill,
      stroke: null,
      strokeWidth: 2,
      opacity: 1,
      cornerRadius: 0,
      shadow: false,
    };
    onSelect(element);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-20 sm:right-4 z-[500] w-full sm:w-72 bg-zinc-900 border-t sm:border border-zinc-700 sm:rounded-xl rounded-t-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <h3 className="text-sm font-semibold text-white">Shapes</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-4 gap-2">
          {SHAPES.map((shape) => (
            <button
              key={shape.type}
              onClick={() => handleSelectShape(shape.type)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-zinc-700 hover:border-blue-500/50 hover:bg-zinc-800/50 transition-colors group"
            >
              <div className="text-zinc-400 group-hover:text-blue-400 transition-colors">
                <ShapePreviewIcon shapeType={shape.type} />
              </div>
              <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                {shape.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

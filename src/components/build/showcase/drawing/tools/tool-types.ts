export type ToolType = "brush" | "eraser" | "move" | "select" | "shape" | "eyedropper" | "fill";

export type SelectionMode = "rect" | "ellipse" | "freehand";

export interface SelectionState {
  mode: SelectionMode;
  /** The selection mask as an alpha-channel canvas (white = selected) */
  mask: HTMLCanvasElement | null;
  /** Bounding box of the selection */
  bounds: { x: number; y: number; width: number; height: number } | null;
  /** Whether the selection is currently being drawn */
  active: boolean;
  /** Raw points for freehand selection */
  points: { x: number; y: number }[];
  /** Feather amount in pixels (0 = hard edge) */
  feather: number;
}

export interface TransformState {
  /** The transformed pixels on a temp canvas */
  canvas: HTMLCanvasElement | null;
  /** Source bounds before transform */
  sourceBounds: { x: number; y: number; width: number; height: number } | null;
  /** Original bounds before any manipulation */
  originalBounds: { x: number; y: number; width: number; height: number } | null;
  /** Current bounds (after translate/scale) */
  currentBounds: { x: number; y: number; width: number; height: number } | null;
  /** Original pixel data for cancel */
  originalImageData: ImageData | null;
  /** Current rotation in radians */
  rotation: number;
  /** Current transform matrix [a, b, c, d, e, f] */
  matrix: number[];
  /** Currently dragged handle: 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'rotate', null */
  activeHandle: string | null;
  /** Whether the transform is active */
  active: boolean;
}

export type ShapeType = "line" | "rect" | "ellipse" | "polygon" | "triangle" | "star";

export interface ShapeState {
  type: ShapeType;
  /** Whether shape is filled or stroke-only */
  filled: boolean;
  /** Stroke width for shape outline */
  strokeWidth: number;
  sideCount: number;
  starPointCount: number;
  starInnerRatio: number;
  opacity: number;
  /** Starting point */
  start: { x: number; y: number } | null;
  /** Current/end point */
  end: { x: number; y: number } | null;
  /** Whether currently drawing */
  active: boolean;
}

export function createSelectionState(): SelectionState {
  return {
    mode: "rect",
    mask: null,
    bounds: null,
    active: false,
    points: [],
    feather: 0,
  };
}

export function createTransformState(): TransformState {
  return {
    canvas: null,
    sourceBounds: null,
    originalBounds: null,
    currentBounds: null,
    originalImageData: null,
    rotation: 0,
    matrix: [1, 0, 0, 1, 0, 0],
    activeHandle: null,
    active: false,
  };
}

export function createShapeState(): ShapeState {
  return {
    type: "rect",
    filled: false,
    strokeWidth: 2,
    sideCount: 6,
    starPointCount: 5,
    starInnerRatio: 0.4,
    opacity: 1,
    start: null,
    end: null,
    active: false,
  };
}

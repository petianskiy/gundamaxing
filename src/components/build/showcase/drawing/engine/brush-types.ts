// ─── Brush Engine Types ─────────────────────────────────────────
// Data-driven brush presets consumed by the stamp engine.
// No executable draw functions — the engine interprets these params.

export type BrushCategory =
  | "pencils"
  | "inks"
  | "paints"
  | "airbrush"
  | "markers"
  | "textures"
  | "fx"
  | "mecha"
  | "erasers"
  | "custom";

export type RenderMode = "normal" | "buildup" | "wet";

export type BlendMode = GlobalCompositeOperation;

export interface DynamicsConfig {
  /** Value at pressure = 0 */
  pressureMin: number;
  /** Value at pressure = 1 */
  pressureMax: number;
  /** 0-1: how much stroke velocity affects value (faster = more) */
  velocityInfluence: number;
  /** 0-1: how much pen tilt affects value (Apple Pencil, etc.) */
  tiltInfluence: number;
}

export interface BrushPreset {
  id: string;
  name: string;
  category: BrushCategory;
  /** Optional folder for user organization */
  folder?: string;

  // ─── Shape ─────────────────────────────────────
  /** Brush tip shape */
  shape: "circle" | "square";
  /** 0-1: soft (gaussian falloff) to hard (flat) edge */
  hardness: number;
  /** 0-1: 1 = circle, <1 = ellipse (compressed on one axis) */
  roundness: number;
  /** Degrees: rotation of the brush tip */
  angle: number;

  // ─── Grain/Texture ─────────────────────────────
  /** Base64 data URL for grain texture (optional) */
  grain?: string;
  /** Scale of the grain texture (0.1 to 10) */
  grainScale: number;
  /** How grain blends with the shape mask */
  grainBlendMode: "multiply" | "screen" | "overlay";
  /** 0-1: intensity of the grain effect */
  grainIntensity: number;
  /** static = grain fixed to canvas, rolling = moves with stroke */
  grainMovement: "static" | "rolling" | "random";

  // ─── Spacing ───────────────────────────────────
  /** Percent of brush diameter between stamps (1-500, lower = smoother) */
  spacing: number;

  // ─── Dynamics ──────────────────────────────────
  /** Maps pressure → size multiplier */
  sizeDynamics: DynamicsConfig;
  /** Maps pressure → opacity multiplier */
  opacityDynamics: DynamicsConfig;
  /** Maps pressure → flow (paint per stamp) */
  flowDynamics: DynamicsConfig;
  /** Maps pressure → angle offset */
  angleDynamics: DynamicsConfig;

  // ─── Taper ─────────────────────────────────────
  /** 0-1: length of size taper-in as fraction of stroke */
  taperStart: number;
  /** 0-1: length of size taper-out as fraction of stroke */
  taperEnd: number;
  /** 0-1: minimum size at taper endpoints */
  taperSizeMin: number;

  // ─── Scatter/Jitter ────────────────────────────
  /** 0-500%: random offset perpendicular to stroke direction */
  scatter: number;
  /** 0-100%: random size variation per dab */
  jitterSize: number;
  /** 0-100%: random opacity variation per dab */
  jitterOpacity: number;
  /** 0-360 degrees: random rotation per dab */
  jitterRotation: number;

  // ─── Stabilization ─────────────────────────────
  /** 0-100: line smoothing amount (moving average window) */
  stabilization: number;

  // ─── Blending ──────────────────────────────────
  /** Canvas composite operation */
  blendMode: GlobalCompositeOperation;
  /** If true, uses destination-out for erasing */
  isEraser: boolean;

  // ─── v2: Image-based stamps ──────────────────
  /** URL to stamp PNG alpha mask (undefined = use procedural shape) */
  stampUrl?: string;
  /** URL to tileable grain texture PNG (undefined = use procedural noise) */
  grainUrl?: string;
  /** Rendering mode for dab compositing */
  renderMode?: RenderMode;
  /** Smudge strength for smudge/wet tools (0-1) */
  smudgeStrength?: number;
}

// ─── Runtime stroke data ─────────────────────────────────────────

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  tilt?: { x: number; y: number };
  timestamp: number;
}

/** A positioned dab ready for rendering */
export interface DabParams {
  x: number;
  y: number;
  size: number;
  opacity: number;
  flow: number;
  rotation: number;
  /** 0-1: position along stroke for taper calculation */
  strokePosition: number;
}

/** Bounding rect for dirty-region tracking */
export interface DirtyRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Undo commands ───────────────────────────────────────────────

export interface StrokeCommand {
  type: "stroke";
  layerId: string;
  brushPresetId: string;
  color: string;
  size: number;
  opacity: number;
  points: StrokePoint[];
}

export type DrawingCommand =
  | StrokeCommand
  | { type: "clear-layer"; layerId: string }
  | { type: "add-layer"; layerId: string; name: string; index: number }
  | { type: "delete-layer"; layerId: string }
  | { type: "merge-layers"; fromId: string; toId: string }
  | { type: "fill"; layerId: string; color: string; x: number; y: number }
  | { type: "transform"; layerId: string; matrix: number[] };

// ─── Helper ──────────────────────────────────────────────────────

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Create a default dynamics config (no pressure response) */
export function flatDynamics(value: number): DynamicsConfig {
  return {
    pressureMin: value,
    pressureMax: value,
    velocityInfluence: 0,
    tiltInfluence: 0,
  };
}

/** Create a pressure-responsive dynamics config */
export function pressureDynamics(
  min: number,
  max: number,
  velocity = 0,
  tilt = 0
): DynamicsConfig {
  return {
    pressureMin: min,
    pressureMax: max,
    velocityInfluence: velocity,
    tiltInfluence: tilt,
  };
}

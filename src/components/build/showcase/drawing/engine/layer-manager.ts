// ─── Layer Manager ───────────────────────────────────────────────
// Manages multiple drawing layers, each backed by a canvas element.

export type BlendMode = GlobalCompositeOperation;

export interface DrawingLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  canvas: HTMLCanvasElement;
  alphaLock: boolean;
  clippingMask: boolean;
}

const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: "source-over", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
  { value: "color-dodge", label: "Color Dodge" },
  { value: "color-burn", label: "Color Burn" },
  { value: "hard-light", label: "Hard Light" },
  { value: "soft-light", label: "Soft Light" },
  { value: "difference", label: "Difference" },
  { value: "exclusion", label: "Exclusion" },
  { value: "hue", label: "Hue" },
  { value: "saturation", label: "Saturation" },
  { value: "color", label: "Color" },
  { value: "luminosity", label: "Luminosity" },
];

export { BLEND_MODES };

let nextLayerId = 1;

function generateLayerId(): string {
  return `layer_${nextLayerId++}`;
}

export class LayerManager {
  layers: DrawingLayer[] = [];
  activeLayerId: string = "";
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    // Create initial layer
    const firstLayer = this.createLayerCanvas("Background");
    this.layers = [firstLayer];
    this.activeLayerId = firstLayer.id;
  }

  private createLayerCanvas(name: string): DrawingLayer {
    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    const id = generateLayerId();
    return {
      id,
      name,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: "source-over",
      canvas,
      alphaLock: false,
      clippingMask: false,
    };
  }

  getActiveLayer(): DrawingLayer | undefined {
    return this.layers.find((l) => l.id === this.activeLayerId);
  }

  getActiveContext(): CanvasRenderingContext2D | null {
    const layer = this.getActiveLayer();
    return layer?.canvas.getContext("2d") ?? null;
  }

  setActiveLayer(id: string): void {
    if (this.layers.some((l) => l.id === id)) {
      this.activeLayerId = id;
    }
  }

  addLayer(name?: string): DrawingLayer {
    const layer = this.createLayerCanvas(name ?? `Layer ${this.layers.length + 1}`);
    // Insert above the active layer
    const activeIdx = this.layers.findIndex((l) => l.id === this.activeLayerId);
    this.layers.splice(activeIdx + 1, 0, layer);
    this.activeLayerId = layer.id;
    return layer;
  }

  deleteLayer(id: string): boolean {
    if (this.layers.length <= 1) return false;
    const idx = this.layers.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    this.layers.splice(idx, 1);
    if (this.activeLayerId === id) {
      this.activeLayerId = this.layers[Math.min(idx, this.layers.length - 1)].id;
    }
    return true;
  }

  duplicateLayer(id: string): DrawingLayer | null {
    const source = this.layers.find((l) => l.id === id);
    if (!source) return null;
    const newLayer = this.createLayerCanvas(`${source.name} Copy`);
    newLayer.opacity = source.opacity;
    newLayer.blendMode = source.blendMode;
    // Copy pixel content
    const ctx = newLayer.canvas.getContext("2d")!;
    ctx.drawImage(source.canvas, 0, 0);
    const idx = this.layers.findIndex((l) => l.id === id);
    this.layers.splice(idx + 1, 0, newLayer);
    this.activeLayerId = newLayer.id;
    return newLayer;
  }

  mergeDown(id: string): boolean {
    const idx = this.layers.findIndex((l) => l.id === id);
    if (idx <= 0) return false;
    const upper = this.layers[idx];
    const lower = this.layers[idx - 1];
    const ctx = lower.canvas.getContext("2d")!;
    ctx.globalAlpha = upper.opacity;
    ctx.globalCompositeOperation = upper.blendMode;
    ctx.drawImage(upper.canvas, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    this.layers.splice(idx, 1);
    this.activeLayerId = lower.id;
    return true;
  }

  moveLayer(id: string, direction: "up" | "down"): void {
    const idx = this.layers.findIndex((l) => l.id === id);
    if (idx === -1) return;
    if (direction === "up" && idx < this.layers.length - 1) {
      [this.layers[idx], this.layers[idx + 1]] = [this.layers[idx + 1], this.layers[idx]];
    } else if (direction === "down" && idx > 0) {
      [this.layers[idx], this.layers[idx - 1]] = [this.layers[idx - 1], this.layers[idx]];
    }
  }

  toggleVisibility(id: string): void {
    const layer = this.layers.find((l) => l.id === id);
    if (layer) layer.visible = !layer.visible;
  }

  toggleLock(id: string): void {
    const layer = this.layers.find((l) => l.id === id);
    if (layer) layer.locked = !layer.locked;
  }

  setOpacity(id: string, opacity: number): void {
    const layer = this.layers.find((l) => l.id === id);
    if (layer) layer.opacity = Math.max(0, Math.min(1, opacity));
  }

  setBlendMode(id: string, mode: BlendMode): void {
    const layer = this.layers.find((l) => l.id === id);
    if (layer) layer.blendMode = mode;
  }

  renameLayer(id: string, name: string): void {
    const layer = this.layers.find((l) => l.id === id);
    if (layer) layer.name = name;
  }

  clearLayer(id: string): void {
    const layer = this.layers.find((l) => l.id === id);
    if (!layer) return;
    const ctx = layer.canvas.getContext("2d")!;
    ctx.clearRect(0, 0, this.width, this.height);
  }

  /** Get a snapshot of a layer's pixel data */
  getLayerSnapshot(id: string): ImageData | null {
    const layer = this.layers.find((l) => l.id === id);
    if (!layer) return null;
    return layer.canvas.getContext("2d")!.getImageData(0, 0, this.width, this.height);
  }

  /** Restore a layer from a snapshot */
  restoreLayerSnapshot(id: string, data: ImageData): void {
    const layer = this.layers.find((l) => l.id === id);
    if (!layer) return;
    layer.canvas.getContext("2d")!.putImageData(data, 0, 0);
  }
}

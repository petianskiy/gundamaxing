// ─── Compositor ──────────────────────────────────────────────────
// Composites all layers onto a display canvas with blend modes.
// Supports dirty-rect optimization for partial updates.

import type { DrawingLayer } from "./layer-manager";
import type { DirtyRect } from "./brush-types";

export class Compositor {
  private displayCanvas: HTMLCanvasElement;
  private displayCtx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private dirty: boolean = true;

  constructor(displayCanvas: HTMLCanvasElement) {
    this.displayCanvas = displayCanvas;
    this.displayCtx = displayCanvas.getContext("2d")!;
    this.width = displayCanvas.width;
    this.height = displayCanvas.height;
  }

  /** Mark the entire canvas as needing a re-composite */
  markDirty(): void {
    this.dirty = true;
  }

  /**
   * Composite all visible layers onto the display canvas.
   * @param layers - Array of layers bottom-to-top
   * @param dirtyRect - Optional partial region to update (for performance)
   */
  composite(layers: DrawingLayer[], dirtyRect?: DirtyRect | null): void {
    const ctx = this.displayCtx;

    if (dirtyRect && !this.dirty) {
      // Partial update: only recomposite the dirty region
      const x = Math.max(0, Math.floor(dirtyRect.x));
      const y = Math.max(0, Math.floor(dirtyRect.y));
      const w = Math.min(this.width - x, Math.ceil(dirtyRect.width) + 2);
      const h = Math.min(this.height - y, Math.ceil(dirtyRect.height) + 2);

      if (w <= 0 || h <= 0) return;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.clearRect(x, y, w, h);

      for (const layer of layers) {
        if (!layer.visible || layer.opacity <= 0) continue;
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode;
        ctx.drawImage(layer.canvas, 0, 0);
      }

      ctx.restore();
      this.dirty = false;
    } else {
      // Full composite
      ctx.clearRect(0, 0, this.width, this.height);

      for (const layer of layers) {
        if (!layer.visible || layer.opacity <= 0) continue;
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode;
        ctx.drawImage(layer.canvas, 0, 0);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      this.dirty = false;
    }
  }

  /**
   * Flatten all layers into a single ImageData.
   * Used for the final export (bounding box crop → PNG).
   */
  flatten(layers: DrawingLayer[]): HTMLCanvasElement {
    const flatCanvas = document.createElement("canvas");
    flatCanvas.width = this.width;
    flatCanvas.height = this.height;
    const ctx = flatCanvas.getContext("2d")!;

    for (const layer of layers) {
      if (!layer.visible || layer.opacity <= 0) continue;
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode;
      ctx.drawImage(layer.canvas, 0, 0);
    }

    return flatCanvas;
  }

  /** Get the display canvas for rendering */
  getDisplayCanvas(): HTMLCanvasElement {
    return this.displayCanvas;
  }
}

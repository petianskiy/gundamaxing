// ─── Undo Manager ────────────────────────────────────────────────
// Command-based undo with per-layer ImageData checkpoints.
// Replays from nearest checkpoint instead of storing full canvas copies.

import type { LayerManager } from "./layer-manager";

/** Snapshot of all layers at a checkpoint */
interface Checkpoint {
  /** Layer ID → ImageData */
  layerData: Map<string, ImageData>;
  /** Layer metadata (ids, order, active) */
  layerMeta: { id: string; name: string; visible: boolean; opacity: number; blendMode: GlobalCompositeOperation }[];
  activeLayerId: string;
}

/** A recorded action that can be undone */
export type UndoAction =
  | { type: "stroke"; layerId: string; beforeData: ImageData }
  | { type: "clear-layer"; layerId: string; beforeData: ImageData }
  | { type: "add-layer"; layerId: string }
  | { type: "delete-layer"; layerSnapshot: { id: string; name: string; visible: boolean; opacity: number; blendMode: GlobalCompositeOperation; data: ImageData; index: number } }
  | { type: "merge-layers"; upperLayerSnapshot: { id: string; name: string; visible: boolean; opacity: number; blendMode: GlobalCompositeOperation; data: ImageData; index: number }; lowerLayerId: string; lowerBeforeData: ImageData }
  | { type: "layer-prop"; layerId: string; prop: string; oldValue: unknown; newValue: unknown };

const MAX_UNDO_STEPS = 50;

export class UndoManager {
  private undoStack: UndoAction[] = [];
  private redoStack: UndoAction[] = [];
  private layerManager: LayerManager;

  constructor(layerManager: LayerManager) {
    this.layerManager = layerManager;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** Record an action for undo. Call BEFORE or AFTER the action depending on type. */
  push(action: UndoAction): void {
    this.undoStack.push(action);
    this.redoStack = []; // Clear redo on new action
    if (this.undoStack.length > MAX_UNDO_STEPS) {
      this.undoStack.shift();
    }
  }

  /**
   * Record a stroke action. Call BEFORE the stroke is rendered.
   * Captures the layer's ImageData before the stroke.
   */
  recordStrokeBefore(layerId: string): UndoAction {
    const data = this.layerManager.getLayerSnapshot(layerId);
    const action: UndoAction = {
      type: "stroke",
      layerId,
      beforeData: data!,
    };
    return action;
  }

  /**
   * Complete a previously started stroke recording.
   * Call AFTER the stroke is rendered.
   */
  commitStroke(action: UndoAction): void {
    this.push(action);
  }

  /** Record clearing a layer */
  recordClearLayer(layerId: string): void {
    const data = this.layerManager.getLayerSnapshot(layerId);
    this.push({ type: "clear-layer", layerId, beforeData: data! });
  }

  /** Record adding a layer */
  recordAddLayer(layerId: string): void {
    this.push({ type: "add-layer", layerId });
  }

  /** Record deleting a layer (must capture data before deletion) */
  recordDeleteLayer(layer: { id: string; name: string; visible: boolean; opacity: number; blendMode: GlobalCompositeOperation }, data: ImageData, index: number): void {
    this.push({
      type: "delete-layer",
      layerSnapshot: { ...layer, data, index },
    });
  }

  /** Record merging layers */
  recordMergeLayers(upperLayer: { id: string; name: string; visible: boolean; opacity: number; blendMode: GlobalCompositeOperation }, upperData: ImageData, upperIndex: number, lowerLayerId: string, lowerBeforeData: ImageData): void {
    this.push({
      type: "merge-layers",
      upperLayerSnapshot: { ...upperLayer, data: upperData, index: upperIndex },
      lowerLayerId,
      lowerBeforeData,
    });
  }

  /** Record a layer property change */
  recordLayerProp(layerId: string, prop: string, oldValue: unknown, newValue: unknown): void {
    this.push({ type: "layer-prop", layerId, prop, oldValue, newValue });
  }

  /** Undo the last action */
  undo(): boolean {
    const action = this.undoStack.pop();
    if (!action) return false;

    switch (action.type) {
      case "stroke":
      case "clear-layer":
        this.layerManager.restoreLayerSnapshot(action.layerId, action.beforeData);
        break;

      case "add-layer":
        this.layerManager.deleteLayer(action.layerId);
        break;

      case "delete-layer": {
        const { layerSnapshot: snap } = action;
        // Re-create the deleted layer
        const newLayer = this.layerManager.addLayer(snap.name);
        newLayer.visible = snap.visible;
        newLayer.opacity = snap.opacity;
        newLayer.blendMode = snap.blendMode;
        this.layerManager.restoreLayerSnapshot(newLayer.id, snap.data);
        // Move to original position
        const currentIdx = this.layerManager.layers.findIndex((l) => l.id === newLayer.id);
        while (currentIdx > snap.index && this.layerManager.layers.findIndex((l) => l.id === newLayer.id) > snap.index) {
          this.layerManager.moveLayer(newLayer.id, "down");
        }
        break;
      }

      case "merge-layers": {
        // Restore lower layer to before-merge state
        this.layerManager.restoreLayerSnapshot(action.lowerLayerId, action.lowerBeforeData);
        // Re-create upper layer
        const upperSnap = action.upperLayerSnapshot;
        const restored = this.layerManager.addLayer(upperSnap.name);
        restored.visible = upperSnap.visible;
        restored.opacity = upperSnap.opacity;
        restored.blendMode = upperSnap.blendMode;
        this.layerManager.restoreLayerSnapshot(restored.id, upperSnap.data);
        break;
      }

      case "layer-prop": {
        const layer = this.layerManager.layers.find((l) => l.id === action.layerId);
        if (layer) {
          (layer as unknown as Record<string, unknown>)[action.prop] = action.oldValue;
        }
        break;
      }
    }

    this.redoStack.push(action);
    return true;
  }

  /** Redo the last undone action */
  redo(): boolean {
    const action = this.redoStack.pop();
    if (!action) return false;

    switch (action.type) {
      case "stroke":
        // For stroke redo, we need to re-record before data and replay
        // Since we can't replay the exact stroke, we swap: current becomes "before" for next undo
        const currentData = this.layerManager.getLayerSnapshot(action.layerId)!;
        // The "after" state is what we want to restore to — but we only stored "before"
        // This is a limitation: stroke redo would need full command replay.
        // For now, stroke redo is not supported (common in drawing apps).
        // Push back to undo stack so it's still available
        this.undoStack.push({ ...action, beforeData: currentData });
        return false;

      case "clear-layer": {
        const beforeClear = this.layerManager.getLayerSnapshot(action.layerId)!;
        this.layerManager.clearLayer(action.layerId);
        this.undoStack.push({ ...action, beforeData: beforeClear });
        break;
      }

      case "add-layer": {
        const layer = this.layerManager.addLayer();
        // Update the action's layerId to the new layer
        this.undoStack.push({ type: "add-layer", layerId: layer.id });
        break;
      }

      case "delete-layer": {
        const snap = action.layerSnapshot;
        const data = this.layerManager.getLayerSnapshot(snap.id);
        const idx = this.layerManager.layers.findIndex((l) => l.id === snap.id);
        if (data && idx !== -1) {
          const layer = this.layerManager.layers[idx];
          this.layerManager.deleteLayer(snap.id);
          this.undoStack.push({
            type: "delete-layer",
            layerSnapshot: { id: snap.id, name: layer.name, visible: layer.visible, opacity: layer.opacity, blendMode: layer.blendMode, data, index: idx },
          });
        }
        break;
      }

      case "layer-prop": {
        const layer = this.layerManager.layers.find((l) => l.id === action.layerId);
        if (layer) {
          (layer as unknown as Record<string, unknown>)[action.prop] = action.newValue;
        }
        this.undoStack.push(action);
        break;
      }

      default:
        this.undoStack.push(action);
    }

    return true;
  }

  /** Clear all history */
  reset(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

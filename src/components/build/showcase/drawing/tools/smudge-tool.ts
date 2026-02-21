// ─── Smudge Tool ────────────────────────────────────────────────
// High-level state management for smudge strokes.
// Wraps the smudge engine functions into a begin/continue/end lifecycle.

import type { SmudgeState } from "../engine/smudge-engine";
import {
  createSmudgeState,
  sampleUnderBrush,
  smudgeDab,
  updateCarriedPixels,
} from "../engine/smudge-engine";

/**
 * Begin a smudge stroke at the given position.
 * Samples the initial pixels under the brush and returns a fresh SmudgeState.
 *
 * @param sourceCtx - Canvas context to sample initial pixels from
 * @param x - Center X of the brush
 * @param y - Center Y of the brush
 * @param size - Brush diameter in pixels
 * @param strength - Smudge strength 0-1 (how much color is carried forward)
 */
export function beginSmudge(
  sourceCtx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  strength: number
): SmudgeState {
  const state = createSmudgeState(strength);

  // Sample the initial pixels at the stroke start position
  const initialSample = sampleUnderBrush(sourceCtx, x, y, size);
  state.carriedPixels = initialSample;
  state.hasSample = true;

  return state;
}

/**
 * Continue a smudge stroke to a new position.
 * Applies a smudge dab at the position, then samples the result
 * and updates the carried pixels for the next dab.
 *
 * @param targetCtx - Canvas context to paint onto and sample from
 * @param state - Current smudge state (mutated in place)
 * @param x - Center X of the brush
 * @param y - Center Y of the brush
 * @param size - Brush diameter in pixels
 * @param opacity - Dab opacity 0-1
 */
export function continueSmudge(
  targetCtx: CanvasRenderingContext2D,
  state: SmudgeState,
  x: number,
  y: number,
  size: number,
  opacity: number
): void {
  if (!state.hasSample) return;

  // 1. Draw carried pixels at the new position
  smudgeDab(targetCtx, state, x, y, size, opacity);

  // 2. Sample what's now under the brush (includes the dab we just drew)
  const newSample = sampleUnderBrush(targetCtx, x, y, size);

  // 3. Blend the new sample into carried pixels.
  //    Higher strength = keep more of the old carried color (less pickup).
  //    blendRatio is how much of the *new* sample to mix in.
  const blendRatio = 1 - state.strength;
  updateCarriedPixels(state, newSample, blendRatio);
}

/**
 * End a smudge stroke. Clears the smudge state so it can be
 * garbage collected.
 *
 * @param state - Smudge state to clear
 */
export function endSmudge(state: SmudgeState): void {
  state.carriedPixels = null;
  state.hasSample = false;
}

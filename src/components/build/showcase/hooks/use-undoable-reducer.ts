import { useReducer } from "react";
import type { ShowcaseLayout } from "@/lib/types";

const MAX_HISTORY = 50;

// Actions that create an undo snapshot immediately
const INSTANT_TRACKED = new Set([
  "ADD_ELEMENT",
  "UPDATE_ELEMENT",
  "DELETE_ELEMENT",
  "SET_BACKGROUND",
  "SET_ASPECT_RATIO",
  "REORDER_Z",
]);

// Actions that are batched (tracked only via BEGIN_BATCH/END_BATCH)
const BATCHED_ACTIONS = new Set([
  "MOVE_ELEMENT",
  "RESIZE_ELEMENT",
]);

type AnyAction = { type: string; [key: string]: unknown };

interface UndoState {
  past: ShowcaseLayout[];
  present: ShowcaseLayout;
  future: ShowcaseLayout[];
  batchSnapshot: ShowcaseLayout | null;
}

function undoReducer(
  innerReducer: (state: ShowcaseLayout, action: AnyAction) => ShowcaseLayout
) {
  return (state: UndoState, action: AnyAction): UndoState => {
    if (action.type === "UNDO") {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        batchSnapshot: null,
      };
    }

    if (action.type === "REDO") {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
        batchSnapshot: null,
      };
    }

    if (action.type === "SET_LAYOUT") {
      return {
        past: [],
        present: innerReducer(state.present, action),
        future: [],
        batchSnapshot: null,
      };
    }

    // APPLY_TEMPLATE: same as SET_LAYOUT but preserves undo history
    if (action.type === "APPLY_TEMPLATE") {
      const newPresent = innerReducer(state.present, action);
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: newPresent,
        future: [],
        batchSnapshot: null,
      };
    }

    // BEGIN_BATCH: snapshot current state before a drag/resize starts
    if (action.type === "BEGIN_BATCH") {
      return { ...state, batchSnapshot: state.present };
    }

    // END_BATCH: commit the batch snapshot to history
    if (action.type === "END_BATCH") {
      if (state.batchSnapshot && state.batchSnapshot !== state.present) {
        return {
          past: [...state.past, state.batchSnapshot].slice(-MAX_HISTORY),
          present: state.present,
          future: [],
          batchSnapshot: null,
        };
      }
      return { ...state, batchSnapshot: null };
    }

    const newPresent = innerReducer(state.present, action);
    if (newPresent === state.present) return state;

    // Batched actions (move/resize) update present without adding to history
    // History will be committed when END_BATCH fires
    if (BATCHED_ACTIONS.has(action.type)) {
      return { ...state, present: newPresent };
    }

    // Instant-tracked actions push to history immediately
    if (INSTANT_TRACKED.has(action.type)) {
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: newPresent,
        future: [],
        batchSnapshot: null,
      };
    }

    // Non-tracked actions update present without history
    return { ...state, present: newPresent };
  };
}

export function useUndoableReducer(
  reducer: (state: ShowcaseLayout, action: AnyAction) => ShowcaseLayout,
  initialState: ShowcaseLayout
) {
  const [undoState, dispatch] = useReducer(undoReducer(reducer), {
    past: [],
    present: initialState,
    future: [],
    batchSnapshot: null,
  });

  return {
    state: undoState.present,
    dispatch,
    canUndo: undoState.past.length > 0,
    canRedo: undoState.future.length > 0,
  };
}

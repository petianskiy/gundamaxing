"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShowcaseElement } from "./showcase-element";
import { ShowcaseDock } from "./showcase-dock";
import { ImagePickerPanel } from "./panels/image-picker-panel";
import { BackgroundPicker } from "./panels/background-picker";
import { ElementPropsPanel } from "./panels/element-props-panel";
import { LayersPanel } from "./panels/layers-panel";
import { EffectsPanel } from "./panels/effects-panel";
import { ShapePickerPanel } from "./panels/shape-picker-panel";
import { TemplatePickerPanel } from "./panels/template-picker-panel";
import { DrawingOverlay } from "./drawing/drawing-overlay";
import type { DrawingOverlayHandle } from "./drawing/drawing-overlay";
import { useUndoableReducer } from "./hooks/use-undoable-reducer";
import { migrateShowcaseLayout } from "@/lib/validations/showcase";
import { updateShowcaseLayout } from "@/lib/actions/build";
import { useR2Upload } from "@/lib/upload/use-r2-upload";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { isWebGLPreset } from "./backgrounds";
import type {
  Build,
  BuildImage,
  ShowcaseLayout,
  ShowcasePage as ShowcasePageType,
  ShowcasePageBackground,
  ShowcaseElement as ShowcaseElementType,
  ShowcaseImageElement,
  ShowcaseTextElement,
  ShowcaseMetadataElement,
  ShowcaseEffectElement,
  ShowcaseVideoElement,
  ShowcaseShapeElement,
} from "@/lib/types";

function normalizePages(layout: ShowcaseLayout): ShowcasePageType[] {
  if (layout.pages && layout.pages.length > 0) return layout.pages;
  return [{ id: "page-1", elements: layout.elements }];
}

function generatePageId(): string {
  return "page-" + Math.random().toString(36).substring(2, 10);
}

// ─── WebGL Background Components (lazy, SSR-safe) ──────────────

const Grainient = dynamic(
  () => import("./backgrounds/grainient").then((m) => m.Grainient),
  { ssr: false },
);

// ─── Preset Background Styles ───────────────────────────────────

const PRESET_STYLES: Record<string, React.CSSProperties> = {
  "preset:grid": {
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
  },
};

const MAX_IMAGES = 50;
const MAX_VIDEOS = 2;
const MAX_VIDEO_DURATION_SECONDS = 60;


// ─── State Management ───────────────────────────────────────────

type Action =
  | { type: "ADD_ELEMENT"; element: ShowcaseElementType }
  | { type: "MOVE_ELEMENT"; id: string; x: number; y: number }
  | { type: "RESIZE_ELEMENT"; id: string; width: number; height: number }
  | { type: "UPDATE_ELEMENT"; id: string; updates: Partial<ShowcaseElementType> }
  | { type: "DELETE_ELEMENT"; id: string }
  | { type: "SET_BACKGROUND"; backgroundImageUrl?: string | null; backgroundColor?: string | null; backgroundOpacity?: number; backgroundBlur?: number; backgroundConfig?: Record<string, unknown> | null; overlayOpacity?: number }
  | { type: "SET_ASPECT_RATIO"; aspectRatio: string }
  | { type: "REORDER_Z"; id: string; direction: "up" | "down" | "top" | "bottom" }
  | { type: "SET_LAYOUT"; layout: ShowcaseLayout }
  | { type: "UNDO" }
  | { type: "REDO" };

function layoutReducer(state: ShowcaseLayout, action: Action): ShowcaseLayout {
  switch (action.type) {
    case "ADD_ELEMENT":
      return { ...state, elements: [...state.elements, action.element] };

    case "MOVE_ELEMENT":
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.id ? { ...el, x: action.x, y: action.y } : el
        ),
      };

    case "RESIZE_ELEMENT":
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.id ? { ...el, width: action.width, height: action.height } : el
        ),
      };

    case "UPDATE_ELEMENT":
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.id ? { ...el, ...action.updates } as ShowcaseElementType : el
        ),
      };

    case "DELETE_ELEMENT":
      return { ...state, elements: state.elements.filter((el) => el.id !== action.id) };

    case "SET_BACKGROUND":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          backgroundImageUrl: action.backgroundImageUrl !== undefined ? action.backgroundImageUrl : state.canvas.backgroundImageUrl,
          backgroundColor: action.backgroundColor !== undefined ? action.backgroundColor : state.canvas.backgroundColor,
          backgroundOpacity: action.backgroundOpacity ?? state.canvas.backgroundOpacity,
          backgroundBlur: action.backgroundBlur ?? state.canvas.backgroundBlur,
          backgroundConfig: action.backgroundConfig !== undefined ? action.backgroundConfig : state.canvas.backgroundConfig,
          overlayOpacity: action.overlayOpacity ?? state.canvas.overlayOpacity,
        },
      };

    case "SET_ASPECT_RATIO":
      return {
        ...state,
        canvas: { ...state.canvas, aspectRatio: action.aspectRatio },
      };

    case "REORDER_Z": {
      const sorted = [...state.elements].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((el) => el.id === action.id);
      if (idx === -1) return state;

      let newZIndex = sorted[idx].zIndex;
      if (action.direction === "up" && idx < sorted.length - 1) {
        newZIndex = sorted[idx + 1].zIndex + 1;
      } else if (action.direction === "down" && idx > 0) {
        newZIndex = sorted[idx - 1].zIndex - 1;
      } else if (action.direction === "top") {
        newZIndex = Math.max(...sorted.map((el) => el.zIndex)) + 1;
      } else if (action.direction === "bottom") {
        newZIndex = Math.min(...sorted.map((el) => el.zIndex)) - 1;
      }

      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.id ? { ...el, zIndex: newZIndex } : el
        ),
      };
    }

    case "SET_LAYOUT":
      return action.layout;

    default:
      return state;
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ─── Editor Component ───────────────────────────────────────────

interface ShowcaseEditorProps {
  build: Build;
  initialLayout: ShowcaseLayout;
  onExit: () => void;
  userLevel?: number;
}

export function ShowcaseEditor({ build, initialLayout, onExit, userLevel = 1 }: ShowcaseEditorProps) {
  // Migrate old layouts (fontSize enum→number, fontWeight→bold, etc.)
  const safeInitial = migrateShowcaseLayout(initialLayout);

  const { state: layout, dispatch, canUndo, canRedo } = useUndoableReducer(
    layoutReducer as (state: ShowcaseLayout, action: { type: string; [key: string]: unknown }) => ShowcaseLayout,
    safeInitial
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"images" | "background" | "layers" | "effects" | "shapes" | "templates" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [buildImages, setBuildImages] = useState<BuildImage[]>(build.images);

  // Multi-page state
  const [pagesState, setPagesState] = useState<ShowcasePageType[]>(() => normalizePages(safeInitial));
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentPageBg, setCurrentPageBg] = useState<ShowcasePageBackground | undefined>(
    () => normalizePages(safeInitial)[0]?.background
  );
  const [pageContextMenu, setPageContextMenu] = useState<{ index: number; x: number; y: number } | null>(null);

  // Group state: maps elementId → groupId (local only, not persisted)
  const [groups, setGroups] = useState<Record<string, string>>({});
  const canvasRef = useRef<HTMLDivElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const clipboardRef = useRef<ShowcaseElementType[]>([]);
  const drawingRef = useRef<DrawingOverlayHandle>(null);

  // Marquee (rubber-band) selection state
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const marqueeRef = useRef<typeof marquee>(null);
  const marqueeThreshold = 4; // pixels before marquee activates

  // Upload hooks
  const { upload: uploadVideo, isUploading: isVideoUploading } = useR2Upload({ type: "video" });
  const { upload: uploadImage } = useR2Upload({ type: "image" });

  // Drag state — stored in refs for smooth pointer tracking
  const dragRef = useRef<{
    elementIds: string[];
    startX: number;
    startY: number;
    elStarts: Record<string, { x: number; y: number }>;
  } | null>(null);

  // Resize state
  const resizeRef = useRef<{
    elementId: string;
    corner: "tl" | "tr" | "bl" | "br";
    startX: number;
    startY: number;
    elStartX: number;
    elStartY: number;
    elStartW: number;
    elStartH: number;
  } | null>(null);

  const selectedElement = selectedIds.length === 1
    ? layout.elements.find((el) => el.id === selectedIds[0]) ?? null
    : null;
  const sortedElements = [...layout.elements].sort((a, b) => a.zIndex - b.zIndex);

  // ─── Content counts for limits ─────────────────────────────────
  const imageCount = layout.elements.filter((el) => el.type === "image").length;
  const videoCount = layout.elements.filter((el) => el.type === "video").length;

  // ─── Pointer-based drag, resize & marquee ─────────────────────

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();

      // Handle marquee selection
      if (marqueeRef.current) {
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const updated = { ...marqueeRef.current, currentX: x, currentY: y };
        marqueeRef.current = updated;
        // Only show visual marquee after threshold
        const dx = Math.abs(e.clientX - rect.left - (marqueeRef.current.startX / 100) * rect.width);
        const dy = Math.abs(e.clientY - rect.top - (marqueeRef.current.startY / 100) * rect.height);
        if (dx > marqueeThreshold || dy > marqueeThreshold) {
          setMarquee(updated);
        }
        return;
      }

      // Handle drag (moves all selected elements together)
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        const deltaXPct = (dx / rect.width) * 100;
        const deltaYPct = (dy / rect.height) * 100;
        for (const elId of dragRef.current.elementIds) {
          const el = layout.elements.find((el) => el.id === elId);
          const start = dragRef.current.elStarts[elId];
          if (!el || !start) continue;
          const newX = Math.max(-el.width * 0.5, Math.min(100 - el.width * 0.5, start.x + deltaXPct));
          const newY = Math.max(-el.height * 0.5, Math.min(100 - el.height * 0.5, start.y + deltaYPct));
          dispatch({ type: "MOVE_ELEMENT", id: elId, x: newX, y: newY });
        }
        return;
      }

      // Handle resize
      if (resizeRef.current) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        const dxPct = (dx / rect.width) * 100;
        const dyPct = (dy / rect.height) * 100;
        const corner = resizeRef.current.corner;

        let newX = resizeRef.current.elStartX;
        let newY = resizeRef.current.elStartY;
        let newW = resizeRef.current.elStartW;
        let newH = resizeRef.current.elStartH;

        if (corner === "br") {
          newW = Math.max(5, resizeRef.current.elStartW + dxPct);
          newH = Math.max(5, resizeRef.current.elStartH + dyPct);
        } else if (corner === "bl") {
          newW = Math.max(5, resizeRef.current.elStartW - dxPct);
          newH = Math.max(5, resizeRef.current.elStartH + dyPct);
          newX = resizeRef.current.elStartX + (resizeRef.current.elStartW - newW);
        } else if (corner === "tr") {
          newW = Math.max(5, resizeRef.current.elStartW + dxPct);
          newH = Math.max(5, resizeRef.current.elStartH - dyPct);
          newY = resizeRef.current.elStartY + (resizeRef.current.elStartH - newH);
        } else if (corner === "tl") {
          newW = Math.max(5, resizeRef.current.elStartW - dxPct);
          newH = Math.max(5, resizeRef.current.elStartH - dyPct);
          newX = resizeRef.current.elStartX + (resizeRef.current.elStartW - newW);
          newY = resizeRef.current.elStartY + (resizeRef.current.elStartH - newH);
        }

        dispatch({ type: "MOVE_ELEMENT", id: resizeRef.current.elementId, x: newX, y: newY });
        dispatch({ type: "RESIZE_ELEMENT", id: resizeRef.current.elementId, width: newW, height: newH });
        return;
      }
    },
    [layout.elements, dispatch]
  );

  const handlePointerUp = useCallback(() => {
    // Finish marquee selection
    if (marqueeRef.current && marquee) {
      const m = marqueeRef.current;
      const minX = Math.min(m.startX, m.currentX);
      const maxX = Math.max(m.startX, m.currentX);
      const minY = Math.min(m.startY, m.currentY);
      const maxY = Math.max(m.startY, m.currentY);
      // Select elements whose center is inside the marquee
      const hits = layout.elements.filter((el) => {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
      });
      if (hits.length > 0) {
        setSelectedIds(hits.map((el) => el.id));
      }
      marqueeRef.current = null;
      setMarquee(null);
      return;
    }
    marqueeRef.current = null;
    setMarquee(null);

    if (dragRef.current || resizeRef.current) {
      dispatch({ type: "END_BATCH" });
    }
    dragRef.current = null;
    resizeRef.current = null;
  }, [dispatch, marquee, layout.elements]);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const startDrag = useCallback(
    (elementId: string, e: React.PointerEvent) => {
      // Don't start drag if editing text
      if (editingTextId === elementId) return;
      e.preventDefault();
      e.stopPropagation();
      const el = layout.elements.find((el) => el.id === elementId);
      if (!el) return;

      // Build drag set: if element is in selection, use selection; if grouped, use group; else just this one
      let dragIds: string[];
      if (selectedIds.includes(elementId)) {
        dragIds = selectedIds;
      } else {
        const groupId = groups[elementId];
        if (groupId) {
          dragIds = layout.elements.filter((el) => groups[el.id] === groupId).map((el) => el.id);
        } else {
          dragIds = [elementId];
        }
      }
      const elStarts: Record<string, { x: number; y: number }> = {};
      for (const id of dragIds) {
        const found = layout.elements.find((el) => el.id === id);
        if (found) elStarts[id] = { x: found.x, y: found.y };
      }

      dispatch({ type: "BEGIN_BATCH" });
      dragRef.current = {
        elementIds: dragIds,
        startX: e.clientX,
        startY: e.clientY,
        elStarts,
      };
      if (!selectedIds.includes(elementId)) {
        setSelectedIds(dragIds);
      }
    },
    [layout.elements, editingTextId, dispatch, selectedIds, groups]
  );

  const startResize = useCallback(
    (elementId: string, corner: "tl" | "tr" | "bl" | "br", e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const el = layout.elements.find((el) => el.id === elementId);
      if (!el) return;
      dispatch({ type: "BEGIN_BATCH" });
      resizeRef.current = {
        elementId,
        corner,
        startX: e.clientX,
        startY: e.clientY,
        elStartX: el.x,
        elStartY: el.y,
        elStartW: el.width,
        elStartH: el.height,
      };
    },
    [layout.elements, dispatch]
  );

  // ─── Keyboard shortcuts ───────────────────────────────────────

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isContentEditable = (document.activeElement as HTMLElement)?.isContentEditable;
      const isInput = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "SELECT";

      // Undo/Redo — skip when drawing overlay is active (it has its own handler)
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        if (showDrawing) return;
        e.preventDefault();
        dispatch({ type: "UNDO" });
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        if (showDrawing) return;
        e.preventDefault();
        dispatch({ type: "REDO" });
        return;
      }

      if (e.key === "Escape") {
        if (editingTextId) {
          // Save text content before exiting edit mode
          const editingEl = canvasRef.current?.querySelector(`[data-element-wrapper] [contenteditable="true"]`) as HTMLElement | null;
          if (editingEl) {
            const newContent = editingEl.textContent || "";
            dispatch({ type: "UPDATE_ELEMENT", id: editingTextId, updates: { content: newContent } });
          }
          setEditingTextId(null);
          return;
        }
        if (activePanel) {
          setActivePanel(null);
        } else {
          setSelectedIds([]);
        }
      }

      // Don't handle below shortcuts when editing text or in input fields
      if (isContentEditable || isInput) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 0) {
          for (const id of selectedIds) {
            dispatch({ type: "DELETE_ELEMENT", id });
          }
          setSelectedIds([]);
          setEditingTextId(null);
        }
      }

      // Ctrl/Cmd+A to select all
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        setSelectedIds(layout.elements.map((el) => el.id));
      }

      // Ctrl/Cmd+C to copy selected elements
      if ((e.metaKey || e.ctrlKey) && e.key === "c" && selectedIds.length > 0) {
        e.preventDefault();
        const copied = layout.elements.filter((el) => selectedIds.includes(el.id));
        clipboardRef.current = copied;
      }

      // Ctrl/Cmd+V to paste copied elements
      if ((e.metaKey || e.ctrlKey) && e.key === "v" && clipboardRef.current.length > 0) {
        e.preventDefault();
        const newIds: string[] = [];
        const maxZ = layout.elements.length > 0 ? Math.max(...layout.elements.map((el) => el.zIndex)) : 0;
        clipboardRef.current.forEach((el, i) => {
          const newId = crypto.randomUUID();
          newIds.push(newId);
          const pasted: ShowcaseElementType = {
            ...el,
            id: newId,
            x: el.x + 2,
            y: el.y + 2,
            zIndex: maxZ + 1 + i,
          };
          dispatch({ type: "ADD_ELEMENT", element: pasted });
        });
        setSelectedIds(newIds);
      }

      // Arrow keys to move all selected elements (only when not editing text)
      if (selectedIds.length > 0 && !editingTextId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        for (const id of selectedIds) {
          const el = layout.elements.find((el) => el.id === id);
          if (!el) continue;
          let newX = el.x;
          let newY = el.y;
          if (e.key === "ArrowLeft") newX = el.x - step;
          if (e.key === "ArrowRight") newX = el.x + step;
          if (e.key === "ArrowUp") newY = el.y - step;
          if (e.key === "ArrowDown") newY = el.y + step;
          dispatch({ type: "MOVE_ELEMENT", id, x: newX, y: newY });
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, editingTextId, activePanel, layout.elements, dispatch, showDrawing]);

  // ─── Add element helpers ──────────────────────────────────────

  const addImage = useCallback(
    (imageId: string, imageUrl: string) => {
      const currentImageCount = layout.elements.filter((el) => el.type === "image").length;
      if (currentImageCount >= MAX_IMAGES) {
        toast.error(`Maximum ${MAX_IMAGES} images allowed per build`);
        return;
      }
      const maxZ = layout.elements.length > 0 ? Math.max(...layout.elements.map((e) => e.zIndex)) : 0;
      const element: ShowcaseImageElement = {
        id: generateId(),
        type: "image",
        x: 10,
        y: 10,
        width: 40,
        height: 30,
        zIndex: maxZ + 1,
        rotation: 0,
        imageId,
        imageUrl,
        objectFit: "cover",
        borderRadius: 8,
        shadow: true,
        caption: null,
      };
      dispatch({ type: "ADD_ELEMENT", element });
      setActivePanel(null);
    },
    [layout.elements, dispatch]
  );

  const addText = useCallback(() => {
    const maxZ = layout.elements.length > 0 ? Math.max(...layout.elements.map((e) => e.zIndex)) : 0;
    const element: ShowcaseTextElement = {
      id: generateId(),
      type: "text",
      x: 30,
      y: 40,
      width: 40,
      height: 6,
      zIndex: maxZ + 1,
      rotation: 0,
      content: "Double-click to edit...",
      fontSize: 18,
      fontFamily: "geist",
      color: "#fafafa",
      textAlign: "center",
      backgroundColor: null,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      gradient: false,
      gradientColors: ["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"],
      gradientSpeed: 2,
      fuzzy: false,
      fuzzyIntensity: 0.18,
      fuzzyHoverIntensity: 0.5,
      fuzzyFuzzRange: 0.08,
      fuzzyDirection: "horizontal",
      fuzzyTransitionDuration: 0.15,
      fuzzyLetterSpacing: 0,
      fuzzyEnableHover: true,
      fuzzyClickEffect: false,
      fuzzyGlitchMode: false,
      fuzzyGlitchInterval: 5,
      fuzzyGlitchDuration: 0.3,
    };
    dispatch({ type: "ADD_ELEMENT", element });
    setSelectedIds([element.id]);
  }, [layout.elements, dispatch]);

  const addMetadata = useCallback(() => {
    const maxZ = layout.elements.length > 0 ? Math.max(...layout.elements.map((e) => e.zIndex)) : 0;
    const element: ShowcaseMetadataElement = {
      id: generateId(),
      type: "metadata",
      x: 5,
      y: 70,
      width: 35,
      height: 25,
      zIndex: maxZ + 1,
      rotation: 0,
      variant: "compact",
    };
    dispatch({ type: "ADD_ELEMENT", element });
    setSelectedIds([element.id]);
  }, [layout.elements, dispatch]);

  const addEffect = useCallback((effectType: string, defaults: Record<string, unknown>) => {
    const maxZ = layout.elements.length > 0 ? Math.max(...layout.elements.map((e) => e.zIndex)) : 0;
    const element: ShowcaseEffectElement = {
      id: generateId(),
      type: "effect",
      x: 15,
      y: 15,
      width: 70,
      height: 50,
      zIndex: maxZ + 1,
      rotation: 0,
      effectType: effectType as "electric",
      color: (defaults.color as string) ?? "#7df9ff",
      speed: (defaults.speed as number) ?? 1,
      chaos: (defaults.chaos as number) ?? 0.12,
      borderRadius: (defaults.borderRadius as number) ?? 16,
    };
    dispatch({ type: "ADD_ELEMENT", element });
    setSelectedIds([element.id]);
    setActivePanel(null);
  }, [layout.elements, dispatch]);

  const handleVideoFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so same file can be selected again
    e.target.value = "";
    if (!file) return;

    // Check video limit
    const currentVideoCount = layout.elements.filter((el) => el.type === "video").length;
    if (currentVideoCount >= MAX_VIDEOS) {
      toast.error(`Maximum ${MAX_VIDEOS} videos allowed per build`);
      return;
    }

    // Check video duration (< 1 minute)
    try {
      const duration = await new Promise<number>((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          resolve(video.duration);
          URL.revokeObjectURL(video.src);
        };
        video.onerror = () => {
          URL.revokeObjectURL(video.src);
          reject(new Error("Could not read video metadata"));
        };
        video.src = URL.createObjectURL(file);
      });
      if (duration > MAX_VIDEO_DURATION_SECONDS) {
        toast.error(`Video must be under ${MAX_VIDEO_DURATION_SECONDS} seconds (this video is ${Math.round(duration)}s)`);
        return;
      }
    } catch {
      // If we can't read metadata, allow upload but warn
      toast.warning("Could not verify video duration — uploading anyway");
    }

    toast.info("Uploading video...");
    try {
      const res = await uploadVideo(file);
      if (!res) {
        toast.error("Video upload failed — no response");
        return;
      }
      const videoUrl = res.url;
      if (!videoUrl) {
        toast.error("Video upload failed — no URL returned");
        return;
      }
      const maxZ = layout.elements.length > 0 ? Math.max(...layout.elements.map((e) => e.zIndex)) : 0;
      const element: ShowcaseVideoElement = {
        id: generateId(),
        type: "video",
        x: 10,
        y: 10,
        width: 50,
        height: 35,
        zIndex: maxZ + 1,
        rotation: 0,
        url: videoUrl,
        objectFit: "cover",
        muted: true,
        loop: true,
        borderRadius: 8,
      };
      dispatch({ type: "ADD_ELEMENT", element });
      setSelectedIds([element.id]);
      toast.success("Video added!");
    } catch (err) {
      console.error("Video upload error:", err);
      toast.error("Video upload failed");
    }
  }, [layout.elements, dispatch, uploadVideo]);

  const addVideo = useCallback(() => {
    videoInputRef.current?.click();
  }, []);

  const addShape = useCallback((shape: ShowcaseShapeElement) => {
    const maxZ = layout.elements.length > 0 ? Math.max(...layout.elements.map((e) => e.zIndex)) : 0;
    const element: ShowcaseShapeElement = {
      ...shape,
      zIndex: maxZ + 1,
    };
    dispatch({ type: "ADD_ELEMENT", element });
    setSelectedIds([element.id]);
    setActivePanel(null);
  }, [layout.elements, dispatch]);

  const applyTemplate = useCallback((elements: ShowcaseElementType[]) => {
    // Replace current page elements with template elements
    dispatch({ type: "SET_LAYOUT", layout: { ...layout, elements } });
    setSelectedIds([]);
    setActivePanel(null);
  }, [layout, dispatch]);

  // ─── Image management callbacks ───────────────────────────────

  const handleImageUploaded = useCallback((newImage: { id: string; url: string }) => {
    setBuildImages((prev) => [...prev, { id: newImage.id, url: newImage.url, alt: "Build image", isPrimary: false, order: prev.length }]);
  }, []);

  const handleImageDeleted = useCallback((imageId: string) => {
    setBuildImages((prev) => prev.filter((img) => img.id !== imageId));
    const elementsToRemove = layout.elements.filter(
      (el) => el.type === "image" && el.imageId === imageId
    );
    for (const el of elementsToRemove) {
      dispatch({ type: "DELETE_ELEMENT", id: el.id });
    }
  }, [layout.elements, dispatch]);

  // ─── Drawing complete callback ────────────────────────────────

  const handleDrawingComplete = useCallback(async (blob: Blob, bounds: { x: number; y: number; width: number; height: number }) => {
    setShowDrawing(false);
    toast.info("Uploading drawing...");
    try {
      const file = new File([blob], `drawing-${Date.now()}.png`, { type: "image/png" });
      const res = await uploadImage(file);
      if (!res) {
        toast.error("Drawing upload failed");
        return;
      }

      // Link the uploaded image to the build in the DB
      const fd = new FormData();
      fd.append("buildId", build.id);
      fd.append("url", res.url);
      const { addBuildImage } = await import("@/lib/actions/build");
      const addResult = await addBuildImage(fd);
      const dbImageId = (addResult && "image" in addResult && addResult.image)
        ? (addResult.image as { id: string }).id
        : generateId();

      if (addResult && "image" in addResult && addResult.image) {
        setBuildImages((prev) => [...prev, { id: dbImageId, url: res.url, alt: "Drawing", isPrimary: false, order: prev.length }]);
      }

      const maxZ = layout.elements.length > 0 ? Math.max(...layout.elements.map((e) => e.zIndex)) : 0;
      const element: ShowcaseImageElement = {
        id: generateId(),
        type: "image",
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        zIndex: maxZ + 1,
        rotation: 0,
        imageId: dbImageId,
        imageUrl: res.url,
        objectFit: "contain",
        borderRadius: 0,
        shadow: false,
        caption: null,
      };
      dispatch({ type: "ADD_ELEMENT", element });
      setSelectedIds([element.id]);
      toast.success("Drawing added!");
    } catch {
      toast.error("Failed to upload drawing");
    }
  }, [uploadImage, layout.elements, dispatch, build.id]);

  // ─── Save ─────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    // If drawing overlay is open, flush it first (triggers drawing save via onComplete)
    if (showDrawing && drawingRef.current) {
      drawingRef.current.flush();
      // Small delay to let the drawing completion handler finish uploading
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsSaving(true);
    // Build full layout with all pages (merge current page's live elements + background)
    const allPages = pagesState.map((page, i) =>
      i === currentPageIndex
        ? { ...page, elements: layout.elements, background: currentPageBg }
        : page
    );
    const fullLayout: ShowcaseLayout = {
      ...layout,
      elements: allPages[0]?.elements ?? [],
      pages: allPages,
    };
    const formData = new FormData();
    formData.set("buildId", build.id);
    formData.set("showcaseLayout", JSON.stringify(fullLayout));
    const result = await updateShowcaseLayout(formData);
    setIsSaving(false);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Showcase saved!");
      onExit();
    }
  }, [build.id, layout, pagesState, currentPageIndex, onExit, showDrawing, currentPageBg]);

  // ─── Delete selected element ──────────────────────────────────

  const deleteSelected = useCallback(() => {
    if (selectedIds.length > 0) {
      for (const id of selectedIds) {
        dispatch({ type: "DELETE_ELEMENT", id });
      }
      setSelectedIds([]);
      setEditingTextId(null);
    }
  }, [selectedIds, dispatch]);

  // ─── Group / Ungroup ───────────────────────────────────────────

  const handleGroup = useCallback(() => {
    if (selectedIds.length < 2) return;
    const groupId = generateId();
    setGroups((prev) => {
      const next = { ...prev };
      for (const id of selectedIds) {
        next[id] = groupId;
      }
      return next;
    });
  }, [selectedIds]);

  const handleUngroup = useCallback(() => {
    setGroups((prev) => {
      const next = { ...prev };
      for (const id of selectedIds) {
        delete next[id];
      }
      return next;
    });
  }, [selectedIds]);

  const selectedHaveGroup = selectedIds.some((id) => groups[id]);

  // ─── Multi-page operations ──────────────────────────────────

  const switchToPage = useCallback((newIndex: number) => {
    if (newIndex === currentPageIndex) return;
    // Save current page's elements and background back to pagesState
    setPagesState((prev) => {
      const updated = [...prev];
      updated[currentPageIndex] = { ...updated[currentPageIndex], elements: layout.elements, background: currentPageBg };
      return updated;
    });
    // Load new page's elements into the reducer
    const targetPage = pagesState[newIndex];
    if (targetPage) {
      dispatch({ type: "SET_LAYOUT", layout: { ...layout, elements: targetPage.elements } });
    }
    // Load new page's background
    setCurrentPageBg(pagesState[newIndex]?.background);
    setCurrentPageIndex(newIndex);
    setSelectedIds([]);
    setEditingTextId(null);
  }, [currentPageIndex, layout, pagesState, dispatch, currentPageBg]);

  // Level-gated page limit: L5 = 2 pages, below L5 = 1 page
  const maxPages = userLevel >= 5 ? 2 : 1;

  const addPage = useCallback(() => {
    if (pagesState.length >= maxPages) {
      toast.error(
        maxPages === 1
          ? "Reach Level 5 to unlock multiple showcase pages!"
          : `Maximum ${maxPages} pages allowed.`
      );
      return;
    }
    // Save current page first
    setPagesState((prev) => {
      const updated = [...prev];
      updated[currentPageIndex] = { ...updated[currentPageIndex], elements: layout.elements, background: currentPageBg };
      const newPage: ShowcasePageType = { id: generatePageId(), elements: [] };
      return [...updated, newPage];
    });
    // Switch to the new page
    const newIndex = pagesState.length;
    dispatch({ type: "SET_LAYOUT", layout: { ...layout, elements: [] } });
    setCurrentPageBg(undefined);
    setCurrentPageIndex(newIndex);
    setSelectedIds([]);
    setEditingTextId(null);
  }, [currentPageIndex, layout, pagesState.length, dispatch, currentPageBg, maxPages]);

  const duplicatePage = useCallback((index: number) => {
    const sourcePage = index === currentPageIndex
      ? { ...pagesState[index], elements: layout.elements, background: currentPageBg }
      : pagesState[index];
    if (!sourcePage) return;
    // Deep clone elements with new IDs
    const clonedElements = sourcePage.elements.map((el) => ({
      ...el,
      id: generateId(),
    }));
    const newPage: ShowcasePageType = { id: generatePageId(), elements: clonedElements, background: sourcePage.background ? { ...sourcePage.background } : undefined };
    setPagesState((prev) => {
      const updated = [...prev];
      updated[currentPageIndex] = { ...updated[currentPageIndex], elements: layout.elements, background: currentPageBg };
      const result = [...updated];
      result.splice(index + 1, 0, newPage);
      return result;
    });
    // Switch to duplicated page
    const newIndex = index + 1;
    dispatch({ type: "SET_LAYOUT", layout: { ...layout, elements: clonedElements } });
    setCurrentPageBg(newPage.background);
    setCurrentPageIndex(newIndex);
    setSelectedIds([]);
    setEditingTextId(null);
    setPageContextMenu(null);
  }, [currentPageIndex, layout, pagesState, dispatch, currentPageBg]);

  const deletePage = useCallback((index: number) => {
    if (pagesState.length <= 1) {
      toast.error("Cannot delete the only page");
      return;
    }
    if (!confirm("Delete this page? This cannot be undone.")) return;
    setPagesState((prev) => {
      const updated = [...prev];
      updated[currentPageIndex] = { ...updated[currentPageIndex], elements: layout.elements, background: currentPageBg };
      updated.splice(index, 1);
      return updated;
    });
    // Adjust current page index
    let newIndex = currentPageIndex;
    if (index <= currentPageIndex) {
      newIndex = Math.max(0, currentPageIndex - 1);
    }
    const remainingPages = [...pagesState];
    remainingPages[currentPageIndex] = { ...remainingPages[currentPageIndex], elements: layout.elements, background: currentPageBg };
    remainingPages.splice(index, 1);
    const targetPage = remainingPages[newIndex];
    if (targetPage) {
      dispatch({ type: "SET_LAYOUT", layout: { ...layout, elements: targetPage.elements } });
    }
    setCurrentPageBg(targetPage?.background);
    setCurrentPageIndex(newIndex);
    setSelectedIds([]);
    setEditingTextId(null);
    setPageContextMenu(null);
  }, [currentPageIndex, layout, pagesState, dispatch]);

  const movePageLeft = useCallback((index: number) => {
    if (index <= 0) return;
    setPagesState((prev) => {
      const updated = [...prev];
      updated[currentPageIndex] = { ...updated[currentPageIndex], elements: layout.elements, background: currentPageBg };
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      return updated;
    });
    if (index === currentPageIndex) setCurrentPageIndex(index - 1);
    else if (index - 1 === currentPageIndex) setCurrentPageIndex(index);
    setPageContextMenu(null);
  }, [currentPageIndex, layout, currentPageBg]);

  const movePageRight = useCallback((index: number) => {
    if (index >= pagesState.length - 1) return;
    setPagesState((prev) => {
      const updated = [...prev];
      updated[currentPageIndex] = { ...updated[currentPageIndex], elements: layout.elements, background: currentPageBg };
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated;
    });
    if (index === currentPageIndex) setCurrentPageIndex(index + 1);
    else if (index + 1 === currentPageIndex) setCurrentPageIndex(index);
    setPageContextMenu(null);
  }, [currentPageIndex, layout, pagesState.length, currentPageBg]);

  // ─── Background rendering helper ─────────────────────────────

  // Per-page background overrides global canvas background
  const effectiveBgUrl = currentPageBg?.imageUrl !== undefined ? currentPageBg.imageUrl : layout.canvas.backgroundImageUrl;
  const effectiveBgColor = currentPageBg?.color !== undefined ? currentPageBg.color : layout.canvas.backgroundColor;
  const effectiveBgOpacity = currentPageBg?.opacity ?? layout.canvas.backgroundOpacity;
  const effectiveBgBlur = currentPageBg?.blur ?? layout.canvas.backgroundBlur;
  const effectiveOverlayOpacity = currentPageBg?.overlayOpacity ?? layout.canvas.overlayOpacity ?? 0.2;
  const effectiveBgConfig = (currentPageBg?.config ?? layout.canvas.backgroundConfig ?? {}) as Record<string, unknown>;

  const bgUrl = effectiveBgUrl;
  const bgOpacity = effectiveBgOpacity;
  const bgBlur = effectiveBgBlur;
  const bgBlurStyle = bgBlur > 0 ? `blur(${bgBlur / 10}cqi)` : undefined;
  const bgConfig = effectiveBgConfig;

  const renderBackground = () => (
    <>
      {/* Solid color */}
      {effectiveBgColor && !bgUrl && (
        <div className="absolute inset-0 z-0" style={{ backgroundColor: effectiveBgColor }} />
      )}

      {/* WebGL preset backgrounds */}
      {bgUrl === "preset:grainient" && (
        <div className="absolute inset-0 z-0" style={{ opacity: bgOpacity, filter: bgBlurStyle }}>
          <Grainient
            color1={(bgConfig.color1 as string) ?? "#FF9FFC"}
            color2={(bgConfig.color2 as string) ?? "#785700"}
            color3={(bgConfig.color3 as string) ?? "#B19EEF"}
            timeSpeed={(bgConfig.timeSpeed as number) ?? 0.25}
            colorBalance={(bgConfig.colorBalance as number) ?? 0}
            warpStrength={(bgConfig.warpStrength as number) ?? 1}
            warpFrequency={(bgConfig.warpFrequency as number) ?? 5}
            warpSpeed={(bgConfig.warpSpeed as number) ?? 2}
            warpAmplitude={(bgConfig.warpAmplitude as number) ?? 50}
            blendAngle={(bgConfig.blendAngle as number) ?? 0}
            blendSoftness={(bgConfig.blendSoftness as number) ?? 0.05}
            rotationAmount={(bgConfig.rotationAmount as number) ?? 500}
            noiseScale={(bgConfig.noiseScale as number) ?? 2}
            grainAmount={(bgConfig.grainAmount as number) ?? 0.1}
            grainScale={(bgConfig.grainScale as number) ?? 2}
            grainAnimated={(bgConfig.grainAnimated as boolean) ?? false}
            contrast={(bgConfig.contrast as number) ?? 1.5}
            gamma={(bgConfig.gamma as number) ?? 1}
            saturation={(bgConfig.saturation as number) ?? 1}
            centerX={(bgConfig.centerX as number) ?? 0}
            centerY={(bgConfig.centerY as number) ?? 0}
            zoom={(bgConfig.zoom as number) ?? 0.9}
          />
        </div>
      )}

      {/* CSS preset backgrounds */}
      {bgUrl?.startsWith("preset:") && !isWebGLPreset(bgUrl) && (
        <div
          className="absolute inset-0 z-0"
          style={{
            ...PRESET_STYLES[bgUrl],
            opacity: bgOpacity,
          }}
        />
      )}

      {/* Image backgrounds */}
      {bgUrl && !bgUrl.startsWith("preset:") && (
        <div className="absolute inset-0 z-0">
          <Image
            src={bgUrl}
            alt="Background"
            fill
            className="object-cover"
            style={{
              opacity: bgOpacity,
              filter: bgBlurStyle,
            }}
            unoptimized
          />
        </div>
      )}
      <div
        className="absolute inset-0 z-[1]"
        style={{ backgroundColor: `rgba(0,0,0,${effectiveOverlayOpacity})` }}
      />
    </>
  );

  // ─── Preview mode ─────────────────────────────────────────────

  if (isPreviewing) {
    return (
      <div>
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setIsPreviewing(false)}
            className="px-4 py-2 rounded-lg bg-gx-red text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Back to Editor
          </button>
        </div>
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: layout.canvas.aspectRatio, containerType: "inline-size" }}>
          {renderBackground()}
          {sortedElements.map((element) => (
            <div
              key={element.id}
              className="absolute"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.width}%`,
                height: `${element.height}%`,
                zIndex: element.zIndex + 2,
                transform: element.rotation !== 0 ? `rotate(${element.rotation}deg)` : undefined,
              }}
            >
              <ShowcaseElement element={element} build={build} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Editor mode ──────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Page navigation strip */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
        {pagesState.map((page, i) => (
          <button
            key={page.id}
            onClick={() => switchToPage(i)}
            onContextMenu={(e) => {
              e.preventDefault();
              setPageContextMenu({ index: i, x: e.clientX, y: e.clientY });
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors",
              i === currentPageIndex
                ? "bg-gx-gold/15 text-gx-gold border border-gx-gold/30"
                : "text-muted-foreground hover:bg-muted/50 border border-transparent"
            )}
          >
            Page {i + 1}
          </button>
        ))}
        <button
          onClick={addPage}
          disabled={pagesState.length >= maxPages}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed shrink-0 transition-colors",
            pagesState.length >= maxPages
              ? "text-zinc-600 border-zinc-800 cursor-not-allowed"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-zinc-700"
          )}
          title={pagesState.length >= maxPages && maxPages === 1 ? "Reach Level 5 to unlock multiple pages" : undefined}
        >
          + Add Page{maxPages === 1 && " (Lv.5)"}
        </button>
      </div>

      {/* Page context menu */}
      {pageContextMenu && (
        <>
          <div className="fixed inset-0 z-[600]" onClick={() => setPageContextMenu(null)} />
          <div
            className="fixed z-[601] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl py-1 min-w-[140px]"
            style={{ left: pageContextMenu.x, top: pageContextMenu.y }}
          >
            <button
              onClick={() => duplicatePage(pageContextMenu.index)}
              className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Duplicate
            </button>
            <button
              onClick={() => movePageLeft(pageContextMenu.index)}
              disabled={pageContextMenu.index === 0}
              className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Move Left
            </button>
            <button
              onClick={() => movePageRight(pageContextMenu.index)}
              disabled={pageContextMenu.index === pagesState.length - 1}
              className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Move Right
            </button>
            <div className="h-px bg-zinc-800 my-1" />
            <button
              onClick={() => deletePage(pageContextMenu.index)}
              disabled={pagesState.length <= 1}
              className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Delete Page
            </button>
          </div>
        </>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative w-full overflow-hidden bg-zinc-950 border border-zinc-800 rounded-xl select-none"
        style={{ aspectRatio: layout.canvas.aspectRatio, isolation: "isolate", containerType: "inline-size" }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
          if (files.length === 0) return;
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          const dropXPct = ((e.clientX - rect.left) / rect.width) * 100;
          const dropYPct = ((e.clientY - rect.top) / rect.height) * 100;
          for (const file of files) {
            toast.info("Uploading dropped image...");
            try {
              const res = await uploadImage(file);
              if (!res) { toast.error("Upload failed"); continue; }
              // Register the image with the build
              const fd = new FormData();
              fd.append("buildId", build.id);
              fd.append("url", res.url);
              const { addBuildImage } = await import("@/lib/actions/build");
              const addResult = await addBuildImage(fd);
              const dbImageId = (addResult && "image" in addResult && addResult.image)
                ? (addResult.image as { id: string }).id
                : generateId();
              if (addResult && "image" in addResult && addResult.image) {
                setBuildImages((prev) => [...prev, { id: dbImageId, url: res.url, alt: "Dropped image", isPrimary: false, order: prev.length }]);
              }
              const maxZ = layout.elements.length > 0 ? Math.max(...layout.elements.map((el) => el.zIndex)) : 0;
              const element: ShowcaseImageElement = {
                id: generateId(),
                type: "image",
                x: Math.max(0, dropXPct - 20),
                y: Math.max(0, dropYPct - 15),
                width: 40,
                height: 30,
                zIndex: maxZ + 1,
                rotation: 0,
                imageId: dbImageId,
                imageUrl: res.url,
                objectFit: "cover",
                borderRadius: 8,
                shadow: true,
                caption: null,
              };
              dispatch({ type: "ADD_ELEMENT", element });
              setSelectedIds([element.id]);
              toast.success("Image added!");
            } catch {
              toast.error("Failed to upload dropped image");
            }
          }
        }}
        onPointerDown={(e) => {
          // Start marquee selection when clicking on the canvas background
          const target = e.target as HTMLElement;
          if (!target.closest("[data-element-wrapper]")) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            marqueeRef.current = { startX: x, startY: y, currentX: x, currentY: y };
            // Save text content before deselecting (blur may fire too late)
            if (editingTextId) {
              const editingEl = canvasRef.current?.querySelector(`[data-element-wrapper] [contenteditable="true"]`) as HTMLElement | null;
              if (editingEl) {
                const newContent = editingEl.textContent || "";
                dispatch({ type: "UPDATE_ELEMENT", id: editingTextId, updates: { content: newContent } });
              }
            }
            // Deselect immediately unless shift is held
            if (!e.shiftKey) {
              setSelectedIds([]);
              setEditingTextId(null);
            }
          }
        }}
      >
        {renderBackground()}

        {/* Grid overlay */}
        <div className="absolute inset-0 z-[1] pointer-events-none opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "10% 10%",
          }} />
        </div>

        {/* Elements */}
        {sortedElements.map((element) => {
          const isSelected = selectedIds.includes(element.id);
          const isTextEditing = editingTextId === element.id;
          return (
            <div
              key={element.id}
              data-element-wrapper
              className={cn(
                "absolute touch-none",
                isSelected
                  ? "ring-2 ring-blue-500 shadow-lg shadow-blue-500/20"
                  : groups[element.id]
                    ? "ring-1 ring-emerald-500/40 cursor-move"
                    : "cursor-move"
              )}
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.width}%`,
                height: `${element.height}%`,
                zIndex: isSelected ? 100 : element.zIndex + 10,
                transform: element.rotation !== 0 ? `rotate(${element.rotation}deg)` : undefined,
              }}
              onPointerDown={(e) => {
                // Don't start drag on resize handles, delete button, or when editing text
                const target = e.target as HTMLElement;
                if (target.closest("[data-resize-handle]") || target.closest("[data-delete-btn]")) return;
                if (isTextEditing) return;
                startDrag(element.id, e);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (isTextEditing) return;
                // Find group members for this element
                const groupId = groups[element.id];
                const groupMembers = groupId
                  ? layout.elements.filter((el) => groups[el.id] === groupId).map((el) => el.id)
                  : [element.id];
                // Shift+click to add/remove from multi-selection
                if (e.shiftKey) {
                  setSelectedIds((prev) =>
                    prev.includes(element.id)
                      ? prev.filter((id) => !groupMembers.includes(id))
                      : [...new Set([...prev, ...groupMembers])]
                  );
                } else {
                  setSelectedIds(groupMembers);
                }
                // Clear text editing if clicking a different element
                if (editingTextId && editingTextId !== element.id) {
                  setEditingTextId(null);
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (element.type === "text") {
                  setEditingTextId(element.id);
                  setSelectedIds([element.id]);
                }
              }}
            >
              <ShowcaseElement
                element={element}
                build={build}
                isEditing={isTextEditing}
                onContentChange={
                  element.type === "text"
                    ? (content) => dispatch({ type: "UPDATE_ELEMENT", id: element.id, updates: { content } })
                    : undefined
                }
              />

              {/* Selection controls */}
              {isSelected && !isTextEditing && (
                <>
                  {/* Delete button */}
                  <button
                    data-delete-btn
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSelected();
                    }}
                    className="absolute -top-4 -right-4 sm:-top-3 sm:-right-3 z-50 w-8 h-8 sm:w-6 sm:h-6 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-md transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                  </button>

                  {/* Resize handles */}
                  {(["tl", "tr", "bl", "br"] as const).map((corner) => {
                    const posClass = {
                      tl: "-top-2 -left-2 sm:-top-1.5 sm:-left-1.5 cursor-nw-resize",
                      tr: "-top-2 -right-2 sm:-top-1.5 sm:-right-1.5 cursor-ne-resize",
                      bl: "-bottom-2 -left-2 sm:-bottom-1.5 sm:-left-1.5 cursor-sw-resize",
                      br: "-bottom-2 -right-2 sm:-bottom-1.5 sm:-right-1.5 cursor-se-resize",
                    }[corner];
                    return (
                      <div
                        key={corner}
                        data-resize-handle
                        className={cn(
                          "absolute w-4 h-4 sm:w-3 sm:h-3 rounded-full bg-blue-500 border-2 border-white z-50",
                          posClass
                        )}
                        onPointerDown={(e) => startResize(element.id, corner, e)}
                      />
                    );
                  })}
                </>
              )}
            </div>
          );
        })}

        {/* Marquee selection rectangle */}
        {marquee && (
          <div
            className="absolute border border-blue-400 bg-blue-400/10 z-[200] pointer-events-none"
            style={{
              left: `${Math.min(marquee.startX, marquee.currentX)}%`,
              top: `${Math.min(marquee.startY, marquee.currentY)}%`,
              width: `${Math.abs(marquee.currentX - marquee.startX)}%`,
              height: `${Math.abs(marquee.currentY - marquee.startY)}%`,
            }}
          />
        )}

        {/* Drawing overlay */}
        {showDrawing && canvasRef.current && (
          <DrawingOverlay
            ref={drawingRef}
            canvasWidth={canvasRef.current.clientWidth * 2}
            canvasHeight={canvasRef.current.clientHeight * 2}
            onComplete={handleDrawingComplete}
            onCancel={() => setShowDrawing(false)}
          />
        )}

        {/* Empty state */}
        {layout.elements.length === 0 && !showDrawing && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center">
              <p className="text-zinc-500 text-lg font-medium">Empty Canvas</p>
              <p className="text-zinc-600 text-sm mt-1">Use the dock below to add images and text</p>
            </div>
          </div>
        )}
      </div>

      {/* Element properties panel */}
      {selectedElement && (
        <ElementPropsPanel
          element={selectedElement}
          onUpdate={(updates) =>
            dispatch({ type: "UPDATE_ELEMENT", id: selectedElement.id, updates })
          }
          onDelete={deleteSelected}
          onClose={() => setSelectedIds([])}
        />
      )}

      {/* Group / Ungroup toolbar — shown when multiple items selected */}
      {selectedIds.length > 1 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 shadow-2xl">
          <span className="text-xs text-zinc-400">
            {selectedIds.length} selected
          </span>
          <div className="w-px h-4 bg-zinc-700" />
          <button
            onClick={handleGroup}
            className="px-3 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
          >
            Group
          </button>
          {selectedHaveGroup && (
            <button
              onClick={handleUngroup}
              className="px-3 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white hover:border-zinc-500 transition-colors"
            >
              Ungroup
            </button>
          )}
          <button
            onClick={deleteSelected}
            className="px-3 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
          >
            Delete All
          </button>
        </div>
      )}

      {/* Side panels */}
      {activePanel === "images" && (
        <ImagePickerPanel
          images={buildImages}
          buildId={build.id}
          onSelect={addImage}
          onImageUploaded={handleImageUploaded}
          onImageDeleted={handleImageDeleted}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === "background" && (
        <BackgroundPicker
          images={buildImages}
          buildId={build.id}
          currentBackground={{
            backgroundImageUrl: effectiveBgUrl ?? null,
            backgroundColor: effectiveBgColor ?? null,
            backgroundOpacity: effectiveBgOpacity,
            backgroundBlur: effectiveBgBlur,
            backgroundConfig: effectiveBgConfig,
            overlayOpacity: effectiveOverlayOpacity,
          }}
          onUpdate={(bg) => {
            // Update per-page background
            setCurrentPageBg((prev) => ({
              ...prev,
              imageUrl: bg.backgroundImageUrl !== undefined ? bg.backgroundImageUrl : prev?.imageUrl,
              color: bg.backgroundColor !== undefined ? bg.backgroundColor : prev?.color,
              opacity: bg.backgroundOpacity ?? prev?.opacity,
              blur: bg.backgroundBlur ?? prev?.blur,
              overlayOpacity: bg.overlayOpacity ?? prev?.overlayOpacity,
              config: bg.backgroundConfig !== undefined ? bg.backgroundConfig : prev?.config,
            }));
            // Also update the canvas state so renderBackground picks it up
            dispatch({ type: "SET_BACKGROUND", ...bg });
          }}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === "layers" && (
        <LayersPanel
          elements={layout.elements}
          selectedId={selectedIds[0] ?? null}
          onSelect={(id) => setSelectedIds([id])}
          onReorder={(id, dir) => dispatch({ type: "REORDER_Z", id, direction: dir })}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === "effects" && (
        <EffectsPanel
          onAddEffect={addEffect}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === "shapes" && (
        <ShapePickerPanel
          onSelect={addShape}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === "templates" && (
        <TemplatePickerPanel
          buildImages={buildImages}
          hasElements={layout.elements.length > 0}
          onApply={applyTemplate}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* Hidden video file input */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        onChange={handleVideoFileChange}
        className="hidden"
      />

      {/* Dock */}
      <ShowcaseDock
        onAddImage={() => setActivePanel(activePanel === "images" ? null : "images")}
        onAddText={addText}
        onAddMetadata={addMetadata}
        onAddEffect={() => setActivePanel(activePanel === "effects" ? null : "effects")}
        onAddVideo={addVideo}
        onAddShape={() => setActivePanel(activePanel === "shapes" ? null : "shapes")}
        onAddTemplate={() => setActivePanel(activePanel === "templates" ? null : "templates")}
        onDraw={() => setShowDrawing(true)}
        onBackground={() => setActivePanel(activePanel === "background" ? null : "background")}
        onLayers={() => setActivePanel(activePanel === "layers" ? null : "layers")}
        onPreview={() => setIsPreviewing(true)}
        onSave={handleSave}
        onExit={onExit}
        onUndo={() => dispatch({ type: "UNDO" })}
        onRedo={() => dispatch({ type: "REDO" })}
        canUndo={canUndo}
        canRedo={canRedo}
        isSaving={isSaving}
        isVideoUploading={isVideoUploading}
        imageCount={imageCount}
        maxImages={MAX_IMAGES}
        videoCount={videoCount}
        maxVideos={MAX_VIDEOS}
      />
    </div>
  );
}

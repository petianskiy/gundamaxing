"use client";

import { useReducer, useCallback, useRef, useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ShowcaseElement } from "./showcase-element";
import { ShowcaseDock } from "./showcase-dock";
import { ImagePickerPanel } from "./panels/image-picker-panel";
import { BackgroundPicker } from "./panels/background-picker";
import { ElementPropsPanel } from "./panels/element-props-panel";
import { LayersPanel } from "./panels/layers-panel";
import { updateShowcaseLayout } from "@/lib/actions/build";
import { toast } from "sonner";
import type {
  Build,
  ShowcaseLayout,
  ShowcaseElement as ShowcaseElementType,
  ShowcaseImageElement,
  ShowcaseTextElement,
  ShowcaseMetadataElement,
} from "@/lib/types";

// ─── State Management ───────────────────────────────────────────

type Action =
  | { type: "ADD_ELEMENT"; element: ShowcaseElementType }
  | { type: "MOVE_ELEMENT"; id: string; x: number; y: number }
  | { type: "RESIZE_ELEMENT"; id: string; width: number; height: number }
  | { type: "UPDATE_ELEMENT"; id: string; updates: Partial<ShowcaseElementType> }
  | { type: "DELETE_ELEMENT"; id: string }
  | { type: "SET_BACKGROUND"; backgroundImageUrl: string | null; backgroundOpacity?: number; backgroundBlur?: number }
  | { type: "REORDER_Z"; id: string; direction: "up" | "down" | "top" | "bottom" }
  | { type: "SET_LAYOUT"; layout: ShowcaseLayout };

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
          backgroundImageUrl: action.backgroundImageUrl,
          backgroundOpacity: action.backgroundOpacity ?? state.canvas.backgroundOpacity,
          backgroundBlur: action.backgroundBlur ?? state.canvas.backgroundBlur,
        },
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

// ─── Resize Handle ──────────────────────────────────────────────

function ResizeHandle({
  corner,
  onResize,
}: {
  corner: "tl" | "tr" | "bl" | "br";
  onResize: (deltaX: number, deltaY: number) => void;
}) {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    startRef.current = { x: e.clientX, y: e.clientY };

    const handlePointerMove = (ev: PointerEvent) => {
      if (!startRef.current) return;
      const dx = ev.clientX - startRef.current.x;
      const dy = ev.clientY - startRef.current.y;
      startRef.current = { x: ev.clientX, y: ev.clientY };
      onResize(
        corner === "tl" || corner === "bl" ? -dx : dx,
        corner === "tl" || corner === "tr" ? -dy : dy
      );
    };

    const handlePointerUp = () => {
      startRef.current = null;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const posClass = {
    tl: "-top-1.5 -left-1.5 cursor-nw-resize",
    tr: "-top-1.5 -right-1.5 cursor-ne-resize",
    bl: "-bottom-1.5 -left-1.5 cursor-sw-resize",
    br: "-bottom-1.5 -right-1.5 cursor-se-resize",
  }[corner];

  return (
    <div
      className={cn(
        "absolute w-3 h-3 rounded-full bg-blue-500 border-2 border-white z-50",
        posClass
      )}
      onPointerDown={handlePointerDown}
    />
  );
}

// ─── Editor Component ───────────────────────────────────────────

interface ShowcaseEditorProps {
  build: Build;
  initialLayout: ShowcaseLayout;
  onExit: () => void;
}

export function ShowcaseEditor({ build, initialLayout, onExit }: ShowcaseEditorProps) {
  const [layout, dispatch] = useReducer(layoutReducer, initialLayout);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"images" | "background" | "layers" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedElement = layout.elements.find((el) => el.id === selectedId) ?? null;
  const sortedElements = [...layout.elements].sort((a, b) => a.zIndex - b.zIndex);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (activePanel) {
          setActivePanel(null);
        } else {
          setSelectedId(null);
        }
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && document.activeElement?.tagName !== "INPUT" && !(document.activeElement as HTMLElement)?.isContentEditable) {
          dispatch({ type: "DELETE_ELEMENT", id: selectedId });
          setSelectedId(null);
        }
      }
      // Arrow keys for nudging
      if (selectedId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const el = layout.elements.find((el) => el.id === selectedId);
        if (!el) return;
        const step = e.shiftKey ? 5 : 1;
        let newX = el.x;
        let newY = el.y;
        if (e.key === "ArrowLeft") newX = Math.max(0, el.x - step);
        if (e.key === "ArrowRight") newX = Math.min(100 - el.width, el.x + step);
        if (e.key === "ArrowUp") newY = Math.max(0, el.y - step);
        if (e.key === "ArrowDown") newY = Math.min(100 - el.height, el.y + step);
        dispatch({ type: "MOVE_ELEMENT", id: selectedId, x: newX, y: newY });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, activePanel, layout.elements]);

  // Drag handler
  const handleDragEnd = useCallback(
    (elementId: string, _event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const el = layout.elements.find((e) => e.id === elementId);
      if (!el) return;

      const deltaXPercent = (info.offset.x / rect.width) * 100;
      const deltaYPercent = (info.offset.y / rect.height) * 100;
      const newX = Math.max(0, Math.min(100 - el.width, el.x + deltaXPercent));
      const newY = Math.max(0, Math.min(100 - el.height, el.y + deltaYPercent));

      dispatch({ type: "MOVE_ELEMENT", id: elementId, x: newX, y: newY });
    },
    [layout.elements]
  );

  // Resize handler
  const handleResize = useCallback(
    (elementId: string, deltaXPx: number, deltaYPx: number) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const el = layout.elements.find((e) => e.id === elementId);
      if (!el) return;

      const deltaW = (deltaXPx / rect.width) * 100;
      const deltaH = (deltaYPx / rect.height) * 100;
      const newWidth = Math.max(5, Math.min(100, el.width + deltaW));
      const newHeight = Math.max(5, Math.min(100, el.height + deltaH));

      dispatch({ type: "RESIZE_ELEMENT", id: elementId, width: newWidth, height: newHeight });
    },
    [layout.elements]
  );

  // Add element helpers
  const addImage = useCallback(
    (imageId: string, imageUrl: string) => {
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
    [layout.elements]
  );

  const addText = useCallback(() => {
    const maxZ = layout.elements.length > 0 ? Math.max(...layout.elements.map((e) => e.zIndex)) : 0;
    const element: ShowcaseTextElement = {
      id: generateId(),
      type: "text",
      x: 20,
      y: 40,
      width: 60,
      height: 10,
      zIndex: maxZ + 1,
      rotation: 0,
      content: "Click to edit text...",
      fontSize: "lg",
      fontWeight: "normal",
      color: "#fafafa",
      textAlign: "center",
      backgroundColor: null,
    };
    dispatch({ type: "ADD_ELEMENT", element });
    setSelectedId(element.id);
  }, [layout.elements]);

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
    setSelectedId(element.id);
  }, [layout.elements]);

  // Save
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const formData = new FormData();
    formData.set("buildId", build.id);
    formData.set("showcaseLayout", JSON.stringify(layout));
    const result = await updateShowcaseLayout(formData);
    setIsSaving(false);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Showcase saved!");
    }
  }, [build.id, layout]);

  // Preview toggle
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
        {/* Re-use the same canvas rendering */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4 / 5" }}>
          {layout.canvas.backgroundImageUrl && (
            <div className="absolute inset-0 z-0">
              <Image
                src={layout.canvas.backgroundImageUrl}
                alt="Background"
                fill
                className="object-cover"
                style={{
                  opacity: layout.canvas.backgroundOpacity,
                  filter: layout.canvas.backgroundBlur > 0 ? `blur(${layout.canvas.backgroundBlur}px)` : undefined,
                }}
                unoptimized
              />
            </div>
          )}
          <div className="absolute inset-0 z-[1] bg-black/20" />
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

  return (
    <div className="relative">
      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative w-full overflow-hidden bg-zinc-950 border border-zinc-800 rounded-xl"
        style={{ aspectRatio: "4 / 5" }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedId(null);
        }}
      >
        {/* Background */}
        {layout.canvas.backgroundImageUrl && (
          <div className="absolute inset-0 z-0">
            <Image
              src={layout.canvas.backgroundImageUrl}
              alt="Background"
              fill
              className="object-cover"
              style={{
                opacity: layout.canvas.backgroundOpacity,
                filter: layout.canvas.backgroundBlur > 0 ? `blur(${layout.canvas.backgroundBlur}px)` : undefined,
              }}
              unoptimized
            />
          </div>
        )}
        <div className="absolute inset-0 z-[1] bg-black/20" />

        {/* Grid overlay */}
        <div className="absolute inset-0 z-[1] pointer-events-none opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "10% 10%",
          }} />
        </div>

        {/* Elements */}
        {sortedElements.map((element) => {
          const isSelected = selectedId === element.id;
          return (
            <motion.div
              key={element.id}
              drag
              dragMomentum={false}
              dragConstraints={canvasRef}
              dragElastic={0}
              onDragEnd={(event, info) => handleDragEnd(element.id, event as MouseEvent, info)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(element.id);
              }}
              className={cn(
                "absolute cursor-move",
                isSelected && "ring-2 ring-blue-500 ring-offset-1 ring-offset-transparent"
              )}
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.width}%`,
                height: `${element.height}%`,
                zIndex: element.zIndex + 10,
                transform: element.rotation !== 0 ? `rotate(${element.rotation}deg)` : undefined,
              }}
            >
              <ShowcaseElement
                element={element}
                build={build}
                isEditing={isSelected && element.type === "text"}
                onContentChange={
                  element.type === "text"
                    ? (content) => dispatch({ type: "UPDATE_ELEMENT", id: element.id, updates: { content } })
                    : undefined
                }
              />

              {/* Resize handles */}
              {isSelected && (
                <>
                  <ResizeHandle corner="tl" onResize={(dx, dy) => handleResize(element.id, dx, dy)} />
                  <ResizeHandle corner="tr" onResize={(dx, dy) => handleResize(element.id, dx, dy)} />
                  <ResizeHandle corner="bl" onResize={(dx, dy) => handleResize(element.id, dx, dy)} />
                  <ResizeHandle corner="br" onResize={(dx, dy) => handleResize(element.id, dx, dy)} />
                </>
              )}
            </motion.div>
          );
        })}

        {/* Empty state */}
        {layout.elements.length === 0 && (
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
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* Side panels */}
      {activePanel === "images" && (
        <ImagePickerPanel
          images={build.images}
          onSelect={addImage}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === "background" && (
        <BackgroundPicker
          images={build.images}
          currentBackground={layout.canvas}
          onUpdate={(bg) => dispatch({ type: "SET_BACKGROUND", ...bg })}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === "layers" && (
        <LayersPanel
          elements={layout.elements}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onReorder={(id, dir) => dispatch({ type: "REORDER_Z", id, direction: dir })}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* Dock */}
      <ShowcaseDock
        onAddImage={() => setActivePanel(activePanel === "images" ? null : "images")}
        onAddText={addText}
        onAddMetadata={addMetadata}
        onBackground={() => setActivePanel(activePanel === "background" ? null : "background")}
        onLayers={() => setActivePanel(activePanel === "layers" ? null : "layers")}
        onPreview={() => setIsPreviewing(true)}
        onSave={handleSave}
        onExit={onExit}
        isSaving={isSaving}
      />
    </div>
  );
}

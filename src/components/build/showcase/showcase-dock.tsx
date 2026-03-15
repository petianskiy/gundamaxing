"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ImagePlus,
  Type,
  LayoutGrid,
  Image,
  Layers,
  Save,
  X,
  Loader2,
  Zap,
  Undo2,
  Redo2,
  Film,
  Pencil,
  Pentagon,
  LayoutTemplate,
  HelpCircle,
} from "lucide-react";

interface ShowcaseDockProps {
  onAddImage: () => void;
  onAddText: () => void;
  onAddMetadata: () => void;
  onAddEffect: () => void;
  onAddVideo: () => void;
  onAddShape: () => void;
  onAddTemplate: () => void;
  onDraw: () => void;
  onBackground: () => void;
  onLayers: () => void;
  onSave: () => void;
  onExit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onShowGuide?: () => void;
  frozen?: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  isVideoUploading?: boolean;
  imageCount: number;
  maxImages: number;
  videoCount: number;
  maxVideos: number;
}

interface DockItemData {
  icon: React.ElementType;
  label: string;
  shortLabel: string;
  onClick: () => void;
  highlight?: boolean;
  disabled?: boolean;
  dockId?: string;
}

interface DockTooltipState {
  label: string;
  rect: DOMRect;
}

function Divider() {
  return (
    <div className="flex-shrink-0 w-px self-stretch my-1.5 bg-zinc-700/50" />
  );
}

export function ShowcaseDock({
  onAddImage,
  onAddText,
  onAddMetadata,
  onAddEffect,
  onAddVideo,
  onAddShape,
  onAddTemplate,
  onDraw,
  onBackground,
  onLayers,
  onSave,
  onExit,
  onUndo,
  onRedo,
  onShowGuide,
  frozen,
  canUndo,
  canRedo,
  isSaving,
  isVideoUploading,
  imageCount,
  maxImages,
  videoCount,
  maxVideos,
}: ShowcaseDockProps) {
  const [tooltip, setTooltip] = useState<DockTooltipState | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const imagesAtLimit = imageCount >= maxImages;
  const videosAtLimit = videoCount >= maxVideos;

  const historyItems: DockItemData[] = [
    { icon: Undo2, label: "Undo", shortLabel: "Undo", onClick: onUndo, disabled: !canUndo, dockId: "undo" },
    { icon: Redo2, label: "Redo", shortLabel: "Redo", onClick: onRedo, disabled: !canRedo, dockId: "redo" },
  ];

  const contentItems: DockItemData[] = [
    { icon: ImagePlus, label: imagesAtLimit ? `Images ${imageCount}/${maxImages}` : `Add Image (${imageCount}/${maxImages})`, shortLabel: "Image", onClick: onAddImage, disabled: imagesAtLimit, dockId: "add-image" },
    { icon: isVideoUploading ? Loader2 : Film, label: isVideoUploading ? "Uploading..." : videosAtLimit ? `Videos ${videoCount}/${maxVideos}` : `Add Video (${videoCount}/${maxVideos})`, shortLabel: isVideoUploading ? "Upload..." : "Video", onClick: onAddVideo, disabled: isVideoUploading || videosAtLimit, dockId: "add-video" },
    { icon: Type, label: "Add Text", shortLabel: "Text", onClick: onAddText, dockId: "add-text" },
    { icon: LayoutGrid, label: "Info Card", shortLabel: "Info", onClick: onAddMetadata, dockId: "info-card" },
    { icon: Pentagon, label: "Shapes", shortLabel: "Shapes", onClick: onAddShape, dockId: "shapes" },
    { icon: Zap, label: "Effects", shortLabel: "Effects", onClick: onAddEffect, dockId: "effects" },
  ];

  const utilityItems: DockItemData[] = [
    { icon: LayoutTemplate, label: "Templates", shortLabel: "Templates", onClick: onAddTemplate, dockId: "templates" },
    { icon: Pencil, label: "Draw", shortLabel: "Draw", onClick: onDraw, dockId: "draw" },
    { icon: Image, label: "Background", shortLabel: "BG", onClick: onBackground, dockId: "background" },
    { icon: Layers, label: "Layers", shortLabel: "Layers", onClick: onLayers, dockId: "layers" },
  ];

  const actionItems: DockItemData[] = [
    { icon: isSaving ? Loader2 : Save, label: isSaving ? "Saving..." : "Save", shortLabel: isSaving ? "Saving" : "Save", onClick: onSave, highlight: true, disabled: isSaving, dockId: "save" },
    { icon: X, label: "Exit", shortLabel: "Exit", onClick: onExit, dockId: "exit" },
  ];

  const guideItem: DockItemData | null = onShowGuide
    ? { icon: HelpCircle, label: "Guide", shortLabel: "Guide", onClick: onShowGuide, dockId: "guide" }
    : null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[600] bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-700/50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      onMouseLeave={() => setTooltip(null)}
    >
      <div
        className="flex items-stretch gap-1 px-2 py-2 overflow-x-auto"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {/* History group */}
        {historyItems.map((item) => (
          <ToolButton
            key={item.dockId}
            item={item}
            onShowTooltip={setTooltip}
            onHideTooltip={() => setTooltip(null)}
          />
        ))}

        <Divider />

        {/* Content tools group */}
        {contentItems.map((item) => (
          <ToolButton
            key={item.dockId}
            item={item}
            onShowTooltip={setTooltip}
            onHideTooltip={() => setTooltip(null)}
          />
        ))}

        <Divider />

        {/* Utility group */}
        {utilityItems.map((item) => (
          <ToolButton
            key={item.dockId}
            item={item}
            onShowTooltip={setTooltip}
            onHideTooltip={() => setTooltip(null)}
          />
        ))}

        <Divider />

        {/* Action group (save/exit) */}
        {actionItems.map((item) => (
          <ToolButton
            key={item.dockId}
            item={item}
            onShowTooltip={setTooltip}
            onHideTooltip={() => setTooltip(null)}
          />
        ))}

        {/* Guide button */}
        {guideItem && (
          <ToolButton
            item={guideItem}
            onShowTooltip={setTooltip}
            onHideTooltip={() => setTooltip(null)}
          />
        )}
      </div>

      {/* Tooltip rendered via portal for desktop hover */}
      {mounted && tooltip && createPortal(
        <div
          className="fixed z-[601] px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-[10px] text-white whitespace-nowrap pointer-events-none hidden sm:block"
          style={{
            left: tooltip.rect.left + tooltip.rect.width / 2,
            top: tooltip.rect.top - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          {tooltip.label}
        </div>,
        document.body,
      )}
    </div>
  );
}

function ToolButton({
  item,
  onShowTooltip,
  onHideTooltip,
}: {
  item: DockItemData;
  onShowTooltip: (state: DockTooltipState) => void;
  onHideTooltip: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const Icon = item.icon;

  return (
    <button
      ref={ref}
      data-dock-item={item.dockId}
      onClick={item.onClick}
      disabled={item.disabled}
      className={`relative flex flex-col items-center justify-center gap-0.5 rounded-lg min-w-[56px] px-2 py-1.5 flex-shrink-0 transition-colors active:scale-95 ${
        item.disabled
          ? "opacity-40 cursor-not-allowed"
          : item.highlight
            ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
            : "text-zinc-300 hover:bg-zinc-700/60 hover:text-white"
      }`}
      onMouseEnter={() => {
        if (ref.current && !item.disabled) {
          onShowTooltip({ label: item.label, rect: ref.current.getBoundingClientRect() });
        }
      }}
      onMouseLeave={onHideTooltip}
    >
      <Icon className={`w-5 h-5 ${Icon === Loader2 ? "animate-spin" : ""}`} />
      <span className="text-[10px] leading-tight whitespace-nowrap">{item.shortLabel}</span>
    </button>
  );
}

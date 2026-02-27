"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
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
  onClick: () => void;
  highlight?: boolean;
  disabled?: boolean;
  dockId?: string;
}

interface DockTooltipState {
  label: string;
  rect: DOMRect;
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
  const mouseX = useMotionValue(Infinity);
  const [tooltip, setTooltip] = useState<DockTooltipState | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const imagesAtLimit = imageCount >= maxImages;
  const videosAtLimit = videoCount >= maxVideos;

  const items: DockItemData[] = [
    { icon: Undo2, label: "Undo", onClick: onUndo, disabled: !canUndo, dockId: "undo" },
    { icon: Redo2, label: "Redo", onClick: onRedo, disabled: !canRedo, dockId: "redo" },
    { icon: ImagePlus, label: imagesAtLimit ? `Images ${imageCount}/${maxImages}` : `Add Image (${imageCount}/${maxImages})`, onClick: onAddImage, disabled: imagesAtLimit, dockId: "add-image" },
    { icon: isVideoUploading ? Loader2 : Film, label: isVideoUploading ? "Uploading..." : videosAtLimit ? `Videos ${videoCount}/${maxVideos}` : `Add Video (${videoCount}/${maxVideos})`, onClick: onAddVideo, disabled: isVideoUploading || videosAtLimit, dockId: "add-video" },
    { icon: Type, label: "Add Text", onClick: onAddText, dockId: "add-text" },
    { icon: LayoutGrid, label: "Info Card", onClick: onAddMetadata, dockId: "info-card" },
    { icon: Pentagon, label: "Shapes", onClick: onAddShape, dockId: "shapes" },
    { icon: Zap, label: "Effects", onClick: onAddEffect, dockId: "effects" },
    { icon: LayoutTemplate, label: "Templates", onClick: onAddTemplate, dockId: "templates" },
    { icon: Pencil, label: "Draw", onClick: onDraw, dockId: "draw" },
    { icon: Image, label: "Background", onClick: onBackground, dockId: "background" },
    { icon: Layers, label: "Layers", onClick: onLayers, dockId: "layers" },
    { icon: isSaving ? Loader2 : Save, label: isSaving ? "Saving..." : "Save", onClick: onSave, highlight: true, dockId: "save" },
    { icon: X, label: "Exit", onClick: onExit, dockId: "exit" },
  ];

  const totalUsed = imageCount + videoCount;
  const totalMax = maxImages + maxVideos;
  const loadPercent = Math.round((totalUsed / totalMax) * 100);
  const loadColor = loadPercent >= 90 ? "bg-red-500" : loadPercent >= 70 ? "bg-amber-500" : "bg-blue-500";

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[600] flex flex-col items-center gap-1.5 max-w-[calc(100vw-2rem)]">
      {/* Capacity indicator */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/40 text-[10px]">
        <div className="flex items-center gap-1.5">
          <ImagePlus className="h-3 w-3 text-zinc-500" />
          <span className={imageCount >= maxImages ? "text-red-400 font-medium" : "text-zinc-400"}>
            {imageCount}/{maxImages}
          </span>
        </div>
        <div className="w-px h-3 bg-zinc-700" />
        <div className="flex items-center gap-1.5">
          <Film className="h-3 w-3 text-zinc-500" />
          <span className={videoCount >= maxVideos ? "text-red-400 font-medium" : "text-zinc-400"}>
            {videoCount}/{maxVideos}
          </span>
        </div>
        <div className="w-px h-3 bg-zinc-700" />
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 rounded-full bg-zinc-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${loadColor}`}
              style={{ width: `${Math.min(100, loadPercent)}%` }}
            />
          </div>
          <span className={loadPercent >= 90 ? "text-red-400 font-medium" : "text-zinc-500"}>
            {loadPercent}%
          </span>
        </div>
      </div>

      {/* Dock */}
      <motion.div
        onMouseMove={(e) => { if (!frozen) mouseX.set(e.pageX); }}
        onMouseLeave={() => {
          mouseX.set(Infinity);
          setTooltip(null);
        }}
        className="flex items-end gap-1 px-2 sm:px-3 py-2 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 shadow-2xl overflow-x-auto max-w-full"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item) => (
          <DockIcon
            key={item.label}
            mouseX={mouseX}
            item={item}
            onShowTooltip={setTooltip}
            onHideTooltip={() => setTooltip(null)}
          />
        ))}
        {onShowGuide && (
          <DockIcon
            mouseX={mouseX}
            item={{ icon: HelpCircle, label: "Guide", onClick: onShowGuide, dockId: "guide" }}
            onShowTooltip={setTooltip}
            onHideTooltip={() => setTooltip(null)}
          />
        )}
      </motion.div>

      {/* Tooltip rendered via portal to escape transform-based containing block */}
      {mounted && tooltip && createPortal(
        <div
          className="fixed z-[601] px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-[10px] text-white whitespace-nowrap pointer-events-none"
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

function DockIcon({
  mouseX,
  item,
  onShowTooltip,
  onHideTooltip,
}: {
  mouseX: MotionValue<number>;
  item: DockItemData;
  onShowTooltip: (state: DockTooltipState) => void;
  onHideTooltip: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const baseSize = isMobile ? 40 : 40;
  const hoverSize = isMobile ? 40 : 64;
  const baseIcon = isMobile ? 18 : 18;
  const hoverIcon = isMobile ? 18 : 28;

  const widthSync = useTransform(distance, [-150, 0, 150], [baseSize, hoverSize, baseSize]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const iconSizeSync = useTransform(distance, [-150, 0, 150], [baseIcon, hoverIcon, baseIcon]);
  const iconSize = useSpring(iconSizeSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const Icon = item.icon;

  return (
    <motion.button
      ref={ref}
      data-dock-item={item.dockId}
      style={{ width, height: width }}
      onClick={item.onClick}
      disabled={item.disabled}
      className={`relative flex items-center justify-center rounded-xl transition-colors ${
        item.disabled
          ? "bg-zinc-800/50 text-zinc-600 cursor-not-allowed"
          : item.highlight
            ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
      }`}
      whileTap={item.disabled ? undefined : { scale: 0.9 }}
      onMouseEnter={() => {
        if (ref.current && !item.disabled) {
          onShowTooltip({ label: item.label, rect: ref.current.getBoundingClientRect() });
        }
      }}
      onMouseLeave={onHideTooltip}
    >
      <motion.div style={{ width: iconSize, height: iconSize }} className="flex items-center justify-center">
        <Icon className={`w-full h-full ${Icon === Loader2 ? "animate-spin" : ""}`} />
      </motion.div>
    </motion.button>
  );
}

"use client";

import { useRef } from "react";
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
  Eye,
  Save,
  X,
  Loader2,
  Zap,
} from "lucide-react";

interface ShowcaseDockProps {
  onAddImage: () => void;
  onAddText: () => void;
  onAddMetadata: () => void;
  onAddEffect: () => void;
  onBackground: () => void;
  onLayers: () => void;
  onPreview: () => void;
  onSave: () => void;
  onExit: () => void;
  isSaving: boolean;
}

interface DockItemData {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}

export function ShowcaseDock({
  onAddImage,
  onAddText,
  onAddMetadata,
  onAddEffect,
  onBackground,
  onLayers,
  onPreview,
  onSave,
  onExit,
  isSaving,
}: ShowcaseDockProps) {
  const mouseX = useMotionValue(Infinity);

  const items: DockItemData[] = [
    { icon: ImagePlus, label: "Add Image", onClick: onAddImage },
    { icon: Type, label: "Add Text", onClick: onAddText },
    { icon: LayoutGrid, label: "Info Card", onClick: onAddMetadata },
    { icon: Zap, label: "Effect", onClick: onAddEffect },
    { icon: Image, label: "Background", onClick: onBackground },
    { icon: Layers, label: "Layers", onClick: onLayers },
    { icon: Eye, label: "Preview", onClick: onPreview },
    { icon: isSaving ? Loader2 : Save, label: isSaving ? "Saving..." : "Save", onClick: onSave, highlight: true },
    { icon: X, label: "Exit", onClick: onExit },
  ];

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-end gap-1 px-3 py-2 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 shadow-2xl"
    >
      {items.map((item) => (
        <DockIcon key={item.label} mouseX={mouseX} item={item} />
      ))}
    </motion.div>
  );
}

function DockIcon({ mouseX, item }: { mouseX: MotionValue<number>; item: DockItemData }) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 64, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const iconSizeSync = useTransform(distance, [-150, 0, 150], [18, 28, 18]);
  const iconSize = useSpring(iconSizeSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const Icon = item.icon;

  return (
    <motion.button
      ref={ref}
      style={{ width, height: width }}
      onClick={item.onClick}
      className={`relative flex items-center justify-center rounded-xl transition-colors group ${
        item.highlight
          ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
      }`}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div style={{ width: iconSize, height: iconSize }} className="flex items-center justify-center">
        <Icon className={`w-full h-full ${Icon === Loader2 ? "animate-spin" : ""}`} />
      </motion.div>
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {item.label}
      </div>
    </motion.button>
  );
}

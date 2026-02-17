"use client";

import { GridMotion } from "./grid-motion";
import "./grid-motion.css";

// Official box art only — 20 unique images
const gundamImages = [
  "/gundam-art/newtype-gp03s.jpg",
  "/gundam-art/mighty-strike-freedom-box.webp",
  "/gundam-art/pg-unleashed-rx78.jpg",
  "/gundam-art/justice-gundam.webp",
  "/gundam-art/police-zaku.webp",
  "/gundam-art/aerial-rebuild.jpg",
  "/gundam-art/xi-gundam.webp",
  "/gundam-art/jupitive-gundam.jpg",
  "/gundam-art/psycho-zaku.jpg",
  "/gundam-art/mighty-strike-freedom.png",
  "/gundam-art/schwarzette.webp",
  "/gundam-art/rg-rx78-2.jpg",
  "/gundam-art/force-impulse.jpg",
  "/gundam-art/freedom-gundam-hd.webp",
  "/gundam-art/mg-rx78-ver3.jpg",
  "/gundam-art/rising-freedom.jpg",
  "/gundam-art/lightning-buster.jpg",
  "/gundam-art/gundam-raum.jpg",
  "/gundam-art/lfrith.webp",
  "/gundam-art/mg-buster.jpg",
];

// Fill all 28 slots: 20 unique images + 8 repeated from the pool
function buildGridItems(): string[] {
  const items: string[] = [];
  for (let i = 0; i < 28; i++) {
    items.push(gundamImages[i % gundamImages.length]);
  }
  return items;
}

export function GundamGridSection() {
  const gridItems = buildGridItems();

  return (
    <section className="relative">
      {/* Top fade from previous section */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent z-10" />

      {/* Grid */}
      <GridMotion items={gridItems} gradientColor="#0a0a0a" />

      {/* Bottom fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { FlipCard, BACK_STANDARD, BACK_RESOURCE, BACK_TOKEN, type GCGCardData } from "./card-showcase";

const COLLECTION: GCGCardData[] = [
  {
    id: "col-unit",
    name: "Tieren Taozi",
    image: "/images/cards/unitcard.jpg",
    backImage: BACK_STANDARD,
    border: "rgba(155,133,232,0.5)",
    glow: "rgba(155,133,232,0.3)",
  },
  {
    id: "col-pilot",
    name: "Sarah Zabiarov",
    image: "/images/cards/pilotcard.jpg",
    backImage: BACK_STANDARD,
    border: "rgba(74,222,128,0.4)",
    glow: "rgba(74,222,128,0.25)",
  },
  {
    id: "col-command",
    name: "With Iron and Blood",
    image: "/images/cards/commandcard.jpg",
    backImage: BACK_STANDARD,
    border: "rgba(232,121,176,0.5)",
    glow: "rgba(232,121,176,0.35)",
  },
  {
    id: "col-base",
    name: "Hammerhead",
    image: "/images/cards/basecard.jpg",
    backImage: BACK_STANDARD,
    border: "rgba(180,127,255,0.5)",
    glow: "rgba(180,127,255,0.3)",
  },
  {
    id: "col-resource",
    name: "Resource",
    image: "/images/cards/resourcecard.jpg",
    backImage: BACK_RESOURCE,
    border: "rgba(79,195,247,0.5)",
    glow: "rgba(79,195,247,0.3)",
  },
  {
    id: "col-token",
    name: "EX Base Token",
    image: "/images/cards/tokencard.jpg",
    backImage: BACK_TOKEN,
    border: "rgba(240,168,85,0.5)",
    glow: "rgba(240,168,85,0.3)",
  },
];

export function CardCollection() {
  const { t } = useTranslation();

  return (
    <section id="collection" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-amber-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
              {t("cards.collection.eyebrow")}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {t("cards.collection.title")}
          </h2>
          <p className="mt-3 text-zinc-400 max-w-lg mx-auto text-sm">
            {t("cards.collection.subtitle")}
          </p>
          <p className="mt-2 text-[11px] text-zinc-600 uppercase tracking-[0.15em]">
            ↑ Click any card to flip and see the back
          </p>
        </motion.div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-6">
          {COLLECTION.map((card, i) => (
            <FlipCard key={card.id} card={card} index={i} defaultFlipped={true} />
          ))}
        </div>
      </div>
    </section>
  );
}

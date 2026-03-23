"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Swords, Shield, Zap, Users, Target, Clock,
  Trophy, ChevronDown, Layers, Cpu, Crosshair, Flame,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

/* ── Section data ─────────────────────────────────────────────── */

interface GuideSection {
  id: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
}

const SECTIONS: GuideSection[] = [
  { id: "overview", icon: <BookOpen className="h-5 w-5" />, color: "text-indigo-400", borderColor: "border-indigo-500/30" },
  { id: "cardTypes", icon: <Layers className="h-5 w-5" />, color: "text-blue-400", borderColor: "border-blue-500/30" },
  { id: "setup", icon: <Target className="h-5 w-5" />, color: "text-emerald-400", borderColor: "border-emerald-500/30" },
  { id: "phases", icon: <Clock className="h-5 w-5" />, color: "text-amber-400", borderColor: "border-amber-500/30" },
  { id: "combat", icon: <Swords className="h-5 w-5" />, color: "text-red-400", borderColor: "border-red-500/30" },
  { id: "keywords", icon: <Zap className="h-5 w-5" />, color: "text-violet-400", borderColor: "border-violet-500/30" },
  { id: "winning", icon: <Trophy className="h-5 w-5" />, color: "text-yellow-400", borderColor: "border-yellow-500/30" },
];

/* ── Accordion item ───────────────────────────────────────────── */

function AccordionItem({
  section,
  isOpen,
  toggle,
  title,
  children,
}: {
  section: GuideSection;
  isOpen: boolean;
  toggle: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border transition-colors", isOpen ? section.borderColor : "border-white/[0.06]", "bg-white/[0.02]")}>
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 p-4 sm:p-5 text-left"
      >
        <span className={cn("shrink-0", section.color)}>{section.icon}</span>
        <span className="flex-1 text-sm sm:text-base font-semibold text-white">{title}</span>
        <ChevronDown
          className={cn("h-4 w-4 text-zinc-500 transition-transform duration-300", isOpen && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-5 pt-0 text-sm text-zinc-400 leading-relaxed space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Info card for card types ─────────────────────────────────── */

function TypeCard({
  icon,
  name,
  color,
  description,
  image,
}: {
  icon: React.ReactNode;
  name: string;
  color: string;
  description: string;
  image?: string;
}) {
  return (
    <div className={cn("rounded-lg border overflow-hidden bg-white/[0.02]", color)}>
      {image && (
        <div className="aspect-[3/2] overflow-hidden">
          <img src={image} alt={name} className="w-full h-full object-cover object-top" loading="lazy" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-sm font-semibold text-white">{name}</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ── Phase step ───────────────────────────────────────────────── */

function PhaseStep({ number, name, desc }: { number: string; name: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-400">
        {number}
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{name}</div>
        <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/* ── Main guide component ─────────────────────────────────────── */

export function GameGuide() {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<string>("overview");

  const toggle = (id: string) => setOpenId(openId === id ? "" : id);

  return (
    <section id="guide" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-indigo-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
              {t("cards.guide.eyebrow")}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {t("cards.guide.title")}
          </h2>
          <p className="mt-3 text-zinc-400 max-w-lg mx-auto">
            {t("cards.guide.subtitle")}
          </p>
        </motion.div>

        <div className="space-y-3">
          {/* OVERVIEW */}
          <AccordionItem
            section={SECTIONS[0]}
            isOpen={openId === "overview"}
            toggle={() => toggle("overview")}
            title={t("cards.guide.overview.title")}
          >
            <p>{t("cards.guide.overview.p1")}</p>
            <p>{t("cards.guide.overview.p2")}</p>
            <p>{t("cards.guide.overview.p3")}</p>
          </AccordionItem>

          {/* CARD TYPES */}
          <AccordionItem
            section={SECTIONS[1]}
            isOpen={openId === "cardTypes"}
            toggle={() => toggle("cardTypes")}
            title={t("cards.guide.cardTypes.title")}
          >
            <p>{t("cards.guide.cardTypes.intro")}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <TypeCard
                icon={<Cpu className="h-4 w-4 text-blue-400" />}
                name={t("cards.guide.cardTypes.unit.name")}
                color="border-blue-500/20"
                description={t("cards.guide.cardTypes.unit.desc")}
                image="/images/cards/unitcard.jpg"
              />
              <TypeCard
                icon={<Users className="h-4 w-4 text-emerald-400" />}
                name={t("cards.guide.cardTypes.pilot.name")}
                color="border-emerald-500/20"
                description={t("cards.guide.cardTypes.pilot.desc")}
                image="/images/cards/pilotcard.jpg"
              />
              <TypeCard
                icon={<Zap className="h-4 w-4 text-violet-400" />}
                name={t("cards.guide.cardTypes.command.name")}
                color="border-violet-500/20"
                description={t("cards.guide.cardTypes.command.desc")}
                image="/images/cards/commandcard.jpg"
              />
              <TypeCard
                icon={<Shield className="h-4 w-4 text-amber-400" />}
                name={t("cards.guide.cardTypes.base.name")}
                color="border-amber-500/20"
                description={t("cards.guide.cardTypes.base.desc")}
                image="/images/cards/basecard.jpg"
              />
            </div>

            {/* Additional card types strip */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
              {[
                { src: "/images/cards/resourcecard.jpg", label: "Resource" },
                { src: "/images/cards/tokencard.jpg", label: "EX Base" },
                { src: "/images/cards/usualbackside.jpg", label: "Card Back" },
                { src: "/images/cards/backsideofresourcecards.jpg", label: "Resource Back" },
                { src: "/images/cards/damagecounters.jpg", label: "Damage Dice" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="rounded-lg overflow-hidden border border-white/[0.06] aspect-[3/4]">
                    <img src={item.src} alt={item.label} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">{item.label}</span>
                </div>
              ))}
            </div>
          </AccordionItem>

          {/* SETUP */}
          <AccordionItem
            section={SECTIONS[2]}
            isOpen={openId === "setup"}
            toggle={() => toggle("setup")}
            title={t("cards.guide.setup.title")}
          >
            <ol className="list-decimal list-inside space-y-2">
              <li>{t("cards.guide.setup.s1")}</li>
              <li>{t("cards.guide.setup.s2")}</li>
              <li>{t("cards.guide.setup.s3")}</li>
              <li>{t("cards.guide.setup.s4")}</li>
              <li>{t("cards.guide.setup.s5")}</li>
              <li>{t("cards.guide.setup.s6")}</li>
            </ol>
          </AccordionItem>

          {/* PHASES */}
          <AccordionItem
            section={SECTIONS[3]}
            isOpen={openId === "phases"}
            toggle={() => toggle("phases")}
            title={t("cards.guide.phases.title")}
          >
            <p>{t("cards.guide.phases.intro")}</p>
            <div className="space-y-4">
              <PhaseStep number="1" name={t("cards.guide.phases.start.name")} desc={t("cards.guide.phases.start.desc")} />
              <PhaseStep number="2" name={t("cards.guide.phases.draw.name")} desc={t("cards.guide.phases.draw.desc")} />
              <PhaseStep number="3" name={t("cards.guide.phases.resource.name")} desc={t("cards.guide.phases.resource.desc")} />
              <PhaseStep number="4" name={t("cards.guide.phases.main.name")} desc={t("cards.guide.phases.main.desc")} />
              <PhaseStep number="5" name={t("cards.guide.phases.end.name")} desc={t("cards.guide.phases.end.desc")} />
            </div>
          </AccordionItem>

          {/* COMBAT */}
          <AccordionItem
            section={SECTIONS[4]}
            isOpen={openId === "combat"}
            toggle={() => toggle("combat")}
            title={t("cards.guide.combat.title")}
          >
            <p>{t("cards.guide.combat.p1")}</p>
            <p>{t("cards.guide.combat.p2")}</p>
            <p>{t("cards.guide.combat.p3")}</p>
          </AccordionItem>

          {/* KEYWORDS */}
          <AccordionItem
            section={SECTIONS[5]}
            isOpen={openId === "keywords"}
            toggle={() => toggle("keywords")}
            title={t("cards.guide.keywords.title")}
          >
            <p>{t("cards.guide.keywords.intro")}</p>
            <div className="space-y-3">
              {["link", "burst", "blocker", "firstStrike", "highManeuver", "breach", "support"].map((kw) => (
                <div key={kw} className="rounded-lg border border-violet-500/10 bg-violet-500/[0.03] p-3">
                  <p className="text-xs text-zinc-300">{t(`cards.guide.keywords.${kw}`)}</p>
                </div>
              ))}
            </div>
          </AccordionItem>

          {/* WINNING */}
          <AccordionItem
            section={SECTIONS[6]}
            isOpen={openId === "winning"}
            toggle={() => toggle("winning")}
            title={t("cards.guide.winning.title")}
          >
            <p>{t("cards.guide.winning.p1")}</p>
            <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/15 p-4">
              <div className="flex items-start gap-2">
                <Crosshair className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-yellow-400 mb-1">{t("cards.guide.winning.tip.title")}</div>
                  <p className="text-xs text-zinc-400">{t("cards.guide.winning.tip.desc")}</p>
                </div>
              </div>
            </div>
          </AccordionItem>
        </div>
      </div>
    </section>
  );
}

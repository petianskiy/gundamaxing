"use client";

import { motion } from "framer-motion";
import { Cpu, Users, Zap, Shield, Layers, ArrowRight, Info } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const SLOT_GROUPS = [
  {
    id: "units",
    icon: <Cpu className="h-5 w-5" />,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    range: "25-28",
  },
  {
    id: "pilots",
    icon: <Users className="h-5 w-5" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    range: "6-8",
  },
  {
    id: "commands",
    icon: <Zap className="h-5 w-5" />,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    range: "8-10",
  },
  {
    id: "bases",
    icon: <Shield className="h-5 w-5" />,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    range: "4-6",
  },
];

const COPY_RULES = [
  { copies: 4, colorDot: "bg-emerald-400" },
  { copies: 3, colorDot: "bg-blue-400" },
  { copies: 2, colorDot: "bg-amber-400" },
  { copies: 1, colorDot: "bg-zinc-400" },
];

export function DeckBuilder() {
  const { t } = useTranslation();

  return (
    <section id="deckbuilder" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white/[0.01]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-gx-red" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
              デッキ戦略 &middot; {t("cards.deck.eyebrow")}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {t("cards.deck.title")}
          </h2>
          <p className="mt-3 text-zinc-400 max-w-lg mx-auto">
            {t("cards.deck.subtitle")}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: deck composition */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8"
          >
            <h3 className="text-lg font-bold text-white mb-1">{t("cards.deck.composition.title")}</h3>
            <p className="text-xs text-zinc-500 mb-6">{t("cards.deck.composition.subtitle")}</p>

            {/* Visual bar */}
            <div className="flex rounded-full overflow-hidden h-3 mb-6">
              <div className="bg-blue-500 flex-[27]" title="Units" />
              <div className="bg-emerald-500 flex-[7]" title="Pilots" />
              <div className="bg-violet-500 flex-[9]" title="Commands" />
              <div className="bg-amber-500 flex-[5]" title="Bases" />
            </div>

            <div className="space-y-3">
              {SLOT_GROUPS.map((group) => (
                <div
                  key={group.id}
                  className={cn("flex items-center gap-3 rounded-xl border p-3.5", group.border, group.bg)}
                >
                  <span className={group.color}>{group.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{t(`cards.deck.slot.${group.id}`)}</div>
                    <div className="text-[11px] text-zinc-400">{t(`cards.deck.slot.${group.id}Desc`)}</div>
                  </div>
                  <span className={cn("text-lg font-bold", group.color)}>{group.range}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-zinc-500">
              <Info className="h-3.5 w-3.5 shrink-0" />
              {t("cards.deck.composition.note")}
            </div>
          </motion.div>

          {/* Right: copy guidelines + tips */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Copy guidelines */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
              <h3 className="text-lg font-bold text-white mb-1">{t("cards.deck.copies.title")}</h3>
              <p className="text-xs text-zinc-500 mb-5">{t("cards.deck.copies.subtitle")}</p>

              <div className="space-y-3">
                {COPY_RULES.map((rule) => (
                  <div key={rule.copies} className="flex items-start gap-3">
                    <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
                      {Array.from({ length: rule.copies }).map((_, j) => (
                        <div key={j} className={cn("w-2 h-2 rounded-full", rule.colorDot)} />
                      ))}
                      {Array.from({ length: 4 - rule.copies }).map((_, j) => (
                        <div key={j} className="w-2 h-2 rounded-full bg-zinc-800" />
                      ))}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {rule.copies}x {t(`cards.deck.copy.${rule.copies}.label`)}
                      </div>
                      <p className="text-xs text-zinc-400">{t(`cards.deck.copy.${rule.copies}.desc`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro tip */}
            <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.03] p-6 sm:p-8">
              <h3 className="text-sm font-bold text-violet-300 mb-2">{t("cards.deck.tip.title")}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{t("cards.deck.tip.p1")}</p>
              <p className="text-xs text-zinc-400 leading-relaxed mt-3">{t("cards.deck.tip.p2")}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { Check, AlertTriangle, Edit3, Save, RotateCcw, Loader2 } from "lucide-react";
import type { ScanResult, GCGCardType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ReviewPanelProps {
  imageUrl: string;
  scanResult: ScanResult;
  onSave: (data: ReviewFormData) => Promise<void>;
  onRescan: () => void;
  isSaving: boolean;
}

export interface ReviewFormData {
  cardId: string;
  name: string;
  cardType: GCGCardType | null;
  rarity: string | null;
  level: number | null;
  cost: number | null;
  ap: number | null;
  hp: number | null;
  abilityText: string | null;
  pilot: string | null;
  faction: string | null;
  environment: string | null;
}

function ConfidenceDot({ confidence }: { confidence: number }) {
  const color = confidence >= 0.8 ? "bg-green-400" : confidence >= 0.5 ? "bg-yellow-400" : "bg-red-400";
  return <span className={cn("w-2 h-2 rounded-full flex-shrink-0", color)} title={`${Math.round(confidence * 100)}%`} />;
}

function Field({
  label,
  value,
  confidence,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  confidence: number;
  onChange: (val: string) => void;
  type?: "text" | "number" | "textarea" | "select";
  required?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">{label}</label>
        <ConfidenceDot confidence={confidence} />
      </div>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-gx-red/50 resize-none"
        />
      ) : type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-sm text-white focus:outline-none focus:border-gx-red/50"
        >
          <option value="">Unknown</option>
          {["UNIT", "PILOT", "COMMAND", "BASE", "RESOURCE", "TOKEN"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={cn(
            "w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-gx-red/50",
            required && !value && "border-red-500/50"
          )}
        />
      )}
    </div>
  );
}

export function ReviewPanel({ imageUrl, scanResult, onSave, onRescan, isSaving }: ReviewPanelProps) {
  const f = scanResult.fields;
  const [form, setForm] = useState<ReviewFormData>({
    cardId: f.cardId.value ?? "",
    name: f.name.value ?? "",
    cardType: f.cardType.value ?? null,
    rarity: f.rarity.value ?? null,
    level: f.level.value ?? null,
    cost: f.cost.value ?? null,
    ap: f.ap.value ?? null,
    hp: f.hp.value ?? null,
    abilityText: f.abilityText.value ?? null,
    pilot: f.pilot.value ?? null,
    faction: f.faction.value ?? null,
    environment: f.environment.value ?? null,
  });

  const update = (key: keyof ReviewFormData, val: string) => {
    if (["level", "cost", "ap", "hp"].includes(key)) {
      setForm((prev) => ({ ...prev, [key]: val ? parseInt(val, 10) || null : null }));
    } else if (key === "cardType") {
      setForm((prev) => ({ ...prev, cardType: (val || null) as GCGCardType | null }));
    } else {
      setForm((prev) => ({ ...prev, [key]: val || null }));
    }
  };

  const canSave = form.cardId.trim().length > 0 && form.name.trim().length > 0;

  return (
    <div className="grid lg:grid-cols-2 gap-6 p-4 sm:p-6">
      {/* Card image */}
      <div>
        <div className="sticky top-4">
          <div className="rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl">
            <img src={imageUrl} alt="Scanned card" className="w-full h-auto" />
          </div>

          {/* Confidence banner */}
          <div className={cn(
            "mt-4 rounded-xl p-3 flex items-center gap-3 border",
            scanResult.overallConfidence >= 0.75
              ? "bg-green-500/10 border-green-500/20 text-green-300"
              : scanResult.overallConfidence >= 0.5
              ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-300"
              : "bg-red-500/10 border-red-500/20 text-red-300"
          )}>
            {scanResult.overallConfidence >= 0.75 ? (
              <Check className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium">
                {Math.round(scanResult.overallConfidence * 100)}% confidence
              </p>
              <p className="text-xs opacity-70">
                {scanResult.needsReview ? "Please review highlighted fields" : "Data looks good"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fields form */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Edit3 className="h-4 w-4 text-gx-red" />
          <h3 className="text-sm font-semibold text-white">Review Extracted Data</h3>
        </div>

        {/* Card ID — prominent */}
        <div className="rounded-xl border border-gx-red/20 bg-gx-red/5 p-4">
          <Field
            label="Card ID (required)"
            value={form.cardId}
            confidence={f.cardId.confidence}
            onChange={(v) => update("cardId", v)}
            required
          />
        </div>

        <Field label="Name (required)" value={form.name} confidence={f.name.confidence} onChange={(v) => update("name", v)} required />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Card Type" value={form.cardType ?? ""} confidence={f.cardType.confidence} onChange={(v) => update("cardType", v)} type="select" />
          <Field label="Rarity" value={form.rarity ?? ""} confidence={f.rarity.confidence} onChange={(v) => update("rarity", v)} />
        </div>

        <div className="grid grid-cols-4 gap-3">
          <Field label="Level" value={form.level?.toString() ?? ""} confidence={f.level.confidence} onChange={(v) => update("level", v)} type="number" />
          <Field label="Cost" value={form.cost?.toString() ?? ""} confidence={f.cost.confidence} onChange={(v) => update("cost", v)} type="number" />
          <Field label="AP" value={form.ap?.toString() ?? ""} confidence={f.ap.confidence} onChange={(v) => update("ap", v)} type="number" />
          <Field label="HP" value={form.hp?.toString() ?? ""} confidence={f.hp.confidence} onChange={(v) => update("hp", v)} type="number" />
        </div>

        <Field label="Ability Text" value={form.abilityText ?? ""} confidence={f.abilityText.confidence} onChange={(v) => update("abilityText", v)} type="textarea" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Pilot" value={form.pilot ?? ""} confidence={f.pilot.confidence} onChange={(v) => update("pilot", v)} />
          <Field label="Faction" value={form.faction ?? ""} confidence={f.faction.confidence} onChange={(v) => update("faction", v)} />
        </div>

        <Field label="Environment" value={form.environment ?? ""} confidence={f.environment.confidence} onChange={(v) => update("environment", v)} />

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => onSave(form)}
            disabled={!canSave || isSaving}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gx-red hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save to Collection"}
          </button>
          <button
            onClick={onRescan}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 text-sm font-medium transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Rescan
          </button>
        </div>
      </div>
    </div>
  );
}

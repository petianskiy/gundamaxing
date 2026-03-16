"use client";

import { useState } from "react";
import { Plus, Trash2, Check, X, Loader2 } from "lucide-react";
import type { CustomTemplateUI } from "@/lib/data/admin-templates";

interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
  type: "image" | "text" | "meta";
}

interface TemplateFormProps {
  initialData?: CustomTemplateUI;
  onSubmit: (data: {
    id?: string;
    name: string;
    category: string;
    slots: Slot[];
  }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export function TemplateForm({ initialData, onSubmit, onCancel, loading }: TemplateFormProps) {
  const isEdit = !!initialData;
  const [name, setName] = useState(initialData?.name ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "Custom");
  const [slots, setSlots] = useState<Slot[]>(
    initialData?.slots ?? [{ x: 5, y: 5, w: 90, h: 90, type: "image" }]
  );

  function addSlot() {
    setSlots((prev) => [...prev, { x: 1, y: 1, w: 48, h: 48, type: "image" }]);
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSlot(index: number, field: keyof Slot, value: number | string) {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, [field]: field === "type" ? value : Number(value) } : s
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      id: initialData?.id,
      name,
      category,
      slots,
    });
  }

  const slotColors: Record<string, { fill: string; stroke: string }> = {
    image: { fill: "#3f3f46", stroke: "#f59e0b" },
    text: { fill: "#52525b", stroke: "#d97706" },
    meta: { fill: "#71717a", stroke: "#b45309" },
  };

  return (
    <div className="rounded-xl border border-gx-gold/20 bg-gx-gold/5 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          {isEdit ? "Edit Template" : "New Template"}
        </h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name + Category */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. My Layout"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              placeholder="Custom"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            />
          </div>
        </div>

        {/* Live SVG Preview */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Preview</label>
          <div className="rounded-lg border border-border/50 bg-card p-3 flex justify-center">
            <svg viewBox="0 0 100 100" className="w-48 h-48">
              <rect x={0} y={0} width={100} height={100} fill="#18181b" rx={4} />
              {slots.map((slot, i) => {
                const colors = slotColors[slot.type] ?? slotColors.image;
                return (
                  <g key={i}>
                    <rect
                      x={slot.x}
                      y={slot.y}
                      width={slot.w}
                      height={slot.h}
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth={0.8}
                      rx={1.5}
                    />
                    <text
                      x={slot.x + slot.w / 2}
                      y={slot.y + slot.h / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={colors.stroke}
                      fontSize={Math.min(slot.w, slot.h) > 15 ? 5 : 3}
                      fontWeight="bold"
                    >
                      {slot.type === "image" ? "IMG" : slot.type === "text" ? "TXT" : "META"}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Slots List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground">
              Slots ({slots.length}) &mdash; {slots.filter((s) => s.type === "image").length} images
            </label>
            <button
              type="button"
              onClick={addSlot}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gx-gold hover:bg-gx-gold/10 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add Slot
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {slots.map((slot, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-card/50"
              >
                <span className="text-[10px] text-muted-foreground w-4 text-center shrink-0">
                  {i + 1}
                </span>
                <select
                  value={slot.type}
                  onChange={(e) => updateSlot(i, "type", e.target.value)}
                  className="px-2 py-1 rounded border border-border/50 bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
                >
                  <option value="image">Image</option>
                  <option value="text">Text</option>
                  <option value="meta">Meta</option>
                </select>
                {(["x", "y", "w", "h"] as const).map((field) => (
                  <div key={field} className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase">{field}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={slot[field]}
                      onChange={(e) => updateSlot(i, field, e.target.value)}
                      className="w-12 px-1.5 py-1 rounded border border-border/50 bg-card text-xs text-foreground text-center focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  disabled={slots.length <= 1}
                  className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ml-auto shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gx-gold/15 text-gx-gold text-sm font-medium hover:bg-gx-gold/25 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {isEdit ? "Save Changes" : "Create Template"}
          </button>
        </div>
      </form>
    </div>
  );
}

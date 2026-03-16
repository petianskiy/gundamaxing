"use client";

import { useState } from "react";
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  adminCreateTemplate,
  adminUpdateTemplate,
  adminDeleteTemplate,
  adminToggleTemplate,
  adminReorderTemplate,
} from "@/lib/actions/admin-templates";
import type { CustomTemplateUI } from "@/lib/data/admin-templates";
import { TemplateForm } from "./template-form";

interface TemplatesTableProps {
  templates: CustomTemplateUI[];
}

export function TemplatesTable({ templates }: TemplatesTableProps) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(data: {
    name: string;
    category: string;
    slots: { x: number; y: number; w: number; h: number; type: "image" | "text" | "meta" }[];
  }) {
    setLoading("create");
    setError(null);
    const result = await adminCreateTemplate(data);
    setLoading(null);
    if (result.error) {
      setError(result.error);
    } else {
      setShowCreateForm(false);
      router.refresh();
    }
  }

  async function handleUpdate(data: {
    id?: string;
    name: string;
    category: string;
    slots: { x: number; y: number; w: number; h: number; type: "image" | "text" | "meta" }[];
  }) {
    if (!data.id) return;
    setLoading("update");
    setError(null);
    const result = await adminUpdateTemplate({
      id: data.id,
      name: data.name,
      category: data.category,
      slots: data.slots,
    });
    setLoading(null);
    if (result.error) {
      setError(result.error);
    } else {
      setEditingId(null);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;
    setLoading(id);
    setError(null);
    const result = await adminDeleteTemplate(id);
    setLoading(null);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  async function handleToggle(id: string) {
    setLoading(id);
    setError(null);
    const result = await adminToggleTemplate(id);
    setLoading(null);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  async function handleReorder(id: string, direction: "up" | "down") {
    setLoading(id);
    await adminReorderTemplate(id, direction);
    setLoading(null);
    router.refresh();
  }

  const slotColors: Record<string, { fill: string; stroke: string }> = {
    image: { fill: "#3f3f46", stroke: "#52525b" },
    text: { fill: "#52525b", stroke: "#71717a" },
    meta: { fill: "#71717a", stroke: "#a1a1aa" },
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Create button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gx-gold/15 text-gx-gold text-sm font-medium hover:bg-gx-gold/25 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Template
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <TemplateForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
          loading={loading === "create"}
        />
      )}

      {/* Templates list */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {templates.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No custom templates yet. Create your first template above.
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {templates.map((template, idx) => (
              <div key={template.id}>
                {editingId === template.id ? (
                  <div className="p-4">
                    <TemplateForm
                      initialData={template}
                      onSubmit={handleUpdate}
                      onCancel={() => setEditingId(null)}
                      loading={loading === "update"}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                    {/* SVG Preview */}
                    <div className="w-12 h-12 shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <rect x={0} y={0} width={100} height={100} fill="#18181b" rx={4} />
                        {template.slots.map((slot, i) => {
                          const colors = slotColors[slot.type] ?? slotColors.image;
                          return (
                            <rect
                              key={i}
                              x={slot.x}
                              y={slot.y}
                              width={slot.w}
                              height={slot.h}
                              fill={colors.fill}
                              stroke={colors.stroke}
                              strokeWidth={0.5}
                              rx={1.5}
                            />
                          );
                        })}
                      </svg>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {template.name}
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground uppercase tracking-wider">
                          {template.category}
                        </span>
                        {!template.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 uppercase tracking-wider">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {template.slots.length} slots &middot; {template.imageCount} images
                        {template.slots.some((s) => s.type === "text") &&
                          ` \u00B7 ${template.slots.filter((s) => s.type === "text").length} text`}
                        {template.slots.some((s) => s.type === "meta") &&
                          ` \u00B7 ${template.slots.filter((s) => s.type === "meta").length} meta`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {loading === template.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <button
                            onClick={() => handleReorder(template.id, "up")}
                            disabled={idx === 0}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move up"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleReorder(template.id, "down")}
                            disabled={idx === templates.length - 1}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move down"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggle(template.id)}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            title={template.isActive ? "Deactivate" : "Activate"}
                          >
                            {template.isActive ? (
                              <Eye className="h-3.5 w-3.5" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingId(template.id)}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  adminCreateGuideStep,
  adminUpdateGuideStep,
  adminDeleteGuideStep,
  adminReorderGuideStep,
} from "@/lib/actions/admin-guide";
import { useRouter } from "next/navigation";

interface GuideStep {
  id: string;
  selector: string;
  title: string;
  description: string;
  tip: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface GuideStepManagerProps {
  steps: GuideStep[];
}

export function GuideStepManager({ steps }: GuideStepManagerProps) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  async function handleCreate(formData: FormData) {
    setLoading("create");
    setError(null);
    const result = await adminCreateGuideStep(formData);
    setLoading(null);
    if (result.error) {
      setError(result.error);
    } else {
      setShowCreateForm(false);
      router.refresh();
    }
  }

  async function handleUpdate(formData: FormData) {
    setLoading("update");
    setError(null);
    const result = await adminUpdateGuideStep(formData);
    setLoading(null);
    if (result.error) {
      setError(result.error);
    } else {
      setEditingId(null);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this guide step?")) return;
    setLoading(id);
    setError(null);
    const result = await adminDeleteGuideStep(id);
    setLoading(null);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  async function handleReorder(id: string, direction: "up" | "down") {
    setLoading(id);
    await adminReorderGuideStep(id, direction);
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-border/50"
        >
          <Eye className="h-4 w-4" />
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gx-gold/15 text-gx-gold text-sm font-medium hover:bg-gx-gold/25 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Step
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <StepForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
          loading={loading === "create"}
        />
      )}

      {/* Preview */}
      {showPreview && (
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
            Guide Preview (Active Steps)
          </h3>
          <div className="space-y-3">
            {steps
              .filter((s) => s.isActive)
              .map((step, idx) => (
                <div
                  key={step.id}
                  className="flex gap-3 p-3 rounded-lg bg-muted/20 border border-border/30"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gx-red/15 text-gx-red text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                    {step.tip && (
                      <p className="text-xs italic text-muted-foreground/70 mt-1">
                        Tip: {step.tip}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">
                      {step.selector}
                    </p>
                  </div>
                </div>
              ))}
            {steps.filter((s) => s.isActive).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active steps. The guide will fall back to hardcoded defaults.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step list */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {steps.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No guide steps yet. Create your first step above.
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {steps.map((step, idx) => (
              <div key={step.id}>
                {editingId === step.id ? (
                  <div className="p-4">
                    <StepForm
                      initialData={step}
                      onSubmit={handleUpdate}
                      onCancel={() => setEditingId(null)}
                      loading={loading === "update"}
                    />
                  </div>
                ) : (
                  <StepRow
                    step={step}
                    index={idx}
                    total={steps.length}
                    loading={loading === step.id}
                    onEdit={() => setEditingId(step.id)}
                    onDelete={() => handleDelete(step.id)}
                    onReorder={(dir) => handleReorder(step.id, dir)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step Row ─────────────────────────────────────────────────────

function StepRow({
  step,
  index,
  total,
  loading,
  onEdit,
  onDelete,
  onReorder,
}: {
  step: GuideStep;
  index: number;
  total: number;
  loading: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReorder: (dir: "up" | "down") => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
      {/* Sort order badge */}
      <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
        {index + 1}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {step.title}
          </p>
          {!step.isActive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 uppercase tracking-wider border border-red-500/20">
              Inactive
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate font-mono">
          {step.selector}
        </p>
      </div>

      {/* Description preview */}
      <div className="hidden lg:block max-w-[200px] flex-shrink-0">
        <p className="text-xs text-muted-foreground truncate">
          {step.description}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <>
            {/* Reorder */}
            <button
              onClick={() => onReorder("up")}
              disabled={index === 0}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Move up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onReorder("down")}
              disabled={index === total - 1}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Move down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {/* Edit */}
            <button
              onClick={onEdit}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            {/* Delete */}
            <button
              onClick={onDelete}
              className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Step Form ────────────────────────────────────────────────────

function StepForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
}: {
  initialData?: GuideStep;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isEdit = !!initialData;

  return (
    <div className="rounded-xl border border-gx-gold/20 bg-gx-gold/5 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          {isEdit ? "Edit Step" : "New Guide Step"}
        </h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={onSubmit} className="space-y-3">
        {isEdit && <input type="hidden" name="id" value={initialData.id} />}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title</label>
            <input
              name="title"
              defaultValue={initialData?.title}
              required
              placeholder="e.g. Add Images"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Selector</label>
            <input
              name="selector"
              defaultValue={initialData?.selector}
              required
              placeholder='e.g. [data-dock-item="add-image"]'
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50 font-mono text-xs"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <textarea
            name="description"
            defaultValue={initialData?.description}
            required
            rows={2}
            placeholder="Describe what this tool does..."
            className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50 resize-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tip (optional)</label>
          <textarea
            name="tip"
            defaultValue={initialData?.tip ?? ""}
            rows={2}
            placeholder="A helpful tip for this step..."
            className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50 resize-none"
          />
        </div>

        {isEdit && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Active</label>
            <select
              name="isActive"
              defaultValue={initialData.isActive ? "true" : "false"}
              className="px-3 py-1.5 rounded-lg border border-border/50 bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        )}

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
            {isEdit ? "Save Changes" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

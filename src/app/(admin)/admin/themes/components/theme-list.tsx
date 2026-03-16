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
  Image,
  Film,
  Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  adminCreateTheme,
  adminUpdateTheme,
  adminDeleteTheme,
  adminTogglePublish,
  adminReorderTheme,
} from "@/lib/actions/admin-themes";
import type { HangarThemeConfigUI } from "@/lib/data/admin-themes";
import { ThemeEditor, type ThemeFormData } from "./theme-editor";

interface ThemeListProps {
  themes: HangarThemeConfigUI[];
}

export function ThemeList({ themes }: ThemeListProps) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(data: ThemeFormData) {
    setLoading("create");
    setError(null);
    const result = await adminCreateTheme(data);
    setLoading(null);
    if (result.error) {
      setError(result.error);
    } else {
      setShowCreateForm(false);
      router.refresh();
    }
  }

  async function handleUpdate(data: ThemeFormData & { id?: string }) {
    if (!data.id) return;
    setLoading("update");
    setError(null);
    const result = await adminUpdateTheme({ ...data, id: data.id });
    setLoading(null);
    if (result.error) {
      setError(result.error);
    } else {
      setEditingId(null);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this theme?")) return;
    setLoading(id);
    setError(null);
    const result = await adminDeleteTheme(id);
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
    const result = await adminTogglePublish(id);
    setLoading(null);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  async function handleReorder(id: string, direction: "up" | "down") {
    setLoading(id);
    await adminReorderTheme(id, direction);
    setLoading(null);
    router.refresh();
  }

  const bgTypeIcon = (type: string) => {
    switch (type) {
      case "static": return <Image className="h-3 w-3" />;
      case "video": return <Film className="h-3 w-3" />;
      default: return <Layers className="h-3 w-3" />;
    }
  };

  const bgTypeLabel = (type: string) => {
    switch (type) {
      case "static": return "Static";
      case "video": return "Video";
      default: return "Carousel";
    }
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
          New Theme
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <ThemeEditor
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
          loading={loading === "create"}
        />
      )}

      {/* Themes list */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {themes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No custom themes yet. Create your first theme above.
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {themes.map((theme, idx) => (
              <div key={theme.id}>
                {editingId === theme.id ? (
                  <div className="p-4">
                    <ThemeEditor
                      initialData={theme}
                      onSubmit={handleUpdate}
                      onCancel={() => setEditingId(null)}
                      loading={loading === "update"}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                    {/* Badge color indicator */}
                    <div
                      className="w-10 h-10 rounded-lg shrink-0 border border-border/30"
                      style={{ backgroundColor: theme.badgeColor }}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {theme.name}
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          {bgTypeIcon(theme.backgroundType)}
                          {bgTypeLabel(theme.backgroundType)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                          LVL {theme.unlockLevel}
                        </span>
                        {theme.isPublished ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">
                            Published
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 uppercase tracking-wider">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {theme.backgroundType === "carousel" && theme.backgroundImages
                          ? `${theme.backgroundImages.length} images`
                          : theme.backgroundType === "video"
                            ? "Video background"
                            : "Static background"}
                        {theme.effects && theme.effects.length > 0
                          ? ` · ${theme.effects.length} effect(s)`
                          : ""}
                        {` · ${Math.round(theme.dimness * 100)}% dim`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {loading === theme.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <button
                            onClick={() => handleReorder(theme.id, "up")}
                            disabled={idx === 0}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move up"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleReorder(theme.id, "down")}
                            disabled={idx === themes.length - 1}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move down"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggle(theme.id)}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            title={theme.isPublished ? "Unpublish" : "Publish"}
                          >
                            {theme.isPublished ? (
                              <Eye className="h-3.5 w-3.5" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingId(theme.id)}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(theme.id)}
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

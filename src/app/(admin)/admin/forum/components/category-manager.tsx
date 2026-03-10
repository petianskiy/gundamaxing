"use client";

import { useState } from "react";
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  FolderPlus,
  X,
  Check,
  Loader2,
} from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategory,
} from "@/lib/actions/admin-forum";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  image: string | null;
  order: number;
  parentId: string | null;
  _count: { threads: number; children: number };
  children: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    image: string | null;
    order: number;
    parentId: string | null;
    _count: { threads: number; children: number };
  }[];
}

interface CategoryManagerProps {
  categories: Category[];
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    setLoading("create");
    setError(null);
    const result = await createCategory(formData);
    setLoading(null);
    if (result.error) {
      setError(result.error);
    } else {
      setShowCreateForm(false);
      setCreateParentId(null);
      router.refresh();
    }
  }

  async function handleUpdate(formData: FormData) {
    setLoading("update");
    setError(null);
    const result = await updateCategory(formData);
    setLoading(null);
    if (result.error) {
      setError(result.error);
    } else {
      setEditingId(null);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this category?")) return;
    setLoading(id);
    setError(null);
    const result = await deleteCategory(id);
    setLoading(null);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  async function handleReorder(id: string, direction: "up" | "down") {
    setLoading(id);
    await reorderCategory(id, direction);
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

      {/* Create button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setShowCreateForm(true);
            setCreateParentId(null);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gx-gold/15 text-gx-gold text-sm font-medium hover:bg-gx-gold/25 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Category
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <CategoryForm
          parentId={createParentId}
          parentName={
            createParentId
              ? categories.find((c) => c.id === createParentId)?.name ?? null
              : null
          }
          onSubmit={handleCreate}
          onCancel={() => {
            setShowCreateForm(false);
            setCreateParentId(null);
          }}
          loading={loading === "create"}
        />
      )}

      {/* Category list */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No categories yet. Create your first category above.
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {categories.map((cat, idx) => (
              <div key={cat.id}>
                {editingId === cat.id ? (
                  <div className="p-4">
                    <CategoryForm
                      initialData={cat}
                      onSubmit={handleUpdate}
                      onCancel={() => setEditingId(null)}
                      loading={loading === "update"}
                    />
                  </div>
                ) : (
                  <CategoryRow
                    category={cat}
                    index={idx}
                    total={categories.length}
                    loading={loading === cat.id}
                    onEdit={() => setEditingId(cat.id)}
                    onDelete={() => handleDelete(cat.id)}
                    onReorder={(dir) => handleReorder(cat.id, dir)}
                    onAddSubcategory={() => {
                      setShowCreateForm(true);
                      setCreateParentId(cat.id);
                    }}
                  />
                )}

                {/* Subcategories */}
                {cat.children.length > 0 && (
                  <div className="border-t border-border/20">
                    {cat.children.map((child, childIdx) => (
                      <div key={child.id} className="pl-8">
                        {editingId === child.id ? (
                          <div className="p-4">
                            <CategoryForm
                              initialData={child}
                              onSubmit={handleUpdate}
                              onCancel={() => setEditingId(null)}
                              loading={loading === "update"}
                            />
                          </div>
                        ) : (
                          <CategoryRow
                            category={child}
                            index={childIdx}
                            total={cat.children.length}
                            loading={loading === child.id}
                            isChild
                            onEdit={() => setEditingId(child.id)}
                            onDelete={() => handleDelete(child.id)}
                            onReorder={(dir) => handleReorder(child.id, dir)}
                          />
                        )}
                      </div>
                    ))}
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

// ─── Category Row ────────────────────────────────────────────────

function CategoryRow({
  category,
  index,
  total,
  loading,
  isChild,
  onEdit,
  onDelete,
  onReorder,
  onAddSubcategory,
}: {
  category: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    _count: { threads: number; children: number };
  };
  index: number;
  total: number;
  loading: boolean;
  isChild?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReorder: (dir: "up" | "down") => void;
  onAddSubcategory?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
      {/* Color indicator + icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
        style={{ backgroundColor: `${category.color}20`, color: category.color }}
      >
        {category.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {category.name}
          </p>
          {isChild && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground uppercase tracking-wider">
              Sub
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {category.description}
        </p>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
        <span>{category._count.threads} threads</span>
        {!isChild && <span>{category._count.children} subs</span>}
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

            {/* Add subcategory */}
            {onAddSubcategory && (
              <button
                onClick={onAddSubcategory}
                className="p-1.5 rounded text-muted-foreground hover:text-gx-gold hover:bg-gx-gold/10 transition-colors"
                title="Add subcategory"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
            )}

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

// ─── Category Form ───────────────────────────────────────────────

function CategoryForm({
  initialData,
  parentId,
  parentName,
  onSubmit,
  onCancel,
  loading,
}: {
  initialData?: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    image: string | null;
  };
  parentId?: string | null;
  parentName?: string | null;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isEdit = !!initialData;

  return (
    <div className="rounded-xl border border-gx-gold/20 bg-gx-gold/5 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          {isEdit ? "Edit Category" : parentName ? `New Subcategory in "${parentName}"` : "New Category"}
        </h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form
        action={onSubmit}
        className="space-y-3"
      >
        {isEdit && <input type="hidden" name="id" value={initialData.id} />}
        {parentId && <input type="hidden" name="parentId" value={parentId} />}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name</label>
            <input
              name="name"
              defaultValue={initialData?.name}
              required
              placeholder="e.g. Kit Reviews"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Icon (emoji)</label>
            <input
              name="icon"
              defaultValue={initialData?.icon}
              required
              placeholder="e.g. 🔧"
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <input
            name="description"
            defaultValue={initialData?.description}
            required
            placeholder="Brief description of this category"
            className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Color (hex)</label>
            <div className="flex items-center gap-2">
              <input
                name="color"
                defaultValue={initialData?.color ?? "#dc2626"}
                required
                placeholder="#dc2626"
                className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Image URL (optional)</label>
            <input
              name="image"
              defaultValue={initialData?.image ?? ""}
              placeholder="/images/categories/..."
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            />
          </div>
        </div>

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

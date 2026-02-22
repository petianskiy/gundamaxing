"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomRole, updateCustomRole, deleteCustomRole } from "@/lib/actions/roles";
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  type Permission,
} from "@/lib/permissions";
import { Trash2 } from "lucide-react";

interface RoleFormProps {
  mode: "create" | "edit";
  roleId?: string;
  initialData?: {
    name: string;
    displayName: string;
    color: string;
    icon: string;
    description: string;
    permissions: string[];
    priority: number;
  };
}

export function RoleForm({ mode, roleId, initialData }: RoleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(initialData?.name ?? "");
  const [displayName, setDisplayName] = useState(
    initialData?.displayName ?? ""
  );
  const [color, setColor] = useState(initialData?.color ?? "#71717a");
  const [icon, setIcon] = useState(initialData?.icon ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [permissions, setPermissions] = useState<Set<string>>(
    new Set(initialData?.permissions ?? [])
  );
  const [priority, setPriority] = useState(initialData?.priority ?? 0);

  function togglePermission(perm: string) {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) {
        next.delete(perm);
      } else {
        next.add(perm);
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("displayName", displayName);
    formData.set("color", color);
    formData.set("icon", icon);
    formData.set("description", description);
    formData.set("priority", String(priority));
    for (const perm of permissions) {
      formData.append("permissions", perm);
    }

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCustomRole(formData)
          : await updateCustomRole(roleId!, formData);

      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        if (mode === "create" && "id" in result && result.id) {
          router.push(`/admin/roles/${result.id}`);
        }
      }
    });
  }

  function handleDelete() {
    if (!roleId) return;
    if (!confirm("Are you sure you want to delete this role?")) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteCustomRole(roleId);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        router.push("/admin/roles");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card p-5 space-y-5">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Role Details
        </h3>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground" htmlFor="role-name">
            Name (slug identifier)
          </label>
          <input
            id="role-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. beta-tester"
            className="w-full px-3 py-2 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gx-red/50 focus:border-gx-red/50 transition-colors"
            required
          />
        </div>

        {/* Display Name */}
        <div className="space-y-1.5">
          <label
            className="text-xs text-muted-foreground"
            htmlFor="role-displayName"
          >
            Display Name
          </label>
          <input
            id="role-displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Beta Tester"
            className="w-full px-3 py-2 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gx-red/50 focus:border-gx-red/50 transition-colors"
            required
          />
        </div>

        {/* Color */}
        <div className="space-y-1.5">
          <label
            className="text-xs text-muted-foreground"
            htmlFor="role-color"
          >
            Color (hex)
          </label>
          <div className="flex items-center gap-3">
            <input
              id="role-color"
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#ff0000"
              className="flex-1 px-3 py-2 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gx-red/50 focus:border-gx-red/50 transition-colors font-mono"
              required
            />
            <div
              className="h-9 w-9 rounded-lg border border-border/50 shrink-0"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>

        {/* Icon */}
        <div className="space-y-1.5">
          <label
            className="text-xs text-muted-foreground"
            htmlFor="role-icon"
          >
            Icon (optional, emoji or text)
          </label>
          <input
            id="role-icon"
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="e.g. a shield emoji"
            className="w-full px-3 py-2 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gx-red/50 focus:border-gx-red/50 transition-colors"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label
            className="text-xs text-muted-foreground"
            htmlFor="role-description"
          >
            Description (optional)
          </label>
          <textarea
            id="role-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this role grant?"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-gx-red/50 focus:border-gx-red/50 transition-colors"
          />
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <label
            className="text-xs text-muted-foreground"
            htmlFor="role-priority"
          >
            Priority (0-999, higher = more prominent)
          </label>
          <input
            id="role-priority"
            type="number"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
            min={0}
            max={999}
            className="w-full px-3 py-2 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gx-red/50 focus:border-gx-red/50 transition-colors"
          />
        </div>
      </div>

      {/* Permissions */}
      <div className="rounded-xl border border-border/50 bg-card p-5 space-y-5">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Permissions
        </h3>

        {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
          <div key={group} className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {group}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {perms.map((perm) => (
                <label
                  key={perm}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/30 bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={permissions.has(perm)}
                    onChange={() => togglePermission(perm)}
                    className="rounded border-border/50 text-gx-red focus:ring-gx-red/50"
                  />
                  <span className="text-xs text-foreground">
                    {PERMISSION_LABELS[perm as Permission]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Error / Success */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && mode === "edit" && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Role updated successfully.
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-gx-red/10 text-gx-red border border-gx-red/20 hover:bg-gx-red/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? "Saving..."
            : mode === "create"
              ? "Create Role"
              : "Save Changes"}
        </button>

        {mode === "edit" && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Role
          </button>
        )}
      </div>
    </form>
  );
}

import Link from "next/link";
import { Tags, Plus, Users, Shield } from "lucide-react";
import { getAllCustomRoles } from "@/lib/data/roles";

export default async function RolesPage() {
  const roles = await getAllCustomRoles();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tags className="h-6 w-6 text-gx-gold" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              ROLE MANAGEMENT
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage custom roles with granular permissions
            </p>
          </div>
        </div>
        <Link
          href="/admin/roles/create"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gx-red/10 text-gx-red border border-gx-red/20 hover:bg-gx-red/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Role
        </Link>
      </div>

      {/* Role Cards */}
      {roles.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">
            No Custom Roles
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first custom role to assign granular permissions to
            users.
          </p>
          <Link
            href="/admin/roles/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gx-red/10 text-gx-red border border-gx-red/20 hover:bg-gx-red/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Role
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Link
              key={role.id}
              href={`/admin/roles/${role.id}`}
              className="group rounded-xl border border-border/50 bg-card p-5 hover:border-border transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                {/* Color badge */}
                <div
                  className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-sm"
                  style={{ backgroundColor: role.color + "30", color: role.color }}
                >
                  {role.icon || role.displayName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-gx-red transition-colors truncate">
                    {role.displayName}
                  </h3>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {role.name}
                  </p>
                </div>
              </div>

              {role.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {role.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {role._count.users} user{role._count.users !== 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {role.permissions.length} perm
                  {role.permissions.length !== 1 ? "s" : ""}
                </span>
                <span
                  className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border"
                  style={{
                    backgroundColor: role.color + "15",
                    color: role.color,
                    borderColor: role.color + "30",
                  }}
                >
                  P{role.priority}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

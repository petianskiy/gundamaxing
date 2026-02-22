import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCustomRole } from "@/lib/data/roles";
import { RoleForm } from "../components/role-form";
import { RoleUserManager } from "../components/role-user-manager";

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const role = await getCustomRole(id);

  if (!role) {
    return (
      <div className="space-y-8">
        <Link
          href="/admin/roles"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Roles
        </Link>
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Role Not Found
          </h3>
          <p className="text-sm text-muted-foreground">
            This role may have been deleted.
          </p>
        </div>
      </div>
    );
  }

  const initialUsers = role.users.map((ur) => ({
    id: ur.user.id,
    username: ur.user.username,
    avatar: ur.user.avatar,
    assignedAt: ur.assignedAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/roles"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Roles
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-sm"
            style={{
              backgroundColor: role.color + "30",
              color: role.color,
            }}
          >
            {role.icon || role.displayName[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {role.displayName}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              {role.name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Role Form */}
        <div className="lg:col-span-2">
          <RoleForm
            mode="edit"
            roleId={role.id}
            initialData={{
              name: role.name,
              displayName: role.displayName,
              color: role.color,
              icon: role.icon ?? "",
              description: role.description ?? "",
              permissions: role.permissions,
              priority: role.priority,
            }}
          />
        </div>

        {/* User Manager */}
        <div>
          <RoleUserManager roleId={role.id} initialUsers={initialUsers} />
        </div>
      </div>
    </div>
  );
}

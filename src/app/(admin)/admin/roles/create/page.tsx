import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { RoleForm } from "../components/role-form";

export default function CreateRolePage() {
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          CREATE ROLE
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define a new custom role with specific permissions
        </p>
      </div>

      <div className="max-w-2xl">
        <RoleForm mode="create" />
      </div>
    </div>
  );
}

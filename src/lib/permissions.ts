// ─── PERMISSION CONSTANTS ─────────────────────────────────────────
// Central source of truth for all granular permissions in the system.
// System roles (ADMIN, MODERATOR, USER) map to preset permission sets.
// Custom roles can grant any combination of these permissions.

export const PERMISSIONS = {
  view_users: "view_users",
  manage_users: "manage_users",
  ban_users: "ban_users",
  view_reports: "view_reports",
  resolve_reports: "resolve_reports",
  moderate_content: "moderate_content",
  delete_content: "delete_content",
  manage_roles: "manage_roles",
  view_events: "view_events",
  manage_system: "manage_system",
  access_admin: "access_admin",
  access_mod: "access_mod",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_users: "View Users",
  manage_users: "Manage Users",
  ban_users: "Ban / Unban Users",
  view_reports: "View Reports",
  resolve_reports: "Resolve Reports",
  moderate_content: "Moderate Content",
  delete_content: "Delete Content",
  manage_roles: "Manage Roles",
  view_events: "View Event Logs",
  manage_system: "Manage System Settings",
  access_admin: "Access Admin Panel",
  access_mod: "Access Mod Tools",
};

export const PERMISSION_GROUPS: Record<string, Permission[]> = {
  "User Management": [
    PERMISSIONS.view_users,
    PERMISSIONS.manage_users,
    PERMISSIONS.ban_users,
  ],
  "Content Moderation": [
    PERMISSIONS.view_reports,
    PERMISSIONS.resolve_reports,
    PERMISSIONS.moderate_content,
    PERMISSIONS.delete_content,
  ],
  Administration: [
    PERMISSIONS.manage_roles,
    PERMISSIONS.view_events,
    PERMISSIONS.manage_system,
    PERMISSIONS.access_admin,
    PERMISSIONS.access_mod,
  ],
};

export const SYSTEM_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: Object.values(PERMISSIONS),
  MODERATOR: [
    PERMISSIONS.view_users,
    PERMISSIONS.view_reports,
    PERMISSIONS.resolve_reports,
    PERMISSIONS.moderate_content,
    PERMISSIONS.delete_content,
    PERMISSIONS.view_events,
    PERMISSIONS.access_mod,
  ],
  USER: [],
};

/**
 * Check whether a user has a specific permission based on their
 * system role plus any custom-role permissions granted to them.
 */
export function hasPermission(
  systemRole: string,
  customPermissions: string[],
  permission: Permission
): boolean {
  const systemPerms = SYSTEM_ROLE_PERMISSIONS[systemRole] ?? [];
  if (systemPerms.includes(permission)) return true;
  return customPermissions.includes(permission);
}

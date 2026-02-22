"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/data/events";
import { revalidatePath } from "next/cache";
import {
  createRoleSchema,
  updateRoleSchema,
  assignRoleSchema,
} from "@/lib/validations/roles";

export async function createCustomRole(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return { error: "Only administrators can create roles." };
    }

    const raw = {
      name: formData.get("name") as string,
      displayName: formData.get("displayName") as string,
      color: formData.get("color") as string,
      icon: (formData.get("icon") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      permissions: formData.getAll("permissions") as string[],
      priority: formData.get("priority")
        ? parseInt(formData.get("priority") as string, 10)
        : undefined,
    };

    const parsed = createRoleSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { error: firstError?.message ?? "Invalid input." };
    }

    const existing = await db.customRole.findUnique({
      where: { name: parsed.data.name },
    });
    if (existing) {
      return { error: "A role with that name already exists." };
    }

    const role = await db.customRole.create({
      data: {
        name: parsed.data.name,
        displayName: parsed.data.displayName,
        color: parsed.data.color,
        icon: parsed.data.icon ?? null,
        description: parsed.data.description ?? null,
        permissions: parsed.data.permissions,
        priority: parsed.data.priority ?? 0,
      },
    });

    await logEvent("SETTING_CHANGED", {
      userId: session.user.id,
      metadata: {
        action: "create_custom_role",
        roleId: role.id,
        roleName: role.name,
      } as Record<string, unknown>,
    });

    revalidatePath("/admin/roles");
    return { success: true, id: role.id };
  } catch (error) {
    console.error("createCustomRole error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function updateCustomRole(id: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return { error: "Only administrators can update roles." };
    }

    const raw: Record<string, unknown> = {};
    if (formData.get("name")) raw.name = formData.get("name") as string;
    if (formData.get("displayName"))
      raw.displayName = formData.get("displayName") as string;
    if (formData.get("color")) raw.color = formData.get("color") as string;
    if (formData.has("icon")) raw.icon = (formData.get("icon") as string) || undefined;
    if (formData.has("description"))
      raw.description = (formData.get("description") as string) || undefined;
    if (formData.getAll("permissions").length > 0)
      raw.permissions = formData.getAll("permissions") as string[];
    if (formData.get("priority"))
      raw.priority = parseInt(formData.get("priority") as string, 10);

    const parsed = updateRoleSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { error: firstError?.message ?? "Invalid input." };
    }

    const existing = await db.customRole.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Role not found." };
    }

    // Check name uniqueness if name is being changed
    if (parsed.data.name && parsed.data.name !== existing.name) {
      const nameConflict = await db.customRole.findUnique({
        where: { name: parsed.data.name },
      });
      if (nameConflict) {
        return { error: "A role with that name already exists." };
      }
    }

    await db.customRole.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.displayName !== undefined && {
          displayName: parsed.data.displayName,
        }),
        ...(parsed.data.color !== undefined && { color: parsed.data.color }),
        ...(parsed.data.icon !== undefined && {
          icon: parsed.data.icon ?? null,
        }),
        ...(parsed.data.description !== undefined && {
          description: parsed.data.description ?? null,
        }),
        ...(parsed.data.permissions !== undefined && {
          permissions: parsed.data.permissions,
        }),
        ...(parsed.data.priority !== undefined && {
          priority: parsed.data.priority,
        }),
      },
    });

    await logEvent("SETTING_CHANGED", {
      userId: session.user.id,
      metadata: {
        action: "update_custom_role",
        roleId: id,
        roleName: parsed.data.name ?? existing.name,
      } as Record<string, unknown>,
    });

    revalidatePath("/admin/roles");
    revalidatePath(`/admin/roles/${id}`);
    return { success: true };
  } catch (error) {
    console.error("updateCustomRole error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function deleteCustomRole(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return { error: "Only administrators can delete roles." };
    }

    const role = await db.customRole.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!role) {
      return { error: "Role not found." };
    }

    if (role._count.users > 0) {
      return {
        error: `Cannot delete role "${role.displayName}" — it is still assigned to ${role._count.users} user(s). Remove all users first.`,
      };
    }

    await db.customRole.delete({ where: { id } });

    await logEvent("SETTING_CHANGED", {
      userId: session.user.id,
      metadata: {
        action: "delete_custom_role",
        roleId: id,
        roleName: role.name,
      } as Record<string, unknown>,
    });

    revalidatePath("/admin/roles");
    return { success: true };
  } catch (error) {
    console.error("deleteCustomRole error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function assignRoleToUser(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const admin = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return { error: "Only administrators can assign roles." };
    }

    const raw = {
      userId: formData.get("userId") as string,
      customRoleId: formData.get("customRoleId") as string,
    };

    const parsed = assignRoleSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { error: firstError?.message ?? "Invalid input." };
    }

    // Check for existing assignment
    const existing = await db.userCustomRole.findUnique({
      where: {
        userId_customRoleId: {
          userId: parsed.data.userId,
          customRoleId: parsed.data.customRoleId,
        },
      },
    });

    if (existing) {
      return { error: "User already has this role." };
    }

    await db.userCustomRole.create({
      data: {
        userId: parsed.data.userId,
        customRoleId: parsed.data.customRoleId,
        assignedBy: session.user.id,
      },
    });

    await logEvent("CUSTOM_ROLE_ASSIGNED", {
      userId: session.user.id,
      metadata: {
        targetUserId: parsed.data.userId,
        customRoleId: parsed.data.customRoleId,
      } as Record<string, unknown>,
    });

    revalidatePath("/admin/roles");
    revalidatePath(`/admin/roles/${parsed.data.customRoleId}`);
    revalidatePath(`/admin/users/${parsed.data.userId}`);
    return { success: true };
  } catch (error) {
    console.error("assignRoleToUser error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function removeRoleFromUser(
  userId: string,
  customRoleId: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const admin = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return { error: "Only administrators can remove roles." };
    }

    const assignment = await db.userCustomRole.findUnique({
      where: {
        userId_customRoleId: { userId, customRoleId },
      },
    });

    if (!assignment) {
      return { error: "User does not have this role." };
    }

    await db.userCustomRole.delete({
      where: { id: assignment.id },
    });

    await logEvent("CUSTOM_ROLE_REMOVED", {
      userId: session.user.id,
      metadata: {
        targetUserId: userId,
        customRoleId,
      } as Record<string, unknown>,
    });

    revalidatePath("/admin/roles");
    revalidatePath(`/admin/roles/${customRoleId}`);
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (error) {
    console.error("removeRoleFromUser error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function searchUsersForRole(query: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    if (!query || query.trim().length < 1) {
      return { users: [] };
    }

    const users = await db.user.findMany({
      where: {
        username: {
          contains: query.trim(),
          mode: "insensitive",
        },
      },
      take: 10,
      select: {
        id: true,
        username: true,
        avatar: true,
      },
      orderBy: { username: "asc" },
    });

    return { users };
  } catch (error) {
    console.error("searchUsersForRole error:", error);
    return { error: "An unexpected error occurred." };
  }
}

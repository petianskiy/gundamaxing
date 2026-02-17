"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { BuildStatus } from "@prisma/client";

const buildSchema = z.object({
  title: z.string().min(1).max(200),
  kitName: z.string().min(1).max(200),
  grade: z.string().min(1),
  timeline: z.string().optional(),
  scale: z.string().optional(),
  status: z.string().optional(),
  techniques: z.array(z.string()).optional(),
  paintSystem: z.string().optional(),
  topcoat: z.string().optional(),
  timeInvested: z.string().optional(),
  tools: z.array(z.string()).optional(),
  intentStatement: z.string().max(1000).optional(),
});

export async function createBuild(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in to create a build." };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, emailVerified: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    if (!user.emailVerified) {
      return { error: "You must verify your email before creating builds." };
    }

    // Parse form data
    const techniquesRaw = formData.get("techniques") as string | null;
    const toolsRaw = formData.get("tools") as string | null;

    const raw = {
      title: formData.get("title") as string,
      kitName: formData.get("kitName") as string,
      grade: formData.get("grade") as string,
      timeline: (formData.get("timeline") as string) || undefined,
      scale: (formData.get("scale") as string) || undefined,
      status: (formData.get("status") as string) || undefined,
      techniques: techniquesRaw ? JSON.parse(techniquesRaw) : undefined,
      paintSystem: (formData.get("paintSystem") as string) || undefined,
      topcoat: (formData.get("topcoat") as string) || undefined,
      timeInvested: (formData.get("timeInvested") as string) || undefined,
      tools: toolsRaw ? JSON.parse(toolsRaw) : undefined,
      intentStatement:
        (formData.get("intentStatement") as string) || undefined,
    };

    const parsed = buildSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: "Invalid build data." };
    }

    const data = parsed.data;

    const build = await db.build.create({
      data: {
        title: data.title,
        kitName: data.kitName,
        grade: data.grade,
        timeline: data.timeline ?? "",
        scale: data.scale ?? "",
        status: (data.status as BuildStatus) ?? "WIP",
        techniques: data.techniques ?? [],
        paintSystem: data.paintSystem ?? null,
        topcoat: data.topcoat ?? null,
        timeInvested: data.timeInvested ?? null,
        tools: data.tools ?? [],
        intentStatement: data.intentStatement ?? null,
        userId: user.id,
      },
    });

    return { success: true, buildId: build.id };
  } catch (error) {
    console.error("createBuild error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function deleteBuild(buildId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const build = await db.build.findUnique({
      where: { id: buildId },
      select: { id: true, userId: true },
    });

    if (!build) {
      return { error: "Build not found." };
    }

    // Check if user is the owner or an admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    const isOwner = build.userId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return { error: "You do not have permission to delete this build." };
    }

    // Delete build - cascades to images, comments, likes, etc.
    await db.build.delete({
      where: { id: buildId },
    });

    return { success: true };
  } catch (error) {
    console.error("deleteBuild error:", error);
    return { error: "An unexpected error occurred." };
  }
}

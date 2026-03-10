"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/data/events";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    throw new Error("Insufficient permissions");
  }

  return session.user.id;
}

export async function selectMissionWinner(submissionId: string) {
  try {
    const adminId = await requireAdmin();

    const submission = await db.missionSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, missionId: true, userId: true },
    });

    if (!submission) {
      return { error: "Submission not found." };
    }

    await db.monthlyMission.update({
      where: { id: submission.missionId },
      data: { winnerId: submission.id },
    });

    await logEvent("SETTING_CHANGED", {
      userId: adminId,
      metadata: {
        key: "mission_winner",
        action: "select_winner",
        submissionId,
        missionId: submission.missionId,
      },
    });

    revalidatePath("/admin/missions");
    revalidatePath("/mission");
    revalidatePath("/forum");
    return { success: true };
  } catch (error) {
    console.error("[selectMissionWinner]", error);
    return { error: "Failed to select winner." };
  }
}

export async function clearMissionWinner(missionId: string) {
  try {
    const adminId = await requireAdmin();

    await db.monthlyMission.update({
      where: { id: missionId },
      data: { winnerId: null },
    });

    await logEvent("SETTING_CHANGED", {
      userId: adminId,
      metadata: { key: "mission_winner", action: "clear_winner", missionId },
    });

    revalidatePath("/admin/missions");
    revalidatePath("/mission");
    return { success: true };
  } catch (error) {
    console.error("[clearMissionWinner]", error);
    return { error: "Failed to clear winner." };
  }
}

export async function adminDeleteSubmission(submissionId: string) {
  try {
    const adminId = await requireAdmin();

    const submission = await db.missionSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, missionId: true },
    });

    if (!submission) {
      return { error: "Submission not found." };
    }

    // Clear winner if this submission was the winner
    await db.monthlyMission.updateMany({
      where: { winnerId: submissionId },
      data: { winnerId: null },
    });

    await db.missionSubmission.delete({
      where: { id: submissionId },
    });

    await logEvent("CONTENT_MODERATED", {
      userId: adminId,
      metadata: {
        action: "delete_mission_submission",
        submissionId,
        missionId: submission.missionId,
      },
    });

    revalidatePath("/admin/missions");
    revalidatePath("/mission");
    revalidatePath("/forum");
    return { success: true };
  } catch (error) {
    console.error("[adminDeleteSubmission]", error);
    return { error: "Failed to delete submission." };
  }
}

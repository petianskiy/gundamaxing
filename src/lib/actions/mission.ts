"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const submitMissionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  images: z
    .array(z.string().url())
    .min(1, "At least 1 image is required")
    .max(20, "Maximum 20 images allowed"),
  videoUrl: z.string().url().nullable().optional(),
});

export async function submitMission(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const raw = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      images: JSON.parse((formData.get("images") as string) || "[]"),
      videoUrl: (formData.get("videoUrl") as string) || null,
    };

    const parsed = submitMissionSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid submission data.";
      return { error: firstError };
    }

    const mission = await db.monthlyMission.findFirst({
      where: { isActive: true },
    });

    if (!mission) {
      return { error: "No active mission." };
    }

    if (new Date() > mission.endDate) {
      return { error: "This mission has ended. Submissions are closed." };
    }

    // Upsert: create if new, update if user already submitted
    await db.missionSubmission.upsert({
      where: {
        missionId_userId: {
          missionId: mission.id,
          userId: session.user.id,
        },
      },
      create: {
        missionId: mission.id,
        userId: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        images: parsed.data.images,
        videoUrl: parsed.data.videoUrl ?? null,
      },
      update: {
        title: parsed.data.title,
        description: parsed.data.description,
        images: parsed.data.images,
        videoUrl: parsed.data.videoUrl ?? null,
      },
    });

    revalidatePath("/mission");
    revalidatePath("/forum");
    return { success: true };
  } catch (error) {
    console.error("[submitMission]", error);
    return { error: "Failed to submit." };
  }
}

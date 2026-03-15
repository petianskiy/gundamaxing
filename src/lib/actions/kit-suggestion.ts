"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { checkBanned } from "@/lib/security/ban-check";
import { kitSuggestionSchema } from "@/lib/validations/kit-suggestion";

export async function submitKitSuggestion(data: {
  kitName: string;
  seriesName: string;
  grade: string;
  scale?: string | null;
  manufacturer?: string;
  notes?: string | null;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const banError = await checkBanned(session.user.id);
    if (banError) return { error: banError };

    const parsed = kitSuggestionSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const rateLimitResult = await checkRateLimit(
      `kit-suggestion:${session.user.id}`,
      5,
      3600_000
    );
    if (!rateLimitResult.success) {
      return { error: "You can only submit 5 suggestions per hour. Please try again later." };
    }

    await db.kitSuggestion.create({
      data: {
        userId: session.user.id,
        kitName: parsed.data.kitName,
        seriesName: parsed.data.seriesName,
        grade: parsed.data.grade,
        scale: parsed.data.scale ?? null,
        manufacturer: parsed.data.manufacturer,
        notes: parsed.data.notes ?? null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[submitKitSuggestion]", error);
    return { error: "An unexpected error occurred." };
  }
}

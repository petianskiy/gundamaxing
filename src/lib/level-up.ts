import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

/**
 * Check if a user has leveled up and send appropriate notifications.
 * Call this after any XP change.
 */
export async function checkLevelUpAndNotify(
  userId: string,
  previousLevel: number
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true },
  });
  if (!user) return;

  const currentLevel = user.level;
  if (currentLevel <= previousLevel) return;

  // Build notification message
  let message = `You reached Level ${currentLevel}! Keep building!`;
  const unlocks: string[] = [];

  // Check for theme unlocks at this level
  const themeUnlocks: Record<number, string> = {
    3: "Cyber Bay",
    9: "Clean Lab",
    15: "Desert Battlefield",
    20: "Neon Tokyo",
  };

  if (themeUnlocks[currentLevel]) {
    unlocks.push(`New Hangar Theme unlocked: ${themeUnlocks[currentLevel]}`);
  }

  // Level 5 unlocks extra showcase pages
  if (currentLevel >= 5 && previousLevel < 5) {
    unlocks.push("5 extra showcase pages unlocked");
  }

  if (unlocks.length > 0) {
    message += "\n" + unlocks.join("\n");
  }

  await createNotification({
    userId,
    type: "SYSTEM",
    title: `Level Up! → Level ${currentLevel}`,
    message,
    actionUrl: unlocks.some((u) => u.includes("Theme"))
      ? "/settings/hangar"
      : undefined,
  });
}

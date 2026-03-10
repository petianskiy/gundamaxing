import { db } from "@/lib/db";

const BAN_ERROR = "Your account has been suspended. You cannot perform this action.";

/**
 * Check if user is banned (riskScore >= 100).
 * Returns the error string if banned, null if not.
 */
export async function checkBanned(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { riskScore: true },
  });
  if (!user) return "User not found.";
  if (user.riskScore >= 100) return BAN_ERROR;
  return null;
}

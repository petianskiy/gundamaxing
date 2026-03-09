import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // If session has a valid username, redirect to hangar
  if (session.user.username) {
    redirect(`/hangar/${session.user.username}`);
  }

  // Session has a user ID but no username — this can happen when the JWT
  // callback had stale data after a new OAuth signup. Fetch from DB directly.
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });

  if (dbUser?.username) {
    redirect(`/hangar/${dbUser.username}`);
  }

  // No username at all — send to builds as a safe fallback
  redirect("/builds");
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompleteProfileForm } from "./complete-profile-form";

export default async function CompleteProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, username: true, displayName: true, onboardingComplete: true },
  });

  if (!user) redirect("/login");
  if (user.onboardingComplete) redirect("/builds");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <CompleteProfileForm
          currentUsername={user.username}
          currentDisplayName={user.displayName}
        />
      </div>
    </div>
  );
}

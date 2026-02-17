import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AccountSettingsForm } from "./account-settings-form";

export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      verificationTier: true,
      passwordHash: true,
      createdAt: true,
    },
  });
  if (!user) redirect("/login");

  return (
    <AccountSettingsForm
      memberSince={user.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      role={user.role}
      verificationTier={user.verificationTier}
      hasPassword={!!user.passwordHash}
    />
  );
}

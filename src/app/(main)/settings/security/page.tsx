import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserSettingsData } from "@/lib/data/users";
import { db } from "@/lib/db";
import { SecuritySettingsForm } from "./security-settings-form";

export default async function SecuritySettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, linkedAccounts] = await Promise.all([
    getUserSettingsData(session.user.id),
    db.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true },
    }),
  ]);
  if (!user) redirect("/login");

  return (
    <SecuritySettingsForm
      email={user.email}
      hasPassword={!!user.passwordHash}
      linkedProviders={linkedAccounts.map((a) => a.provider)}
    />
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserSettingsData } from "@/lib/data/users";
import { SecuritySettingsForm } from "./security-settings-form";

export default async function SecuritySettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getUserSettingsData(session.user.id);
  if (!user) redirect("/login");

  return (
    <SecuritySettingsForm
      email={user.email}
      hasPassword={!!user.passwordHash}
    />
  );
}

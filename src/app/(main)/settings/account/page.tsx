import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserSettingsData } from "@/lib/data/users";
import { AccountSettingsForm } from "./account-settings-form";

export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getUserSettingsData(session.user.id);
  if (!user) redirect("/login");

  return (
    <AccountSettingsForm
      memberSince={user.createdAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
      hasPassword={!!user.passwordHash}
    />
  );
}

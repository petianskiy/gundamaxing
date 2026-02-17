import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserSettingsData } from "@/lib/data/users";
import { IdentitySettingsForm } from "./identity-settings-form";

export default async function IdentitySettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getUserSettingsData(session.user.id);
  if (!user) redirect("/login");

  return (
    <IdentitySettingsForm
      initialData={{
        country: user.country ?? "",
        skillLevel: user.skillLevel,
        preferredGrades: user.preferredGrades,
        favoriteTimelines: user.favoriteTimelines,
        tools: user.tools,
        techniques: user.techniques,
      }}
    />
  );
}

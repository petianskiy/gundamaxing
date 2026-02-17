import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserSettingsData } from "@/lib/data/users";
import { PrivacySettingsForm } from "./privacy-settings-form";

export default async function PrivacySettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getUserSettingsData(session.user.id);
  if (!user) redirect("/login");

  return (
    <PrivacySettingsForm
      initialData={{
        isProfilePrivate: user.isProfilePrivate,
        hiddenSections: user.hiddenSections,
        sectionOrder: user.sectionOrder.length > 0
          ? user.sectionOrder
          : ["featured", "gallery", "wip", "workshop", "achievements"],
      }}
    />
  );
}

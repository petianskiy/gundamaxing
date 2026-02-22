import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserSettingsData } from "@/lib/data/users";
import { ProfileSettingsForm } from "./profile-settings-form";

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getUserSettingsData(session.user.id);
  if (!user) redirect("/login");

  const socialLinks = (user.socialLinks as Record<string, string> | null) ?? {};

  return (
    <ProfileSettingsForm
      initialData={{
        displayName: user.displayName ?? "",
        username: user.username,
        bio: user.bio ?? "",
        avatar: user.avatar ?? "",
        banner: user.banner ?? "",
        accentColor: user.accentColor ?? "#dc2626",
        socialLinks: {
          twitter: socialLinks.twitter ?? "",
          instagram: socialLinks.instagram ?? "",
          youtube: socialLinks.youtube ?? "",
          github: socialLinks.github ?? "",
          discord: socialLinks.discord ?? "",
          tiktok: socialLinks.tiktok ?? "",
        },
      }}
      lastUsernameChange={user.lastUsernameChange?.toISOString() ?? null}
    />
  );
}

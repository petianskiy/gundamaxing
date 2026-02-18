import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserSettingsData } from "@/lib/data/users";
import { getBuildsByUserId } from "@/lib/data/builds";
import { db } from "@/lib/db";
import { HangarSettingsForm } from "./hangar-settings-form";
import { EraManager } from "./era-manager";

export default async function HangarSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [user, builds, eras] = await Promise.all([
    getUserSettingsData(userId),
    getBuildsByUserId(userId),
    db.buildEra.findMany({
      where: { userId },
      orderBy: { order: "asc" },
      include: {
        builds: {
          include: {
            build: {
              select: { id: true, title: true, kitName: true },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    }),
  ]);

  if (!user) redirect("/login");

  const simplifiedBuilds = builds.map((b) => ({
    id: b.id,
    title: b.title,
    kitName: b.kitName,
  }));

  return (
    <div className="space-y-10">
      <HangarSettingsForm
        initialData={{
          hangarTheme: user.hangarTheme ?? "CYBER_BAY",
          hangarLayout: user.hangarLayout ?? "GALLERY",
          manifesto: user.manifesto ?? "",
        }}
      />
      <EraManager initialEras={eras} allBuilds={simplifiedBuilds} />
    </div>
  );
}

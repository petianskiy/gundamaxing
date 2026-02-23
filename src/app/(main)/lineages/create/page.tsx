import { redirect } from "next/navigation";
import { GitFork } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserBuildsForLineage } from "@/lib/data/lineages";
import { LineageCreator } from "@/components/lineage/lineage-creator";

export const metadata = {
  title: "Create Lineage | Gundamaxing",
};

export default async function CreateLineagePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/lineages/create");

  const userBuilds = await getUserBuildsForLineage(session.user.id);

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <GitFork className="h-5 w-5 text-gx-red" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
              系譜 · Build DNA
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create Lineage</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Document your creative evolution
          </p>
        </div>

        <LineageCreator userBuilds={userBuilds} />
      </div>
    </div>
  );
}

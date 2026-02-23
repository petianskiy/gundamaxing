import Link from "next/link";
import { redirect } from "next/navigation";
import { GitFork, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { getLineagesByUserId } from "@/lib/data/lineages";
import { LineagesMineClient } from "./mine-client";

export const metadata = {
  title: "My Lineages | Gundamaxing",
};

export default async function MyLineagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/lineages/mine");

  const lineages = await getLineagesByUserId(session.user.id);

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitFork className="h-4 w-4 text-gx-red" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gx-red">
                系譜
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">My Lineages</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your build lineages</p>
          </div>
          <Link
            href="/lineages/create"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gx-red text-white text-sm font-medium hover:bg-red-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Lineage
          </Link>
        </div>

        {lineages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <GitFork className="h-16 w-16 mb-6 opacity-20" />
            <p className="text-sm">You haven&apos;t created any lineages yet.</p>
            <p className="text-xs mt-1">Create your first lineage to document your building journey.</p>
            <Link
              href="/lineages/create"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gx-red hover:text-red-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Lineage
            </Link>
          </div>
        ) : (
          <LineagesMineClient lineages={lineages} />
        )}
      </div>
    </div>
  );
}

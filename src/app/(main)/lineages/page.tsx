import Link from "next/link";
import { GitFork, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { getPublicLineages } from "@/lib/data/lineages";
import { LineageCard } from "@/components/lineage/lineage-card";

export const metadata = {
  title: "Build Lineages | Gundamaxing",
  description: "Explore how builds evolve — from base kit to masterwork",
};

export default async function LineagesPage() {
  const [{ lineages }, session] = await Promise.all([
    getPublicLineages(),
    auth(),
  ]);

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <GitFork className="h-5 w-5 text-gx-red" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
              系譜 · Build DNA
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Build Lineages
          </h1>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Explore how builds evolve — from base kit to masterwork
          </p>

          {session?.user && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/lineages/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gx-red text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Lineage
              </Link>
              <Link
                href="/lineages/mine"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                My Lineages
              </Link>
            </div>
          )}
        </div>

        {/* Grid */}
        {lineages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <GitFork className="h-16 w-16 mb-6 opacity-20" />
            <p className="text-sm">No public lineages yet. Be the first to share your building journey!</p>
            {session?.user && (
              <Link
                href="/lineages/create"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gx-red hover:text-red-400 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Lineage
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lineages.map((lineage) => (
              <LineageCard key={lineage.id} lineage={lineage} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

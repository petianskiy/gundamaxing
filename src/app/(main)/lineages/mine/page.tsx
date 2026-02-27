import Image from "next/image";
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
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-20">
        <Image
          src="/images/lineages-bg.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-black/60" />
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
              My Lineages
            </h1>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Manage your build lineages
            </p>
            <div className="mt-6">
              <Link
                href="/lineages/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gx-red text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Lineage
              </Link>
            </div>
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
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { GitFork, ArrowLeft, Pencil, Share2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { getLineageBySlug } from "@/lib/data/lineages";
import { LineageTree } from "@/components/lineage/lineage-tree";
import { LineageShareButton } from "./share-button";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function LineageDetailPage({ params }: Props) {
  const { slug } = await params;
  const [lineage, session] = await Promise.all([
    getLineageBySlug(slug),
    auth(),
  ]);

  if (!lineage) notFound();

  // Check access: if private, only owner can view
  const isOwner = session?.user?.id === lineage.userId;
  if (!lineage.isPublic && !isOwner) notFound();

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back link */}
        <Link
          href="/lineages"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Lineages
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GitFork className="h-4 w-4 text-gx-red" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gx-red">
                Build Lineage
              </span>
              {!lineage.isPublic && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                  Private
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{lineage.title}</h1>
            {lineage.description && (
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{lineage.description}</p>
            )}
            <div className="mt-3 flex items-center gap-2">
              {lineage.userAvatar && (
                <Link href={`/u/${lineage.userHandle}`} className="relative w-6 h-6 rounded-full overflow-hidden ring-1 ring-border/50">
                  <Image src={lineage.userAvatar} alt={lineage.username} fill className="object-cover" unoptimized />
                </Link>
              )}
              <Link href={`/u/${lineage.userHandle}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {lineage.username}
              </Link>
              <span className="text-xs text-muted-foreground/50">&middot;</span>
              <span className="text-xs text-muted-foreground/50">{lineage.updatedAt}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LineageShareButton />
            {isOwner && (
              <Link
                href={`/lineages/${slug}/edit`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 border border-border text-sm font-medium text-foreground hover:bg-zinc-700 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            )}
          </div>
        </div>

        {/* Tree visualization */}
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <LineageTree nodes={lineage.nodes} />
        </div>
      </div>
    </div>
  );
}

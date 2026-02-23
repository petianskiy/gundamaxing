import { notFound, redirect } from "next/navigation";
import { GitFork } from "lucide-react";
import { auth } from "@/lib/auth";
import { getLineageBySlug, getUserBuildsForLineage } from "@/lib/data/lineages";
import { LineageCreator } from "@/components/lineage/lineage-creator";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditLineagePage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/lineages/${slug}/edit`);

  const [lineage, userBuilds] = await Promise.all([
    getLineageBySlug(slug),
    getUserBuildsForLineage(session.user.id),
  ]);

  if (!lineage) notFound();
  if (lineage.userId !== session.user.id) notFound();

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
          <h1 className="text-2xl font-bold text-foreground">Edit Lineage</h1>
        </div>

        <LineageCreator
          userBuilds={userBuilds}
          existingLineage={{
            id: lineage.id,
            slug: lineage.slug,
            title: lineage.title,
            description: lineage.description,
            isPublic: lineage.isPublic,
            nodes: lineage.nodes,
          }}
        />
      </div>
    </div>
  );
}

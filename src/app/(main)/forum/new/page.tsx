import { getCategories } from "@/lib/data/categories";
import { ThreadForm } from "@/components/forum/thread-form";

type Props = { searchParams: Promise<{ category?: string }> };

export default async function NewThreadPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const categories = await getCategories();

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">
          New Thread
        </h1>
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <ThreadForm categories={categories} defaultCategoryId={category} />
        </div>
      </div>
    </div>
  );
}

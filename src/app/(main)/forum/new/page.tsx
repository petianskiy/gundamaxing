import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getLeafCategories } from "@/lib/data/categories";
import { NewThreadClient } from "./new-thread-client";

type Props = { searchParams: Promise<{ category?: string }> };

export default async function NewThreadPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const categories = await getLeafCategories();

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-20">
        <Image
          src="/images/forum-new-bg.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] font-share-tech-mono text-white/40 mb-8">
            <Link href="/forum" className="hover:text-white/70 transition-colors uppercase tracking-wider">
              Forum
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/70 uppercase tracking-wider">New Thread</span>
          </div>

          <NewThreadClient categories={categories} defaultCategoryId={category} />
        </div>
      </div>
    </div>
  );
}

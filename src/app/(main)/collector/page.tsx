import Link from "next/link";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { BookOpen, Layers, Lock } from "lucide-react";

export const metadata = {
  title: "Collector | Gundamaxing",
  description: "Explore the Gunpla kit database and Gundam collectible card catalog.",
};

export default function CollectorGateway() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/collector-bg.jpg')" }} />
      <div className="fixed inset-0 -z-10 bg-black/70" />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">

          {/* Hero */}
          <div className="animate-page-header text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-gx-red" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
                収集家 &middot; Collector
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Choose Your Collection
            </h1>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Track Gunpla model kits or explore the Gundam Card Game catalog.
            </p>
          </div>

          {/* Two hero cards */}
          <div className="animate-page-grid grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">

            {/* Gundams Card */}
            <Link
              href="/collector/gundams"
              className="group relative rounded-2xl border border-white/[0.08] overflow-hidden transition-all hover:border-white/[0.2] hover:shadow-2xl hover:shadow-gx-red/10 hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/collector-kits.jpg"
                  alt="Gunpla Collection"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                {/* Content overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-gx-red" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gx-red">
                      模型キット
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Gunpla Kits
                  </h2>
                  <p className="text-sm text-zinc-400 mt-2 max-w-xs">
                    Track your collection, rate kits, write reviews, and discover new model kits.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500 group-hover:text-gx-red transition-colors">
                    <span>Browse kits</span>
                    <svg className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* Collectible Cards — Coming Soon */}
            <div className="group relative rounded-2xl border border-white/[0.08] overflow-hidden cursor-not-allowed opacity-60">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/collector-cards.jpg"
                  alt="Gundam Collectible Cards"
                  fill
                  className="object-cover grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                {/* Lock overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 bg-black/60 rounded-xl px-5 py-3 border border-white/10">
                    <Lock className="h-6 w-6 text-zinc-400" />
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">Coming Soon</span>
                  </div>
                </div>

                {/* Content overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-5 w-5 text-gx-red" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gx-red">
                      カードゲーム
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Collectible Cards
                  </h2>
                  <p className="text-sm text-zinc-400 mt-2 max-w-xs">
                    Explore the Gundam Card Game — starter decks, booster packs, and premium sets.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

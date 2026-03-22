import { redirect } from "next/navigation";
import Link from "next/link";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { FlaskConical } from "lucide-react";

export const metadata = {
  title: "Supply Catalog | Gundamaxing",
  description: "Browse paints, tools, primers, cements, and more from top Gunpla brands.",
};

const BRAND_CONFIG: Record<string, { logo: string; bg: string; tagline: string }> = {
  "DSPIAE": {
    logo: "/brands/dspiae.jpg",
    bg: "from-red-950/40 to-black/60",
    tagline: "Precision tools for serious builders",
  },
  "Gaia Notes": {
    logo: "/brands/gaia-notes.jpg",
    bg: "from-indigo-950/40 to-black/60",
    tagline: "Premium lacquer paints from Japan",
  },
  "GodHand": {
    logo: "/brands/godhand.jpg",
    bg: "from-blue-950/40 to-black/60",
    tagline: "Professional-grade nippers and abrasives",
  },
  "Mr. Hobby": {
    logo: "/brands/mr-hobby.jpg",
    bg: "from-blue-950/40 to-black/60",
    tagline: "The industry standard for Gunpla finishing",
  },
  "Tamiya": {
    logo: "/brands/tamiya.jpg",
    bg: "from-red-950/40 to-black/60",
    tagline: "Essential supplies trusted by every modeler",
  },
};

function brandSlug(brand: string): string {
  return brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
}

async function getBrandCounts() {
  const counts = await db.supply.groupBy({
    by: ["brand"],
    where: { isActive: true },
    _count: true,
  });
  return Object.fromEntries(counts.map((c) => [c.brand, c._count]));
}

export default async function SuppliesPage() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/");
  }

  const brandCounts = await getBrandCounts();
  const brands = Object.keys(BRAND_CONFIG);

  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/brands/supplies-bg.jpg')" }}
      />
      <div className="fixed inset-0 -z-10 bg-black/75" />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">

          {/* Hero */}
          <div className="animate-page-header text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-3">
              <FlaskConical className="h-5 w-5 text-gx-red" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
                素材目録 &middot; Supply Catalog
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Supply Catalog
            </h1>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Browse paints, tools, primers, and more from the brands that define Gunpla building.
            </p>
          </div>

          {/* Brand Cards */}
          <div className="animate-page-grid space-y-4">
            {brands.map((brand) => {
              const config = BRAND_CONFIG[brand];
              const count = brandCounts[brand] || 0;
              const slug = brandSlug(brand);

              return (
                <Link
                  key={brand}
                  href={`/supplies/${slug}`}
                  className="group block rounded-2xl border border-white/[0.08] overflow-hidden transition-all hover:border-white/[0.16] hover:shadow-xl hover:shadow-black/30"
                >
                  <div className={`relative flex items-center gap-6 px-6 sm:px-8 py-6 sm:py-8 bg-gradient-to-r ${config.bg} backdrop-blur-sm`}>
                    {/* Brand logo */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-black/40 border border-white/[0.1] flex items-center justify-center overflow-hidden shrink-0 group-hover:border-white/[0.2] transition-colors">
                      <Image
                        src={config.logo}
                        alt={brand}
                        width={80}
                        height={80}
                        className="object-contain"
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight group-hover:text-white transition-colors">
                        {brand}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {config.tagline}
                      </p>
                      <p className="text-xs text-muted-foreground/50 mt-2">
                        {count} {count === 1 ? "product" : "products"} in catalog
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="text-muted-foreground/30 group-hover:text-gx-red group-hover:translate-x-1 transition-all shrink-0">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}

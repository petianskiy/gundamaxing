import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { BrandCatalog } from "./brand-catalog";

const BRAND_SLUGS: Record<string, string> = {
  "dspiae": "DSPIAE",
  "gaia-notes": "Gaia Notes",
  "godhand": "GodHand",
  "mr-hobby": "Mr. Hobby",
  "tamiya": "Tamiya",
};

const BRAND_META: Record<string, { logo: string; tagline: string }> = {
  "DSPIAE": { logo: "/brands/dspiae.jpg", tagline: "Precision tools for serious builders" },
  "Gaia Notes": { logo: "/brands/gaia-notes.jpg", tagline: "Premium lacquer paints from Japan" },
  "GodHand": { logo: "/brands/godhand.jpg", tagline: "Professional-grade nippers and abrasives" },
  "Mr. Hobby": { logo: "/brands/mr-hobby.jpg", tagline: "The industry standard for Gunpla finishing" },
  "Tamiya": { logo: "/brands/tamiya.jpg", tagline: "Essential supplies trusted by every modeler" },
};

type Props = { params: Promise<{ brand: string }> };

export async function generateMetadata({ params }: Props) {
  const { brand: slug } = await params;
  const brandName = BRAND_SLUGS[slug];
  if (!brandName) return { title: "Not Found" };
  return {
    title: `${brandName} Supplies | Gundamaxing`,
    description: `Browse ${brandName} products — paints, tools, primers, and more.`,
  };
}

export default async function BrandPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/");
  }

  const { brand: slug } = await params;
  const brandName = BRAND_SLUGS[slug];
  if (!brandName) notFound();

  const supplies = await db.supply.findMany({
    where: { brand: brandName, isActive: true },
    select: {
      id: true,
      brand: true,
      productLine: true,
      name: true,
      code: true,
      category: true,
      subcategory: true,
      finish: true,
      solventType: true,
      colorHex: true,
      slug: true,
      searchName: true,
      _count: { select: { buildSupplies: true } },
    },
    orderBy: [{ category: "asc" }, { productLine: "asc" }, { name: "asc" }],
  });

  const items = supplies.map(({ _count, ...s }) => ({
    ...s,
    buildCount: _count.buildSupplies,
  }));

  const meta = BRAND_META[brandName] || { logo: "", tagline: "" };

  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/brands/supplies-bg.jpg')" }}
      />
      <div className="fixed inset-0 -z-10 bg-black/75" />
      <BrandCatalog brand={brandName} logo={meta.logo} tagline={meta.tagline} supplies={items} />
    </div>
  );
}

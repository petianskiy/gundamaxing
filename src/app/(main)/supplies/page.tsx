import { db } from "@/lib/db";
import { SupplyCatalogView } from "./supplies-catalog";

export const metadata = {
  title: "Supply Catalog | Gundamaxing",
  description: "Browse the Gunpla supply catalog — paints, tools, primers, cements, and more from Mr. Hobby, Tamiya, Gaia Notes, and other brands.",
};

async function getSupplyCatalog() {
  const supplies = await db.supply.findMany({
    where: { isActive: true },
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
      _count: { select: { buildSupplies: true } },
    },
    orderBy: [{ brand: "asc" }, { productLine: "asc" }, { name: "asc" }],
  });

  return supplies.map(({ _count, ...s }) => ({
    ...s,
    buildCount: _count.buildSupplies,
  }));
}

export default async function SuppliesPage() {
  const supplies = await getSupplyCatalog();

  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/brands/supplies-bg.jpg')" }}
      />
      <div className="fixed inset-0 -z-10 bg-black/70" />
      <SupplyCatalogView supplies={supplies} />
    </div>
  );
}

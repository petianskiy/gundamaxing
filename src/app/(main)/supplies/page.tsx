import { db } from "@/lib/db";
import { SupplyCatalogView } from "./supplies-catalog";

export const metadata = {
  title: "Supplies | Gundamaxing",
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

  return <SupplyCatalogView supplies={supplies} />;
}

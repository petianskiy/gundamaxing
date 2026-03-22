import Link from "next/link";
import { db } from "@/lib/db";
import { CardsCatalog } from "./cards-catalog";

export const metadata = {
  title: "Gundam Card Game | Gundamaxing",
  description: "Browse the Gundam Card Game catalog — starter decks, booster packs, premium collections, and accessories.",
};

async function getCardProducts() {
  const products = await db.cardProduct.findMany({
    where: { isActive: true },
    orderBy: [{ releaseDate: "desc" }, { sortOrder: "asc" }],
  });
  return products.map((p) => ({
    ...p,
    price: p.price ? Number(p.price) : null,
    releaseDate: p.releaseDate?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export default async function CardsPage() {
  const products = await getCardProducts();

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-indigo-950 via-zinc-950 to-black" />
      <div className="fixed inset-0 -z-10 bg-black/30" />
      <CardsCatalog products={products} />
    </div>
  );
}

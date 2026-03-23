import { db } from "@/lib/db";
import { CardsLanding } from "./cards-landing";

export const metadata = {
  title: "Gundam Card Game | Gundamaxing",
  description:
    "The ultimate Gundam Card Game hub. Learn the rules, explore cards, build decks, and track your collection.",
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

  return <CardsLanding products={products} />;
}

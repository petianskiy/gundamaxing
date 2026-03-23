import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserCards, getUserCardStats } from "@/lib/data/card-collection";
import { MyCardsGrid } from "./card-grid";

export const metadata = {
  title: "My Cards | Gundamaxing",
  description: "Your Gundam Card Game collection.",
};

export default async function MyCardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [cards, stats] = await Promise.all([
    getUserCards(session.user.id),
    getUserCardStats(session.user.id),
  ]);

  return <MyCardsGrid cards={cards} stats={stats} />;
}

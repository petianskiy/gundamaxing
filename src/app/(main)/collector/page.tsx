import { auth } from "@/lib/auth";
import { getKitCatalog, getDistinctGrades, getDistinctSeries, getUserCollection } from "@/lib/data/collector";
import { KitCatalog } from "./components/kit-catalog";
import type { KitStatus } from "@/lib/types";

export const metadata = {
  title: "Collector's Lore | Gundamaxing",
  description: "Track your Gunpla collection, rate kits, and share reviews with the community",
};

export default async function CollectorPage() {
  const [{ kits }, grades, seriesList, session] = await Promise.all([
    getKitCatalog({ limit: 500 }),
    getDistinctGrades(),
    getDistinctSeries(),
    auth(),
  ]);

  // Build a map of kitId -> user status for the logged-in user
  let userStatuses: Record<string, KitStatus> = {};
  if (session?.user?.id) {
    const collection = await getUserCollection(session.user.id);
    userStatuses = Object.fromEntries(
      collection.map((uk) => [uk.kitId, uk.status])
    );
  }

  return (
    <KitCatalog
      kits={kits}
      grades={grades}
      seriesList={seriesList}
      userStatuses={userStatuses}
    />
  );
}

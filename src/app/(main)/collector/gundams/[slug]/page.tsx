import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getKitBySlug, getUserKitStatus } from "@/lib/data/collector";
import { KitDetail } from "../components/kit-detail";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getKitBySlug(slug);

  if (!data) {
    return { title: "Kit Not Found | Gundamaxing" };
  }

  const { kit } = data;
  return {
    title: `${kit.name} (${kit.grade}) | Collector's Lore | Gundamaxing`,
    description: `${kit.name} - ${kit.grade} ${kit.scale ?? ""} from ${kit.seriesName}. ${kit.totalOwners} collectors. ${kit.avgRating !== null ? `Average rating: ${kit.avgRating}/10.` : ""}`,
    openGraph: {
      title: `${kit.name} (${kit.grade})`,
      description: `${kit.seriesName} - ${kit.grade}${kit.scale ? ` ${kit.scale}` : ""}`,
      ...(kit.imageUrl ? { images: [{ url: kit.imageUrl }] } : {}),
    },
  };
}

export default async function KitDetailPage({ params }: Props) {
  const { slug } = await params;
  const [data, session] = await Promise.all([
    getKitBySlug(slug),
    auth(),
  ]);

  if (!data) notFound();

  const { kit, reviews } = data;

  let userEntry = null;
  if (session?.user?.id) {
    userEntry = await getUserKitStatus(session.user.id, kit.id);
  }

  return (
    <KitDetail
      kit={kit}
      reviews={reviews}
      userEntry={userEntry}
      isLoggedIn={!!session?.user}
    />
  );
}

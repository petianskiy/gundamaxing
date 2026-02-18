import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getHangarByUsername } from "@/lib/data/hangar";
import { HangarShell } from "./components/hangar-shell";

type Props = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const hangarData = await getHangarByUsername(handle);

  if (!hangarData) {
    return { title: "Hangar Not Found | Gundamaxing" };
  }

  const { user } = hangarData;
  const name = user.displayName || user.username;

  return {
    title: `${name}'s Hangar (@${user.username}) | Gundamaxing`,
    description: user.manifesto || `Explore ${name}'s Gunpla hangar on Gundamaxing.`,
    openGraph: {
      title: `${name}'s Hangar | Gundamaxing`,
      description: user.manifesto || undefined,
      images: user.avatar ? [{ url: user.avatar }] : undefined,
    },
  };
}

export default async function HangarPage({ params }: Props) {
  const { handle } = await params;

  const [hangarData, session] = await Promise.all([
    getHangarByUsername(handle),
    auth(),
  ]);

  if (!hangarData) notFound();

  const isOwner = session?.user?.id === hangarData.user.id;

  if (hangarData.user.isProfilePrivate && !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground">Private Hangar</h1>
          <p className="text-muted-foreground mt-2">
            This builder&apos;s hangar is set to private.
          </p>
        </div>
      </div>
    );
  }

  return (
    <HangarShell
      user={hangarData.user}
      featuredBuild={hangarData.featuredBuild}
      latestBuilds={hangarData.latestBuilds}
      eras={hangarData.eras}
      unassignedBuilds={hangarData.unassignedBuilds}
      isOwner={isOwner}
      currentUserId={session?.user?.id}
    />
  );
}

import Image from "next/image";
import { getBuilds } from "@/lib/data/builds";
import { BuildsFeed } from "./builds-feed";

export default async function BuildsPage() {
  const builds = await getBuilds();
  return (
    <div className="relative min-h-screen">
      {/* Fixed background — wrapper handles position so Image stays stable */}
      <div className="fixed inset-0 -z-20">
        <Image
          src="/images/builds-bg.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-black/70 backdrop-blur-[2px]" />
      <BuildsFeed builds={builds} />
    </div>
  );
}

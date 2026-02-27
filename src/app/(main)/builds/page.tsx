import Image from "next/image";
import { getBuilds } from "@/lib/data/builds";
import { BuildsFeed } from "./builds-feed";

export default async function BuildsPage() {
  const builds = await getBuilds();
  return (
    <div className="relative min-h-screen">
      <Image
        src="/images/builds-bg.jpg"
        alt=""
        fill
        className="object-cover object-center fixed"
        priority
        unoptimized
      />
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" />
      <div className="relative z-10">
        <BuildsFeed builds={builds} />
      </div>
    </div>
  );
}

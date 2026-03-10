import { getBuilds } from "@/lib/data/builds";
import { BuildsFeed } from "./builds-feed";

export const metadata = {
  title: "Builds | Gundamaxing",
  description: "Browse custom Gunpla builds from the community — filter by grade, technique, and more.",
};

export default async function BuildsPage() {
  const builds = await getBuilds();
  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/builds-bg.jpg')" }}
      />
      <div className="fixed inset-0 -z-10 bg-black/60" />
      <BuildsFeed builds={builds} />
    </div>
  );
}

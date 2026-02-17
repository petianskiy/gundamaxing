import { getBuilds } from "@/lib/data/builds";
import { BuildsFeed } from "./builds-feed";

export default async function BuildsPage() {
  const builds = await getBuilds();
  return <BuildsFeed builds={builds} />;
}

import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBuildForEdit } from "@/lib/data/builds";
import { EditBuildForm } from "./edit-build-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditBuildPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const build = await getBuildForEdit(id, session.user.id);
  if (!build) notFound();

  return <EditBuildForm build={build} />;
}

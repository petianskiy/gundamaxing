import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { UploadForm } from "./upload-form";

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <UploadForm />;
}

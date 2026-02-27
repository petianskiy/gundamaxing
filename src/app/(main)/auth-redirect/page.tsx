import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthRedirectPage() {
  const session = await auth();
  if (session?.user?.username) {
    redirect(`/hangar/${session.user.username}`);
  }
  redirect("/builds");
}

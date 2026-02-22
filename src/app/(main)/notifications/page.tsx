import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getNotifications } from "@/lib/data/notifications";
import { NotificationsList } from "./notifications-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications | Gundamaxing",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await getNotifications(session.user.id);

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Notifications
        </h1>
        <NotificationsList notifications={notifications} />
      </div>
    </div>
  );
}

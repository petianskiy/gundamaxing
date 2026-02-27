import Image from "next/image";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getNotifications } from "@/lib/data/notifications";
import { Bell } from "lucide-react";
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
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-20">
        <Image
          src="/images/notifications-bg.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-black/75" />
      <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Bell className="h-5 w-5 text-gx-red" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
                通知 · Alerts
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Notifications
            </h1>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Stay updated on likes, comments, and community activity.
            </p>
          </div>
          <NotificationsList notifications={notifications} />
        </div>
      </div>
    </div>
  );
}

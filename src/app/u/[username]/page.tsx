"use client";

import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Award, Calendar, Heart, Package, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { mockUsers, mockBuilds, mockThreads } from "@/lib/mock/data";
import { BuildCard } from "@/components/build/build-card";
import { VerificationBadge } from "@/components/ui/verification-badge";

const tabs = ["Builds", "Activity", "Threads"] as const;
type Tab = (typeof tabs)[number];

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { t } = useTranslation();
  const { username } = use(params);
  const user = mockUsers.find((u) => u.username === username);
  const [activeTab, setActiveTab] = useState<Tab>("Builds");

  if (!user) {
    return (
      <div className="pt-24 pb-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">{t("profile.notFound")}</h1>
        <p className="mt-2 text-muted-foreground">{t("profile.notFoundDesc")}</p>
        <Link href="/builds" className="mt-4 inline-block text-sm text-gx-red hover:text-red-400">
          {t("profile.browseBuilds")}
        </Link>
      </div>
    );
  }

  const userBuilds = mockBuilds.filter((b) => b.userId === user.id);
  const userThreads = mockThreads.filter((th) => th.userId === user.id);

  const tierRingColor: Record<string, string> = {
    master: "ring-yellow-500",
    featured: "ring-purple-500",
    verified: "ring-blue-500",
    unverified: "ring-zinc-600",
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Profile header */}
        <section className="rounded-xl border border-border/50 bg-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className={cn("rounded-full ring-4 ring-offset-4 ring-offset-card", tierRingColor[user.verificationTier])}>
                <Image
                  src={user.avatar}
                  alt={user.displayName}
                  width={80}
                  height={80}
                  className="rounded-full"
                  unoptimized
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{user.displayName}</h1>
                <VerificationBadge tier={user.verificationTier} showLabel size="md" />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">@{user.username}</p>
              <p className="text-sm text-zinc-300 mt-3 leading-relaxed max-w-lg">{user.bio}</p>

              {/* Chips */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-semibold">
                  <Star className="h-3 w-3" />
                  {t("profile.level")} {user.level}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold">
                  <Award className="h-3 w-3" />
                  {user.reputation.toLocaleString()} {t("profile.rep")}
                </span>
              </div>

              {/* Badges */}
              {user.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {user.badges.map((badge) => (
                    <span
                      key={badge.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground"
                      title={badge.description}
                    >
                      {badge.icon} {badge.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-6 mt-5 pt-4 border-t border-border/50 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                  <span className="font-semibold text-foreground">{user.buildCount}</span> {t("profile.builds")}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Heart className="h-3.5 w-3.5" />
                  <span className="font-semibold text-foreground">{user.totalLikes.toLocaleString()}</span> {t("profile.likes")}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {t("shared.joined")} {user.joinedAt}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-1 mt-8 border-b border-border/50">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px]",
                activeTab === tab
                  ? "border-gx-red text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "Builds" ? t("profile.tabBuilds") : tab === "Activity" ? t("profile.tabActivity") : t("profile.tabThreads")}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-8">
          {activeTab === "Builds" && (
            <div>
              {userBuilds.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {userBuilds.map((build, i) => (
                    <motion.div
                      key={build.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.05 }}
                    >
                      <BuildCard build={build} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">{t("profile.noBuilds")}</p>
              )}
            </div>
          )}

          {activeTab === "Activity" && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("profile.activitySoon")}</p>
            </div>
          )}

          {activeTab === "Threads" && (
            <div className="space-y-3">
              {userThreads.length > 0 ? (
                userThreads.map((thread) => (
                  <Link
                    key={thread.id}
                    href={`/thread/${thread.id}`}
                    className="block rounded-xl border border-border/50 bg-card p-4 hover:border-border transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{thread.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{thread.categoryName}</span>
                          <span>&middot;</span>
                          <span>{thread.createdAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {thread.replies}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-12">{t("profile.noThreads")}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

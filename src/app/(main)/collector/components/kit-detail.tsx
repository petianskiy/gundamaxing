"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Users, Package, Wrench, Award, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { addToCollection, updateCollectionEntry, removeFromCollection } from "@/lib/actions/collector";
import { CollectionStatusBadge } from "./collection-status-badge";
import type { GunplaKitUI, KitStatus, UserKitReviewUI } from "@/lib/types";

const gradeColors: Record<string, string> = {
  HG: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  RG: "bg-green-500/20 text-green-400 border-green-500/30",
  MG: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  PG: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  SD: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  FM: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const statuses: KitStatus[] = ["OWNED", "BUILT", "WISHLIST", "BACKLOG"];

interface KitDetailProps {
  kit: GunplaKitUI;
  reviews: UserKitReviewUI[];
  userEntry: {
    id: string;
    status: KitStatus;
    buildDifficulty: number | null;
    partQuality: number | null;
    overallRating: number | null;
    review: string | null;
  } | null;
  isLoggedIn: boolean;
}

function RatingSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (val: number | null) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">
          {value !== null ? `${value}/10` : "--"}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value ?? 5}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-gx-red"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/50">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string | number | null }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30 border border-border/30">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-lg font-bold text-foreground">{value ?? "--"}</span>
      <span className="text-[10px] text-muted-foreground text-center">{label}</span>
    </div>
  );
}

export function KitDetail({ kit, reviews, userEntry, isLoggedIn }: KitDetailProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [entry, setEntry] = useState(userEntry);
  const [selectedStatus, setSelectedStatus] = useState<KitStatus>(userEntry?.status ?? "OWNED");
  const [difficulty, setDifficulty] = useState<number | null>(userEntry?.buildDifficulty ?? null);
  const [quality, setQuality] = useState<number | null>(userEntry?.partQuality ?? null);
  const [overall, setOverall] = useState<number | null>(userEntry?.overallRating ?? null);
  const [reviewText, setReviewText] = useState(userEntry?.review ?? "");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gradeClass = gradeColors[kit.grade] ?? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";

  // Compute average stats from reviews
  const reviewsWithDifficulty = reviews.filter((r) => r.buildDifficulty !== null);
  const reviewsWithQuality = reviews.filter((r) => r.partQuality !== null);
  const reviewsWithOverall = reviews.filter((r) => r.overallRating !== null);

  const avgDifficulty = reviewsWithDifficulty.length > 0
    ? (reviewsWithDifficulty.reduce((sum, r) => sum + (r.buildDifficulty ?? 0), 0) / reviewsWithDifficulty.length).toFixed(1)
    : null;
  const avgQuality = reviewsWithQuality.length > 0
    ? (reviewsWithQuality.reduce((sum, r) => sum + (r.partQuality ?? 0), 0) / reviewsWithQuality.length).toFixed(1)
    : null;
  const avgOverall = reviewsWithOverall.length > 0
    ? (reviewsWithOverall.reduce((sum, r) => sum + (r.overallRating ?? 0), 0) / reviewsWithOverall.length).toFixed(1)
    : null;

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const result = await addToCollection({ kitId: kit.id, status: selectedStatus });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.success && result.userKitId) {
        setEntry({ id: result.userKitId, status: selectedStatus, buildDifficulty: null, partQuality: null, overallRating: null, review: null });
      }
    });
  }

  function handleUpdate() {
    if (!entry) return;
    setError(null);
    setSaveMessage(null);
    startTransition(async () => {
      const result = await updateCollectionEntry({
        userKitId: entry.id,
        status: selectedStatus,
        buildDifficulty: difficulty,
        partQuality: quality,
        overallRating: overall,
        review: reviewText || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEntry({ ...entry, status: selectedStatus, buildDifficulty: difficulty, partQuality: quality, overallRating: overall, review: reviewText || null });
      setSaveMessage(t("collector.saved"));
      setTimeout(() => setSaveMessage(null), 2000);
    });
  }

  function handleRemove() {
    if (!entry) return;
    setError(null);
    startTransition(async () => {
      const result = await removeFromCollection({ userKitId: entry.id });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEntry(null);
      setDifficulty(null);
      setQuality(null);
      setOverall(null);
      setReviewText("");
    });
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          href="/collector"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("collector.backToCatalog")}
        </Link>

        {/* Kit Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Image */}
          <div className="relative aspect-square rounded-xl border border-border/50 bg-card overflow-hidden">
            {kit.imageUrl ? (
              <Image
                src={kit.imageUrl}
                alt={kit.name}
                fill
                className="object-contain p-8"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-24 w-24 text-muted-foreground/20" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className={cn("px-2.5 py-1 rounded text-xs font-bold border", gradeClass)}>
                {kit.grade}
              </span>
              {kit.scale && (
                <span className="text-sm text-muted-foreground">{kit.scale}</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-rajdhani">
              {kit.name}
            </h1>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground">{t("collector.series")}</span>
                <span className="text-foreground">{kit.seriesName}</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground">{t("collector.manufacturer")}</span>
                <span className="text-foreground">{kit.manufacturer}</span>
              </div>
              {kit.releaseYear && (
                <div className="flex justify-between border-b border-border/20 pb-2">
                  <span className="text-muted-foreground">{t("collector.releaseYear")}</span>
                  <span className="text-foreground">{kit.releaseYear}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              <StatCard icon={Users} label={t("collector.owners")} value={kit.totalOwners} />
              <StatCard icon={Wrench} label={t("collector.avgDifficulty")} value={avgDifficulty} />
              <StatCard icon={Award} label={t("collector.avgQuality")} value={avgQuality} />
              <StatCard icon={Star} label={t("collector.avgOverall")} value={avgOverall} />
            </div>
          </div>
        </div>

        {/* Collection Actions */}
        {isLoggedIn && (
          <div className="rounded-xl border border-border/50 bg-card p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground font-rajdhani mb-4">
              {entry ? t("collector.updateEntry") : t("collector.addToCollection")}
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Status selector */}
            <div className="flex flex-wrap gap-2 mb-6">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                    selectedStatus === status
                      ? "bg-gx-red/10 text-red-400 border-gx-red/40"
                      : "bg-muted/30 text-muted-foreground border-border/50 hover:border-border hover:text-foreground"
                  )}
                >
                  {t(`collector.status.${status}`)}
                </button>
              ))}
            </div>

            {/* Ratings (only show if already added to collection) */}
            {entry && (
              <div className="space-y-5 mb-6">
                <h3 className="text-sm font-medium text-foreground">
                  {t("collector.rateKit")}
                </h3>
                <RatingSlider
                  label={t("collector.buildDifficulty")}
                  value={difficulty}
                  onChange={setDifficulty}
                />
                <RatingSlider
                  label={t("collector.partQuality")}
                  value={quality}
                  onChange={setQuality}
                />
                <RatingSlider
                  label={t("collector.overallRating")}
                  value={overall}
                  onChange={setOverall}
                />

                {/* Review text */}
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">
                    {t("collector.writeReview")}
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    maxLength={2000}
                    rows={4}
                    placeholder={t("collector.reviewPlaceholder")}
                    className="w-full rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gx-red/50 resize-none"
                  />
                  <div className="text-right text-[10px] text-muted-foreground mt-1">
                    {reviewText.length}/2000
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              {entry ? (
                <>
                  <button
                    onClick={handleUpdate}
                    disabled={isPending}
                    className="px-5 py-2.5 rounded-lg bg-gx-red text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {isPending ? t("collector.saving") : saveMessage ?? t("collector.save")}
                  </button>
                  <button
                    onClick={handleRemove}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("collector.removeFromCollection")}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAdd}
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-lg bg-gx-red text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isPending ? t("collector.saving") : t("collector.addToCollection")}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Community Reviews */}
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="h-5 w-5 text-gx-red" />
            <h2 className="text-lg font-semibold text-foreground font-rajdhani">
              {t("collector.communityReviews")}
            </h2>
            <span className="text-xs text-muted-foreground">({reviews.length})</span>
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {t("collector.noReviews")}
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-border/30 bg-muted/20 p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {review.userAvatar ? (
                      <Image
                        src={review.userAvatar}
                        alt={review.username}
                        width={32}
                        height={32}
                        className="rounded-full"
                        unoptimized
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                        {review.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">{review.username}</span>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <CollectionStatusBadge status={review.status} />
                        <span>{review.createdAt}</span>
                      </div>
                    </div>
                    {review.overallRating !== null && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-bold text-foreground">
                          {review.overallRating}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rating details */}
                  <div className="flex gap-4 mb-3 text-[11px]">
                    {review.buildDifficulty !== null && (
                      <span className="text-muted-foreground">
                        {t("collector.buildDifficulty")}: <strong className="text-foreground">{review.buildDifficulty}/10</strong>
                      </span>
                    )}
                    {review.partQuality !== null && (
                      <span className="text-muted-foreground">
                        {t("collector.partQuality")}: <strong className="text-foreground">{review.partQuality}/10</strong>
                      </span>
                    )}
                  </div>

                  {review.review && (
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {review.review}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Bookmark,
  GitFork,
  Share2,
  Pencil,
  LayoutDashboard,
} from "lucide-react";
import { toggleLike, toggleBookmark } from "@/lib/actions/like";
import { forkBuild } from "@/lib/actions/build";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

interface ActionsBarProps {
  buildId: string;
  likeCount: number;
  bookmarkCount: number;
  forkCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isOwner: boolean;
  currentUserId?: string;
  onCreateShowcase?: () => void;
  isCreatingShowcase?: boolean;
}

function formatCount(count: number): string {
  return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
}

export function ActionsBar({
  buildId,
  likeCount,
  bookmarkCount,
  forkCount,
  isLiked,
  isBookmarked,
  isOwner,
  currentUserId,
  onCreateShowcase,
  isCreatingShowcase,
}: ActionsBarProps) {
  const { t } = useTranslation();
  const router = useRouter();

  // Optimistic state
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likeCount);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [bookmarks, setBookmarks] = useState(bookmarkCount);
  const [, startTransition] = useTransition();
  const [isForking, setIsForking] = useState(false);

  const handleLike = () => {
    if (!currentUserId) {
      toast.error("Sign in to like builds");
      return;
    }
    // Optimistic update
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
    startTransition(async () => {
      const result = await toggleLike(buildId);
      if ("error" in result) {
        // Revert
        setLiked(liked);
        setLikes(likeCount);
        toast.error(result.error);
      }
    });
  };

  const handleBookmark = () => {
    if (!currentUserId) {
      toast.error("Sign in to bookmark builds");
      return;
    }
    // Optimistic update
    setBookmarked(!bookmarked);
    setBookmarks(bookmarked ? bookmarks - 1 : bookmarks + 1);
    startTransition(async () => {
      const result = await toggleBookmark(buildId);
      if ("error" in result) {
        // Revert
        setBookmarked(bookmarked);
        setBookmarks(bookmarkCount);
        toast.error(result.error);
      }
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Check out this build", url });
      } catch {
        // User cancelled or share failed, try clipboard
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  const handleFork = () => {
    if (!currentUserId) {
      toast.error("Sign in to fork builds");
      return;
    }
    setIsForking(true);
    startTransition(async () => {
      const result = await forkBuild(buildId);
      setIsForking(false);
      if ("error" in result) {
        toast.error(result.error);
      } else if (result.buildId) {
        toast.success("Build forked!");
        router.push(`/builds/${result.buildId}/edit`);
      }
    });
  };

  return (
    <div className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-card">
      {/* Like */}
      <button
        onClick={handleLike}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
          liked
            ? "text-red-500 hover:text-red-400 bg-red-500/10"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <Heart className={cn("h-4 w-4", liked && "fill-current")} />
        <span className="hidden sm:inline">{t("builds.like")}</span>
        <span className="text-xs">{formatCount(likes)}</span>
      </button>

      {/* Bookmark */}
      <button
        onClick={handleBookmark}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
          bookmarked
            ? "text-amber-500 hover:text-amber-400 bg-amber-500/10"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
        <span className="hidden sm:inline">{t("builds.bookmark")}</span>
        <span className="text-xs">{formatCount(bookmarks)}</span>
      </button>

      {/* Fork */}
      <button
        onClick={handleFork}
        disabled={isForking || isOwner}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <GitFork className={cn("h-4 w-4", isForking && "animate-spin")} />
        <span className="hidden sm:inline">{isForking ? "Forking..." : t("builds.fork")}</span>
        <span className="text-xs">{formatCount(forkCount)}</span>
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">{t("builds.share")}</span>
      </button>

      {/* Owner actions */}
      {isOwner && (
        <div className="ml-auto flex items-center gap-1">
          {onCreateShowcase && (
            <button
              disabled={isCreatingShowcase}
              onClick={onCreateShowcase}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              <LayoutDashboard className={cn("h-4 w-4", isCreatingShowcase && "animate-spin")} />
              <span className="hidden sm:inline">
                {isCreatingShowcase ? "Creating..." : "Create Showcase"}
              </span>
            </button>
          )}
          <Link
            href={`/builds/${buildId}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
        </div>
      )}
    </div>
  );
}

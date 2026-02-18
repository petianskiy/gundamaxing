"use client";

import { useOptimistic, useTransition } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { toggleReaction } from "@/lib/actions/reaction";

interface ReactionBarProps {
  buildId: string;
  respectCount: number;
  techniqueCount: number;
  creativityCount: number;
  userReactions: string[];
  currentUserId?: string;
}

type ReactionState = {
  respectCount: number;
  techniqueCount: number;
  creativityCount: number;
  userReactions: string[];
};

type ReactionAction = {
  type: string;
};

function reactionReducer(
  state: ReactionState,
  action: ReactionAction
): ReactionState {
  const { type } = action;
  const isActive = state.userReactions.includes(type);
  const delta = isActive ? -1 : 1;

  const counterKey =
    type === "RESPECT"
      ? "respectCount"
      : type === "TECHNIQUE"
        ? "techniqueCount"
        : "creativityCount";

  return {
    ...state,
    [counterKey]: Math.max(0, state[counterKey] + delta),
    userReactions: isActive
      ? state.userReactions.filter((r) => r !== type)
      : [...state.userReactions, type],
  };
}

const reactions = [
  {
    type: "RESPECT",
    emoji: "\uD83E\uDD1D",
    labelKey: "hangar.reaction.respect",
    activeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    hoverColor: "hover:bg-blue-500/10 hover:text-blue-400",
    countKey: "respectCount" as const,
  },
  {
    type: "TECHNIQUE",
    emoji: "\uD83D\uDD27",
    labelKey: "hangar.reaction.technique",
    activeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    hoverColor: "hover:bg-amber-500/10 hover:text-amber-400",
    countKey: "techniqueCount" as const,
  },
  {
    type: "CREATIVITY",
    emoji: "\u2728",
    labelKey: "hangar.reaction.creativity",
    activeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    hoverColor: "hover:bg-purple-500/10 hover:text-purple-400",
    countKey: "creativityCount" as const,
  },
] as const;

export function ReactionBar({
  buildId,
  respectCount,
  techniqueCount,
  creativityCount,
  userReactions,
  currentUserId,
}: ReactionBarProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const [optimisticState, addOptimistic] = useOptimistic<
    ReactionState,
    ReactionAction
  >(
    { respectCount, techniqueCount, creativityCount, userReactions },
    reactionReducer
  );

  const handleReaction = (type: string) => {
    if (!currentUserId) return;

    addOptimistic({ type });

    startTransition(async () => {
      await toggleReaction({ buildId, type });
    });
  };

  const isLoggedIn = !!currentUserId;

  return (
    <div className="flex items-center gap-3">
      {reactions.map((reaction) => {
        const isActive = optimisticState.userReactions.includes(reaction.type);
        const count = optimisticState[reaction.countKey];

        return (
          <button
            key={reaction.type}
            onClick={() => handleReaction(reaction.type)}
            disabled={!isLoggedIn}
            title={
              isLoggedIn
                ? t(reaction.labelKey)
                : t("hangar.reaction.loginRequired")
            }
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
              "border transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isActive
                ? reaction.activeColor
                : cn(
                    "border-[#27272a] text-zinc-500",
                    isLoggedIn && reaction.hoverColor
                  ),
              isActive && "active:scale-110"
            )}
            style={{
              transition: "transform 0.15s ease, background-color 0.2s, color 0.2s, border-color 0.2s",
            }}
          >
            <span
              className={cn(
                "text-base transition-transform duration-150",
                isActive && "animate-[reaction-pop_0.3s_ease-out]"
              )}
            >
              {reaction.emoji}
            </span>
            <span className="font-medium tabular-nums">{count}</span>

            {/* Inline keyframe for scale pop */}
            <style>{`
              @keyframes reaction-pop {
                0% { transform: scale(1); }
                50% { transform: scale(1.3); }
                100% { transform: scale(1); }
              }
            `}</style>
          </button>
        );
      })}
    </div>
  );
}

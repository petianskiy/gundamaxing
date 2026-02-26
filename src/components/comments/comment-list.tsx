"use client";

import { CommentItem } from "./comment-item";
import { CommentForm } from "./comment-form";

interface CommentData {
  id: string;
  content: string;
  userId: string;
  username: string;
  userHandle: string;
  userAvatar: string | null;
  likeCount: number;
  liked: boolean;
  flagged: boolean;
  createdAt: string;
  gif?: { url: string; previewUrl: string | null; width: number; height: number; slug: string | null } | null;
  children?: CommentData[];
}

interface CommentListProps {
  comments: CommentData[];
  buildId?: string;
  threadId?: string;
  totalCount: number;
  onUpdate?: () => void;
}

export function CommentList({ comments, buildId, threadId, totalCount, onUpdate }: CommentListProps) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-foreground mb-6">
        Replies ({totalCount})
      </h2>

      {/* Comment form at top */}
      <div className="mb-6">
        <CommentForm
          buildId={buildId}
          threadId={threadId}
          onSuccess={onUpdate}
        />
      </div>

      {/* Comments */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            buildId={buildId}
            threadId={threadId}
            onUpdate={onUpdate}
          />
        ))}
      </div>

      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No replies yet. Be the first to share your thoughts.
        </p>
      )}
    </section>
  );
}

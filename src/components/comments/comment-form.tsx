"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Send, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createComment } from "@/lib/actions/comment";
import { generateTimingToken } from "@/lib/security/timing";

interface CommentFormProps {
  buildId?: string;
  threadId?: string;
  parentId?: string;
  onSuccess?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}

export function CommentForm({ buildId, threadId, parentId, onSuccess, autoFocus, placeholder }: CommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const timingRef = useRef(generateTimingToken());

  if (!session?.user) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="text-gx-red hover:text-red-400 font-medium">
            Sign in
          </Link>{" "}
          to join the conversation.
        </p>
      </div>
    );
  }

  if (!session.user.onboardingComplete) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          <Link href="/register" className="text-gx-red hover:text-red-400 font-medium">
            Complete your registration
          </Link>{" "}
          to comment.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.set("content", content.trim());
    if (buildId) formData.set("buildId", buildId);
    if (threadId) formData.set("threadId", threadId);
    if (parentId) formData.set("parentId", parentId);
    formData.set("_timing", timingRef.current);
    // Honeypot fields left empty (bots will fill them)
    formData.set("website_url_confirm", "");
    formData.set("phone_verify", "");

    const result = await createComment(formData);

    setLoading(false);
    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to post comment");
    } else {
      setContent("");
      timingRef.current = generateTimingToken();
      onSuccess?.();
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="rounded-xl border border-border/50 bg-card p-4"
    >
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder || "Share your thoughts..."}
        rows={3}
        maxLength={5000}
        autoFocus={autoFocus}
        className="mb-2"
      />

      {/* Hidden honeypot fields */}
      <div className="absolute -left-[9999px]" aria-hidden="true" tabIndex={-1}>
        <input type="text" name="website_url_confirm" tabIndex={-1} autoComplete="off" />
        <input type="text" name="phone_verify" tabIndex={-1} autoComplete="off" />
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-2 text-xs text-red-400">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground/50">
          {content.length}/5000
        </span>
        <Button
          type="submit"
          size="sm"
          loading={loading}
          disabled={!content.trim()}
        >
          <Send className="h-3 w-3" />
          Post
        </Button>
      </div>
    </motion.form>
  );
}

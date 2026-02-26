"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Send, AlertCircle, ArrowLeft, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GifPicker } from "@/components/gifs/gif-picker";
import { GifPreview } from "@/components/gifs/gif-preview";
import { useTranslation } from "@/lib/i18n/context";
import { createThread } from "@/lib/actions/thread";
import { generateTimingToken } from "@/lib/security/timing";
import type { ForumCategory } from "@/lib/types";

interface ThreadFormProps {
  categories: ForumCategory[];
  defaultCategoryId?: string;
}

export function ThreadForm({ categories, defaultCategoryId }: ThreadFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedGif, setSelectedGif] = useState<{ slug: string; title: string; url: string; previewUrl: string; width: number; height: number } | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const timingRef = useRef(generateTimingToken());

  if (!session?.user) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="text-gx-red hover:text-red-400 font-medium">
            Sign in
          </Link>{" "}
          to create a thread.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError(t("forum.titleRequired"));
      return;
    }
    if (!content.trim()) {
      setError(t("forum.contentRequired"));
      return;
    }
    if (!categoryId) {
      setError(t("forum.categoryRequired"));
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("content", content.trim());
    formData.set("categoryId", categoryId);
    if (selectedGif) {
      formData.set("gifUrl", selectedGif.url);
      formData.set("gifPreviewUrl", selectedGif.previewUrl);
      formData.set("gifWidth", String(selectedGif.width));
      formData.set("gifHeight", String(selectedGif.height));
      formData.set("gifSlug", selectedGif.slug);
    }
    formData.set("_timing", timingRef.current);
    formData.set("website_url_confirm", "");
    formData.set("phone_verify", "");

    const result = await createThread(formData);

    setLoading(false);

    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to create thread");
    } else if (result.threadId) {
      router.push(`/thread/${result.threadId}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="thread-title" className="block text-sm font-medium text-foreground mb-1.5">
          {t("forum.threadTitle")}
        </label>
        <input
          id="thread-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder={t("forum.threadTitlePlaceholder")}
          className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gx-red/30"
        />
        <p className="text-right text-xs text-muted-foreground/50 mt-1">
          {title.length}/200
        </p>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="thread-category" className="block text-sm font-medium text-foreground mb-1.5">
          {t("forum.threadCategory")}
        </label>
        <select
          id="thread-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-red/30"
        >
          <option value="">{t("forum.selectCategory")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div>
        <label htmlFor="thread-content" className="block text-sm font-medium text-foreground mb-1.5">
          {t("forum.threadContent")}
        </label>
        <Textarea
          id="thread-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={50000}
          rows={10}
          placeholder={t("forum.threadContentPlaceholder")}
        />
        <p className="text-right text-xs text-muted-foreground/50 mt-1">
          {content.length.toLocaleString()}/50,000
        </p>
      </div>

      {/* GIF preview */}
      {selectedGif && (
        <GifPreview gif={selectedGif} onRemove={() => setSelectedGif(null)} />
      )}

      {/* Hidden honeypot fields */}
      <div className="absolute -left-[9999px]" aria-hidden="true" tabIndex={-1}>
        <input type="text" name="website_url_confirm" tabIndex={-1} autoComplete="off" />
        <input type="text" name="phone_verify" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/forum"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          {t("forum.backToForum")}
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGifPicker(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:border-border transition-colors"
          >
            <Film className="h-3 w-3" />
            GIF
          </button>
          <Button type="submit" size="sm" loading={loading} disabled={!title.trim() || !content.trim() || !categoryId}>
            <Send className="h-3 w-3" />
            {loading ? t("forum.posting") : t("forum.createThread")}
          </Button>
        </div>
      </div>

      <GifPicker
        open={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelect={(gif) => {
          setSelectedGif(gif);
          setShowGifPicker(false);
        }}
      />
    </form>
  );
}

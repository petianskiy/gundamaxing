"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Send,
  AlertCircle,
  ArrowLeft,
  Film,
  Sparkles,
  MessageSquare,
  Eye,
  EyeOff,
  Info,
  PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GifPicker } from "@/components/gifs/gif-picker";
import { GifPreview } from "@/components/gifs/gif-preview";
import { useTranslation } from "@/lib/i18n/context";
import { createThread } from "@/lib/actions/thread";
import { generateTimingToken } from "@/lib/security/timing";
import type { ForumCategory } from "@/lib/types";

interface NewThreadClientProps {
  categories: ForumCategory[];
  defaultCategoryId?: string;
}

export function NewThreadClient({ categories, defaultCategoryId }: NewThreadClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedGif, setSelectedGif] = useState<{
    slug: string;
    title: string;
    url: string;
    previewUrl: string;
    width: number;
    height: number;
  } | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const timingRef = useRef(generateTimingToken());

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const titleProgress = Math.min(100, (title.length / 200) * 100);

  if (!session?.user) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-12 text-center">
        <PenTool className="h-10 w-10 text-white/20 mx-auto mb-4" />
        <p className="text-sm text-white/60">
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
    <>
      {/* Hero heading */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-gx-red" />
          <span className="text-[10px] font-share-tech-mono text-gx-red uppercase tracking-[0.3em]">
            Start a Discussion
          </span>
        </div>
        <h1 className="font-orbitron text-2xl sm:text-3xl font-bold text-white uppercase tracking-wide">
          {t("forum.newThread")}
        </h1>
        <p className="text-sm text-white/40 mt-2">
          {t("forum.threadContentPlaceholder")}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Main card */}
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
          {/* Category color accent bar */}
          <div
            className="h-1 transition-colors duration-300"
            style={{ background: selectedCategory?.color ?? "rgba(255,255,255,0.1)" }}
          />

          <div className="p-4 sm:p-6 space-y-6">
            {/* Category pills */}
            <div>
              <label className="block text-[10px] font-share-tech-mono text-white/40 uppercase tracking-wider mb-3">
                {t("forum.threadCategory")}
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                      categoryId === cat.id
                        ? "text-white scale-[1.02]"
                        : "border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 bg-white/5"
                    }`}
                    style={
                      categoryId === cat.id
                        ? {
                            borderColor: `${cat.color}60`,
                            backgroundColor: `${cat.color}20`,
                            color: cat.color,
                          }
                        : undefined
                    }
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Title input */}
            <div>
              <label
                htmlFor="thread-title"
                className="block text-[10px] font-share-tech-mono text-white/40 uppercase tracking-wider mb-2"
              >
                {t("forum.threadTitle")}
              </label>
              <input
                id="thread-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder={t("forum.threadTitlePlaceholder")}
                className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/25 focus:bg-white/[0.07] transition-all"
              />
              {/* Title progress bar */}
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex-1 h-0.5 rounded-full bg-white/5 mr-3">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${titleProgress}%`,
                      backgroundColor:
                        titleProgress > 90 ? "#ef4444" : titleProgress > 60 ? "#f59e0b" : selectedCategory?.color ?? "#dc2626",
                    }}
                  />
                </div>
                <span className="text-[10px] font-share-tech-mono text-white/30">
                  {title.length}/200
                </span>
              </div>
            </div>

            {/* Content textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="thread-content"
                  className="text-[10px] font-share-tech-mono text-white/40 uppercase tracking-wider"
                >
                  {t("forum.threadContent")}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1 text-[10px] font-share-tech-mono text-white/30 hover:text-white/60 transition-colors uppercase tracking-wider"
                >
                  {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showPreview ? "Edit" : "Preview"}
                </button>
              </div>

              {showPreview ? (
                <div className="w-full min-h-[280px] px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white/80 whitespace-pre-wrap">
                  {content || (
                    <span className="text-white/25 italic">Nothing to preview yet...</span>
                  )}
                </div>
              ) : (
                <Textarea
                  id="thread-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={50000}
                  rows={12}
                  placeholder={t("forum.threadContentPlaceholder")}
                  className="!bg-white/5 !border-white/10 !text-white !placeholder-white/25 focus:!border-white/25 focus:!bg-white/[0.07]"
                />
              )}
              <p className="text-right text-[10px] font-share-tech-mono text-white/30 mt-1">
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
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Footer bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Link
                href="/forum"
                className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                {t("forum.backToForum")}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGuidelines(!showGuidelines)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-white/30 hover:text-white/60 border border-white/5 hover:border-white/15 transition-all"
              >
                <Info className="h-3 w-3" />
                <span className="hidden sm:inline">Guidelines</span>
              </button>
              <button
                type="button"
                onClick={() => setShowGifPicker(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-white/30 hover:text-white/60 border border-white/5 hover:border-white/15 transition-all"
              >
                <Film className="h-3 w-3" />
                GIF
              </button>
              <Button
                type="submit"
                size="sm"
                loading={loading}
                disabled={!title.trim() || !content.trim() || !categoryId}
                className="!bg-gx-red hover:!bg-red-600 !text-white !border-0"
              >
                <Send className="h-3 w-3" />
                {loading ? t("forum.posting") : t("forum.createThread")}
              </Button>
            </div>
          </div>
        </div>

        {/* Guidelines card */}
        {showGuidelines && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-white/40" />
              <h3 className="text-xs font-share-tech-mono text-white/60 uppercase tracking-wider">
                Community Guidelines
              </h3>
            </div>
            <ul className="space-y-2 text-[12px] text-white/40">
              <li className="flex items-start gap-2">
                <span className="text-gx-red mt-0.5">01</span>
                Be respectful — treat every builder like a fellow pilot.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gx-red mt-0.5">02</span>
                Use a descriptive title so others can find your thread.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gx-red mt-0.5">03</span>
                Post in the correct category for better visibility.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gx-red mt-0.5">04</span>
                No spam, self-promotion, or off-topic solicitation.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gx-red mt-0.5">05</span>
                Share knowledge — help others grow in the craft.
              </li>
            </ul>
          </div>
        )}
      </form>

      <GifPicker
        open={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelect={(gif) => {
          setSelectedGif(gif);
          setShowGifPicker(false);
        }}
      />
    </>
  );
}

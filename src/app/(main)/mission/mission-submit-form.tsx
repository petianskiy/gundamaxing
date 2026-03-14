"use client";

import { useState, useTransition, useEffect } from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { Upload, X, Loader2, Send, Film, Check } from "lucide-react";
import { useR2Upload } from "@/lib/upload/use-r2-upload";
import { submitMission } from "@/lib/actions/mission";
import type { MissionSubmissionUI } from "@/lib/types";

const MAX_IMAGES = 20;

interface MissionSubmitFormProps {
  existingSubmission: MissionSubmissionUI | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MissionSubmitForm({ existingSubmission, onSuccess, onCancel }: MissionSubmitFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(existingSubmission?.title ?? "");
  const [description, setDescription] = useState(existingSubmission?.description ?? "");
  const [images, setImages] = useState<string[]>(existingSubmission?.images ?? []);
  const [videoUrl, setVideoUrl] = useState<string | null>(existingSubmission?.videoUrl ?? null);

  const imageUpload = useR2Upload({ type: "image" });
  const videoUpload = useR2Upload({ type: "video" });

  // Sync if existingSubmission changes
  useEffect(() => {
    if (existingSubmission) {
      setTitle(existingSubmission.title);
      setDescription(existingSubmission.description);
      setImages(existingSubmission.images);
      setVideoUrl(existingSubmission.videoUrl);
    }
  }, [existingSubmission]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = MAX_IMAGES - images.length;
    const filesToUpload = Array.from(files).slice(0, remaining);

    for (const file of filesToUpload) {
      try {
        const result = await imageUpload.upload(file);
        setImages((prev) => [...prev, result.url]);
      } catch {
        setError("Failed to upload image.");
      }
    }
    e.target.value = "";
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await videoUpload.upload(file);
      setVideoUrl(result.url);
    } catch {
      setError("Failed to upload video. Max 150MB, 60 seconds.");
    }
    e.target.value = "";
  };

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((img) => img !== url));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (images.length === 0) {
      setError("At least 1 image is required.");
      return;
    }

    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("images", JSON.stringify(images));
    formData.set("videoUrl", videoUrl ?? "");

    startTransition(async () => {
      const result = await submitMission(formData);
      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
      }
    });
  };

  const isEditing = !!existingSubmission;
  const canUploadMore = images.length < MAX_IMAGES;
  const isUploading = imageUpload.isUploading || videoUpload.isUploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-[12px] font-share-tech-mono text-red-400">{error}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor="mission-title"
          className="block font-share-tech-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2"
        >
          Submission Title
        </label>
        <input
          id="mission-title"
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#d4a017]/40 transition-colors"
          placeholder="Name your build"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="mission-desc"
          className="block font-share-tech-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2"
        >
          Description
        </label>
        <textarea
          id="mission-desc"
          required
          rows={5}
          maxLength={5000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#d4a017]/40 transition-colors resize-none"
          placeholder="Describe your build — techniques, materials, and process"
        />
      </div>

      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block font-share-tech-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
            Photos
            <span className="text-[#d4a017]/60 ml-1">*</span>
          </label>
          <span className={`font-share-tech-mono text-[9px] uppercase tracking-wider ${
            images.length === 0 ? "text-red-400/60" : "text-white/25"
          }`}>
            {images.length} / {MAX_IMAGES}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div
              key={url}
              className="group/img relative w-[88px] h-[88px] overflow-hidden border border-white/[0.08]"
            >
              <Image src={url} alt="" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/40 transition-colors" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute top-1 right-1 p-1 bg-black/70 text-white/70 hover:text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {canUploadMore && (
            <label className="flex flex-col items-center justify-center w-[88px] h-[88px] border border-dashed border-white/[0.12] cursor-pointer hover:border-[#d4a017]/40 hover:bg-white/[0.02] transition-colors">
              {imageUpload.isUploading ? (
                <Loader2 className="h-5 w-5 text-white/30 animate-spin" />
              ) : (
                <>
                  <Upload className="h-5 w-5 text-white/25 mb-1" />
                  <span className="font-share-tech-mono text-[8px] uppercase tracking-wider text-white/25">
                    Upload
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
                disabled={imageUpload.isUploading}
              />
            </label>
          )}
        </div>
        {images.length === 0 && (
          <p className="mt-2 font-share-tech-mono text-[9px] text-red-400/50 uppercase tracking-wider">
            At least 1 photo is required
          </p>
        )}
      </div>

      {/* Video (optional) */}
      <div>
        <label className="block font-share-tech-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-3">
          Video
          <span className="text-white/20 font-normal ml-2">optional · max 150MB · 60s</span>
        </label>

        {videoUrl ? (
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] p-3">
            <Film className="h-4 w-4 text-[#d4a017]/60 shrink-0" />
            <span className="flex-1 text-[12px] text-white/50 truncate font-share-tech-mono">
              Video uploaded
            </span>
            <button
              type="button"
              onClick={() => setVideoUrl(null)}
              className="text-white/30 hover:text-red-400 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-3 bg-white/[0.02] border border-dashed border-white/[0.08] p-3 cursor-pointer hover:border-[#d4a017]/30 transition-colors">
            {videoUpload.isUploading ? (
              <Loader2 className="h-4 w-4 text-white/30 animate-spin shrink-0" />
            ) : (
              <Film className="h-4 w-4 text-white/20 shrink-0" />
            )}
            <span className="font-share-tech-mono text-[10px] text-white/25 uppercase tracking-wider">
              {videoUpload.isUploading
                ? `Uploading... ${Math.round(videoUpload.progress * 100)}%`
                : "Upload a video walkthrough"}
            </span>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoUpload}
              disabled={videoUpload.isUploading}
            />
          </label>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || isUploading || images.length === 0}
          className="group relative flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-[#d4a017]/15 border border-[#d4a017]/30 text-[#d4a017] font-orbitron text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-[#d4a017]/25 hover:border-[#d4a017]/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Transmitting...
            </>
          ) : (
            <>
              {isEditing ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
              {isEditing ? "Update Entry" : "Submit Entry"}
            </>
          )}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4a017]/40" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#d4a017]/40" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#d4a017]/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4a017]/40" />
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3.5 border border-white/[0.08] text-white/40 font-orbitron text-[10px] font-bold uppercase tracking-[0.1em] hover:text-white/60 hover:border-white/15 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

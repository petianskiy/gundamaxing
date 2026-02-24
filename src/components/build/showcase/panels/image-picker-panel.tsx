"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { X, Upload, Plus, Trash2, Loader2, Eraser } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useR2Upload } from "@/lib/upload/use-r2-upload";
import { useRemoveBackground } from "../hooks/use-remove-background";
import { addBuildImage, deleteBuildImage } from "@/lib/actions/build";
import type { BuildImage } from "@/lib/types";

interface ImagePickerPanelProps {
  images: BuildImage[];
  buildId: string;
  onSelect: (imageId: string, imageUrl: string) => void;
  onImageUploaded: (newImage: { id: string; url: string }) => void;
  onImageDeleted: (imageId: string) => void;
  onClose: () => void;
}

export function ImagePickerPanel({
  images,
  buildId,
  onSelect,
  onImageUploaded,
  onImageDeleted,
  onClose,
}: ImagePickerPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [removingBgId, setRemovingBgId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, uploadMultiple, isUploading } = useR2Upload({ type: "image" });
  const { removeBg, isRemoving, progress, stage, queueSize, queuePosition } = useRemoveBackground();

  const handleUpload = useCallback(
    async (files: File[]) => {
      const result = await uploadMultiple(files);
      if (!result) return;

      for (const file of result) {
        const fd = new FormData();
        fd.append("buildId", buildId);
        fd.append("url", file.url);
        const res = await addBuildImage(fd);
        if (res && "image" in res && res.image) {
          onImageUploaded(res.image as { id: string; url: string });
        } else if (res && "error" in res) {
          toast.error(res.error);
        }
      }
    },
    [buildId, uploadMultiple, onImageUploaded],
  );

  const handleDelete = useCallback(
    async (e: React.MouseEvent, imageId: string) => {
      e.stopPropagation();
      const fd = new FormData();
      fd.append("imageId", imageId);
      fd.append("buildId", buildId);
      const res = await deleteBuildImage(fd);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      onImageDeleted(imageId);
    },
    [buildId, onImageDeleted],
  );

  const handleRemoveBg = useCallback(
    async (e: React.MouseEvent, img: BuildImage) => {
      e.stopPropagation();
      const imgId = img.id || img.url;
      setRemovingBgId(imgId);
      try {
        const blob = await removeBg(img.url);
        const file = new File([blob], "no-bg.png", { type: "image/png" });
        const result = await upload(file);
        if (result) {
          const fd = new FormData();
          fd.append("buildId", buildId);
          fd.append("url", result.url);
          const res = await addBuildImage(fd);
          if (res && "image" in res && res.image) {
            onImageUploaded(res.image as { id: string; url: string });
            toast.success("Background removed");
          }
        }
      } catch {
        toast.error("Background removal failed");
      } finally {
        setRemovingBgId(null);
      }
    },
    [buildId, removeBg, upload, onImageUploaded],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleUpload(Array.from(files));
      }
      // Reset input so the same file can be selected again
      e.target.value = "";
    },
    [handleUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (files.length > 0) {
        handleUpload(files);
      }
    },
    [handleUpload],
  );

  return (
    <>
    {isRemoving && (
      <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-zinc-900 border border-zinc-700/50 max-w-sm w-full mx-4 shadow-2xl">
          <img src="/gundam-emoji.png" alt="" className="w-16 h-16 object-contain" />
          <div className="text-center">
            <p className="text-sm font-medium text-white">
              {stage === "queued" ? `Queued (${queuePosition} of ${queueSize})` :
               stage === "loading-model" ? "Loading AI model..." :
               stage === "processing" ? "Removing background..." :
               "Finalizing..."}
            </p>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gx-red rounded-full transition-all duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="text-xs text-zinc-400">{Math.round(progress * 100)}%</p>
        </div>
      </div>
    )}
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-20 sm:right-4 z-[500] w-full sm:w-72 max-h-[50vh] sm:max-h-[70vh] bg-zinc-900 border-t sm:border border-zinc-700 sm:rounded-xl rounded-t-xl shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 shrink-0">
        <h3 className="text-sm font-semibold text-white">Images</h3>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3 overflow-y-auto flex-1">
        {/* Upload dropzone */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "mb-3 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-3 py-4 cursor-pointer transition-colors",
            isDragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-zinc-600 hover:border-zinc-500 bg-zinc-800/50 hover:bg-zinc-800",
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
              <span className="text-xs text-zinc-400">Uploading...</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Plus className="h-4 w-4" />
                <Upload className="h-4 w-4" />
              </div>
              <span className="text-xs text-zinc-400">
                Click or drag to upload
              </span>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Image grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <button
                key={img.id || img.url}
                onClick={() => onSelect(img.id || img.url, img.url)}
                className="relative aspect-square rounded-lg overflow-hidden border border-zinc-700 hover:border-blue-500 transition-colors group"
              >
                <Image
                  src={img.url}
                  alt={img.alt || "Build image"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  unoptimized
                />
                {/* Overlay */}
                <div className={cn(
                  "absolute inset-0 transition-colors",
                  removingBgId === (img.id || img.url) ? "bg-black/70" : "bg-black/0 group-hover:bg-black/40"
                )} />
                {removingBgId === (img.id || img.url) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                )}
                {img.id && removingBgId !== (img.id || img.url) && (
                  <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => handleDelete(e, img.id!)}
                      className="p-1 rounded bg-red-600/80 text-white hover:bg-red-500 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => handleRemoveBg(e, img)}
                      disabled={isRemoving}
                      className="p-1 rounded bg-purple-600/80 text-white hover:bg-purple-500 transition-all disabled:opacity-50"
                      title="Remove background"
                    >
                      <Eraser className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          !isUploading && (
            <p className="text-zinc-500 text-xs text-center py-8">
              No images yet
            </p>
          )
        )}
      </div>
    </div>
    </>
  );
}

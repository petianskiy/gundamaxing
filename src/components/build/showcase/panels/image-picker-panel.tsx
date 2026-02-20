"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { X, Upload, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/upload/uploadthing";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("buildImageUpload");

  const handleUpload = useCallback(
    async (files: File[]) => {
      const result = await startUpload(files);
      if (!result) return;

      for (const file of result) {
        const fd = new FormData();
        fd.append("buildId", buildId);
        fd.append("url", file.ufsUrl);
        const res = await addBuildImage(fd);
        if (res && "image" in res && res.image) {
          onImageUploaded(res.image as { id: string; url: string });
        } else if (res && "error" in res) {
          toast.error(res.error);
        }
      }
    },
    [buildId, startUpload, onImageUploaded],
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
                {/* Delete overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                {img.id && (
                  <button
                    onClick={(e) => handleDelete(e, img.id!)}
                    className="absolute top-1 right-1 p-1 rounded bg-red-600/80 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
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
  );
}

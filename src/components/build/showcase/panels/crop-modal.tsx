"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X, Loader2, Check } from "lucide-react";
import { useR2Upload } from "@/lib/upload/use-r2-upload";
import { toast } from "sonner";

interface CropModalProps {
  imageUrl: string;
  onComplete: (croppedUrl: string) => void;
  onClose: () => void;
}

function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create blob"));
    }, "image/png");
  });
}

export function CropModal({ imageUrl, onComplete, onClose }: CropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isUploading, setIsUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { upload } = useR2Upload({ type: "image" });

  const handleApply = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;
    if (completedCrop.width < 1 || completedCrop.height < 1) {
      toast.error("Select a crop area first");
      return;
    }

    setIsUploading(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      const file = new File([blob], "cropped.png", { type: "image/png" });
      const result = await upload(file);
      if (result) {
        onComplete(result.url);
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Crop failed");
    } finally {
      setIsUploading(false);
    }
  }, [completedCrop, upload, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 sm:mx-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 shrink-0">
          <h3 className="text-sm font-semibold text-white">Crop Image</h3>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Crop area — touch-action:none prevents scroll/zoom interference on mobile */}
        <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center" style={{ touchAction: "none" }}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop preview"
              className="max-h-[50vh] sm:max-h-[60vh] max-w-full object-contain"
              crossOrigin="anonymous"
              style={{ touchAction: "none" }}
            />
          </ReactCrop>
        </div>

        {/* Actions — larger touch targets on mobile */}
        <div
          className="flex items-center justify-end gap-2 px-4 py-3 sm:py-3 border-t border-zinc-700 shrink-0"
          style={{ paddingBottom: `max(0.75rem, env(safe-area-inset-bottom))` }}
        >
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2.5 sm:px-3 sm:py-1.5 rounded-lg text-sm sm:text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isUploading || !completedCrop}
            className="flex items-center gap-1.5 px-4 py-2.5 sm:px-3 sm:py-1.5 rounded-lg bg-gx-red text-white text-sm sm:text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-3 sm:w-3 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 sm:h-3 sm:w-3" />
                Apply Crop
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

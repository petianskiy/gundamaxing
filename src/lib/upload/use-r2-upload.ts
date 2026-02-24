"use client";

import { useState, useCallback, useRef } from "react";

interface UploadResult {
  url: string;
  key: string;
}

interface UseR2UploadOptions {
  type: "image" | "video";
  onProgress?: (progress: number) => void;
}

export function useR2Upload({ type, onProgress }: UseR2UploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const upload = useCallback(
    async (file: File): Promise<UploadResult> => {
      setIsUploading(true);
      setProgress(0);

      try {
        // Step 1: Get presigned URL from our API
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            type,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to get upload URL");
        }

        const { presignedUrl, url: fileUrl, key } = await res.json();

        // Step 2: Upload directly to R2
        abortRef.current = new AbortController();

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presignedUrl);
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = e.loaded / e.total;
              setProgress(pct);
              onProgress?.(pct);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.onabort = () => reject(new Error("Upload aborted"));

          // Wire up abort
          abortRef.current?.signal.addEventListener("abort", () => xhr.abort());

          xhr.send(file);
        });

        setProgress(1);
        return { url: fileUrl, key };
      } finally {
        setIsUploading(false);
        abortRef.current = null;
      }
    },
    [type, onProgress],
  );

  const uploadMultiple = useCallback(
    async (files: File[]): Promise<UploadResult[]> => {
      const results: UploadResult[] = [];
      for (let i = 0; i < files.length; i++) {
        const result = await upload(files[i]);
        results.push(result);
        // Report overall progress across all files
        setProgress((i + 1) / files.length);
      }
      return results;
    },
    [upload],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    upload,
    uploadMultiple,
    abort,
    isUploading,
    progress,
  };
}

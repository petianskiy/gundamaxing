"use client";

import { useState, useCallback } from "react";

export function useRemoveBackground() {
  const [isRemoving, setIsRemoving] = useState(false);
  const [progress, setProgress] = useState(0);

  const removeBg = useCallback(async (imageUrl: string): Promise<Blob> => {
    setIsRemoving(true);
    setProgress(0);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(imageUrl, {
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) setProgress(current / total);
        },
      });
      return blob;
    } finally {
      setIsRemoving(false);
      setProgress(0);
    }
  }, []);

  return { removeBg, isRemoving, progress };
}

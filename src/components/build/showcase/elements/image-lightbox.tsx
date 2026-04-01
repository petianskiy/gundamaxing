"use client";

import { useEffect, useState, useRef, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const subscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

interface ImageLightboxProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
  /** Optional: all sibling image URLs for swipe navigation */
  images?: { url: string; alt: string }[];
  /** Index of the current image in the images array */
  initialIndex?: number;
}

export function ImageLightbox({ imageUrl, alt, onClose, images, initialIndex = 0 }: ImageLightboxProps) {
  const mounted = useIsMounted();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeThreshold = 50;

  const hasMultiple = images && images.length > 1;
  const currentImage = hasMultiple ? images[currentIndex] : { url: imageUrl, alt };

  const imageCount = images?.length ?? 0;

  const canGoNext = hasMultiple && currentIndex < imageCount - 1;
  const canGoPrev = hasMultiple && currentIndex > 0;

  const goNext = useCallback(() => {
    if (imageCount <= 1) return;
    setCurrentIndex((i) => Math.min(i + 1, imageCount - 1));
  }, [imageCount]);

  const goPrev = useCallback(() => {
    if (imageCount <= 1) return;
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, [imageCount]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !hasMultiple) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Only horizontal swipes (ignore vertical), respect bounds
    if (Math.abs(dx) > swipeThreshold && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && canGoNext) goNext();
      else if (dx > 0 && canGoPrev) goPrev();
    }
  }, [hasMultiple, goNext, goPrev, canGoNext, canGoPrev]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        style={{ zIndex: 9999 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white/80 transition-colors hover:bg-black/70 hover:text-white"
          style={{ zIndex: 10000 }}
          aria-label="Close lightbox"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Nav arrows */}
        {hasMultiple && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 sm:p-3 text-white/80 hover:bg-black/70 hover:text-white transition-all ${canGoPrev ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              style={{ zIndex: 10000 }}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 sm:p-3 text-white/80 hover:bg-black/70 hover:text-white transition-all ${canGoNext ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              style={{ zIndex: 10000 }}
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </>
        )}

        {/* Image */}
        <motion.img
          key={currentImage.url}
          src={currentImage.url}
          alt={currentImage.alt}
          className="max-w-[90vw] max-h-[90vh] object-contain"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
        />

        {/* Dot indicators */}
        {hasMultiple && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5" style={{ zIndex: 10000 }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex ? "bg-white w-4" : "bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    // Skip video on reduced-motion preference or narrow screens (saves 13MB download)
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = window.innerWidth < 768;
    if (reducedMotion || narrow) return;

    setShowVideo(true);
  }, []);

  if (!showVideo) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 30%, #0a0a1a 70%, #0a0a0a 100%)",
        }}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      controlsList="nodownload nofullscreen noremoteplayback"
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
    >
      <source src="/hero.mp4" type="video/mp4" />
    </video>
  );
}

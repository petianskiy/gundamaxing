"use client";

import { useEffect, useRef, useState } from "react";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    setShowVideo(true);
  }, []);

  if (!showVideo || videoFailed) {
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
      preload="auto"
      poster="/images/hero-poster.jpg"
      onError={() => setVideoFailed(true)}
      disablePictureInPicture
      controlsList="nodownload nofullscreen noremoteplayback"
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
    >
      <source src="/hero.mp4" type="video/mp4" />
    </video>
  );
}

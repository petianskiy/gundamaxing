"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import type { ShowcaseVideoElement } from "@/lib/types";

// Global registry so only one video plays at a time
const activeVideoRef = { current: null as HTMLVideoElement | null };

interface VideoElementProps {
  element: ShowcaseVideoElement;
  isEditing?: boolean;
}

// Helper: convert px to cqi (reference: 1000px canvas = 100cqi)
function cqi(px: number): string {
  return `${px / 10}cqi`;
}

export function VideoElement({ element, isEditing }: VideoElementProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const volumePopupRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showControls, setShowControls] = useState(false);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Sync volume to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = volume === 0;
    }
  }, [volume]);

  // Close volume popup on click outside
  useEffect(() => {
    if (!showVolumePopup) return;
    function handleClickOutside(e: MouseEvent) {
      if (volumePopupRef.current && !volumePopupRef.current.contains(e.target as Node)) {
        setShowVolumePopup(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showVolumePopup]);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      if (activeVideoRef.current && activeVideoRef.current !== video) {
        activeVideoRef.current.pause();
      }
      activeVideoRef.current = video;
      video.volume = volume;
      video.muted = volume === 0;
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying, volume]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
  }, []);

  // Handle video end
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleEnded = () => {
      if (!element.loop) {
        setIsPlaying(false);
        if (activeVideoRef.current === video) activeVideoRef.current = null;
      }
    };
    const handlePause = () => setIsPlaying(false);
    const handleLoadedData = () => setHasLoaded(true);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("pause", handlePause);
    video.addEventListener("loadeddata", handleLoadedData);
    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("loadeddata", handleLoadedData);
      if (activeVideoRef.current === video) activeVideoRef.current = null;
    };
  }, [element.loop]);

  return (
    <div
      className="relative w-full h-full overflow-hidden group"
      style={{ borderRadius: cqi(element.borderRadius) }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => { setShowControls(false); setShowVolumePopup(false); }}
    >
      <video
        ref={videoRef}
        src={element.url}
        muted
        loop={element.loop}
        playsInline
        preload="auto"
        className="w-full h-full"
        style={{ objectFit: "cover" }}
        onContextMenu={(e) => e.preventDefault()}
        controlsList="nodownload"
      />

      {/* Loading placeholder before video loads */}
      {!hasLoaded && (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
          <Play style={{ width: cqi(24), height: cqi(24) }} className="text-white/40" />
        </div>
      )}

      {/* Click-to-play/pause overlay — covers entire video */}
      {!isEditing && (
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={togglePlay}
        />
      )}

      {/* Play icon overlay when paused */}
      {!isPlaying && hasLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none"
        >
          <div
            className="rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            style={{ width: cqi(48), height: cqi(48) }}
          >
            <Play style={{ width: cqi(20), height: cqi(20), marginLeft: cqi(2) }} className="text-white" fill="white" />
          </div>
        </div>
      )}

      {/* Controls bar */}
      {isPlaying && showControls && (
        <div
          className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent flex items-center"
          style={{ padding: `${cqi(10)} ${cqi(12)}`, gap: cqi(10) }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button onClick={togglePlay} className="text-white hover:text-blue-300 transition-colors shrink-0">
            <Pause style={{ width: cqi(16), height: cqi(16) }} />
          </button>

          {/* Volume icon + vertical popup */}
          <div className="relative shrink-0" ref={volumePopupRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowVolumePopup((v) => !v);
              }}
              className="text-white hover:text-blue-300 transition-colors"
            >
              {volume > 0
                ? <Volume2 style={{ width: cqi(16), height: cqi(16) }} />
                : <VolumeX style={{ width: cqi(16), height: cqi(16) }} />}
            </button>

            {/* Vertical volume popup */}
            {showVolumePopup && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 rounded-lg bg-black/90 backdrop-blur-sm border border-white/10 flex flex-col items-center"
                style={{ marginBottom: cqi(8), padding: `${cqi(12)} ${cqi(10)}`, gap: cqi(8) }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <span className="text-white/60 tabular-nums" style={{ fontSize: cqi(10) }}>{Math.round(volume * 100)}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={handleVolumeChange}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="showcase-volume-vertical"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setVolume(volume > 0 ? 0 : 0.5);
                  }}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  {volume > 0
                    ? <Volume2 style={{ width: cqi(12), height: cqi(12) }} />
                    : <VolumeX style={{ width: cqi(12), height: cqi(12) }} />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editing overlay */}
      {isEditing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <div className="text-white/60 font-medium" style={{ fontSize: cqi(12) }}>Video</div>
        </div>
      )}
    </div>
  );
}

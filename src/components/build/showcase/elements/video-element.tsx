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

export function VideoElement({ element, isEditing }: VideoElementProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const volumePopupRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(element.muted ? 0 : 0.5);
  const [showControls, setShowControls] = useState(false);
  const [showVolumePopup, setShowVolumePopup] = useState(false);

  // Sync volume to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = volume === 0;
    }
  }, [volume]);

  // Sync muted prop changes from props panel
  useEffect(() => {
    if (element.muted && volume > 0) {
      setVolume(0);
    } else if (!element.muted && volume === 0) {
      setVolume(0.5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element.muted]);

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
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

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
    video.addEventListener("ended", handleEnded);
    video.addEventListener("pause", handlePause);
    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("pause", handlePause);
      if (activeVideoRef.current === video) activeVideoRef.current = null;
    };
  }, [element.loop]);

  return (
    <div
      className="relative w-full h-full overflow-hidden group"
      style={{ borderRadius: element.borderRadius }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => { setShowControls(false); setShowVolumePopup(false); }}
    >
      <video
        ref={videoRef}
        src={element.url}
        muted={volume === 0}
        loop={element.loop}
        playsInline
        preload="metadata"
        className="w-full h-full"
        style={{ objectFit: "cover" }}
        onContextMenu={(e) => e.preventDefault()}
        controlsList="nodownload"
      />

      {/* Play overlay */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
            <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
          </div>
        </div>
      )}

      {/* Controls bar */}
      {isPlaying && showControls && (
        <div
          className="absolute bottom-0 inset-x-0 px-3 py-2.5 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2.5"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button onClick={togglePlay} className="text-white hover:text-blue-300 transition-colors shrink-0">
            <Pause className="h-4 w-4" />
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
              {volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Vertical volume popup */}
            {showVolumePopup && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-3 rounded-lg bg-black/90 backdrop-blur-sm border border-white/10 flex flex-col items-center gap-2"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] text-white/60 tabular-nums">{Math.round(volume * 100)}</span>
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
                  {volume > 0 ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editing overlay */}
      {isEditing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <div className="text-white/60 text-xs font-medium">Video</div>
        </div>
      )}
    </div>
  );
}

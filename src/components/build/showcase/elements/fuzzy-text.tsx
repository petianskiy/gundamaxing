"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface FuzzyTextProps {
  children: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  color?: string;
  baseIntensity?: number;
  hoverIntensity?: number;
  fuzzRange?: number;
  direction?: "horizontal" | "vertical" | "both";
  transitionDuration?: number;
  letterSpacing?: number;
  enableHover?: boolean;
  clickEffect?: boolean;
  glitchMode?: boolean;
  glitchInterval?: number;
  glitchDuration?: number;
  className?: string;
}

export function FuzzyText({
  children,
  fontSize = 24,
  fontWeight = 400,
  fontFamily = "sans-serif",
  color = "#ffffff",
  baseIntensity = 0.18,
  hoverIntensity = 0.5,
  fuzzRange = 0.08,
  direction = "horizontal",
  transitionDuration = 0.15,
  letterSpacing = 0,
  enableHover = true,
  clickEffect = false,
  glitchMode = false,
  glitchInterval = 5,
  glitchDuration = 0.3,
  className = "",
}: FuzzyTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  const intensityRef = useRef(baseIntensity);

  // Click burst state
  const clickBurstRef = useRef(0);
  const clickBurstDecayRef = useRef(false);

  // Glitch state
  const glitchActiveRef = useRef(false);
  const glitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store latest prop values in refs for the animation loop
  const propsRef = useRef({
    baseIntensity,
    hoverIntensity,
    fuzzRange,
    direction,
    transitionDuration,
    letterSpacing,
    enableHover,
    clickEffect,
    glitchMode,
    glitchInterval,
    glitchDuration,
  });

  useEffect(() => {
    propsRef.current = {
      baseIntensity,
      hoverIntensity,
      fuzzRange,
      direction,
      transitionDuration,
      letterSpacing,
      enableHover,
      clickEffect,
      glitchMode,
      glitchInterval,
      glitchDuration,
    };
  }, [
    baseIntensity,
    hoverIntensity,
    fuzzRange,
    direction,
    transitionDuration,
    letterSpacing,
    enableHover,
    clickEffect,
    glitchMode,
    glitchInterval,
    glitchDuration,
  ]);

  const isHoveredRef = useRef(isHovered);
  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  // Glitch timer management
  useEffect(() => {
    if (!glitchMode) {
      glitchActiveRef.current = false;
      if (glitchTimerRef.current) {
        clearTimeout(glitchTimerRef.current);
        glitchTimerRef.current = null;
      }
      return;
    }

    function scheduleGlitch() {
      glitchTimerRef.current = setTimeout(() => {
        glitchActiveRef.current = true;
        // End glitch after glitchDuration
        setTimeout(() => {
          glitchActiveRef.current = false;
          scheduleGlitch();
        }, propsRef.current.glitchDuration * 1000);
      }, propsRef.current.glitchInterval * 1000);
    }

    scheduleGlitch();

    return () => {
      if (glitchTimerRef.current) {
        clearTimeout(glitchTimerRef.current);
        glitchTimerRef.current = null;
      }
      glitchActiveRef.current = false;
    };
  }, [glitchMode, glitchInterval, glitchDuration]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const offscreen = offscreenRef.current;
    if (!canvas || !offscreen) return;

    const ctx = canvas.getContext("2d");
    const offCtx = offscreen.getContext("2d");
    if (!ctx || !offCtx) return;

    const dpr = window.devicePixelRatio || 1;
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Resize canvases if needed
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      offscreen.width = width * dpr;
      offscreen.height = height * dpr;
    }

    const w = canvas.width;
    const h = canvas.height;

    // Resolve font size from inherited CSS (supports cqi container query units)
    const resolvedFontSize = parseFloat(getComputedStyle(container).fontSize) || fontSize;

    const currentLetterSpacing = propsRef.current.letterSpacing;

    // Draw clean text to offscreen canvas
    offCtx.clearRect(0, 0, w, h);
    offCtx.fillStyle = color;
    offCtx.font = `${fontWeight} ${resolvedFontSize * dpr}px ${fontFamily}`;
    offCtx.textBaseline = "middle";
    offCtx.textAlign = "center";

    // Apply letter spacing if the canvas API supports it
    if ("letterSpacing" in offCtx && currentLetterSpacing !== 0) {
      (offCtx as unknown as { letterSpacing: string }).letterSpacing = `${currentLetterSpacing * dpr}px`;
    }

    // Word-wrap text to fit width
    const maxWidth = w - 16 * dpr; // padding
    const words = children.split(" ");
    const lines: string[] = [];
    let currentLine = words[0] || "";

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + " " + words[i];
      const metrics = offCtx.measureText(testLine);
      if (metrics.width > maxWidth) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const lineHeight = resolvedFontSize * dpr * 1.3;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (h - totalTextHeight) / 2 + lineHeight / 2;

    // If letterSpacing and no native support, draw characters manually
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx2 = offCtx as any;
    const hasNativeLetterSpacing = typeof ctx2.letterSpacing !== "undefined";
    if (currentLetterSpacing !== 0 && hasNativeLetterSpacing) {
      ctx2.letterSpacing = `${currentLetterSpacing * dpr}px`;
      for (let i = 0; i < lines.length; i++) {
        offCtx.fillText(lines[i], w / 2, startY + i * lineHeight);
      }
      ctx2.letterSpacing = "0px";
    } else if (currentLetterSpacing !== 0) {
      offCtx.textAlign = "left";
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let totalWidth = 0;
        for (let c = 0; c < line.length; c++) {
          totalWidth += offCtx.measureText(line[c]).width;
          if (c < line.length - 1) totalWidth += currentLetterSpacing * dpr;
        }
        let xPos = (w - totalWidth) / 2;
        const yPos = startY + i * lineHeight;
        for (let c = 0; c < line.length; c++) {
          offCtx.fillText(line[c], xPos, yPos);
          xPos += offCtx.measureText(line[c]).width + currentLetterSpacing * dpr;
        }
      }
    } else {
      for (let i = 0; i < lines.length; i++) {
        offCtx.fillText(lines[i], w / 2, startY + i * lineHeight);
      }
    }

    // Copy offscreen to main canvas with distortion
    ctx.clearRect(0, 0, w, h);

    const intensity = intensityRef.current;
    const dir = propsRef.current.direction;

    if (dir === "horizontal" || dir === "both") {
      // Horizontal distortion: offset rows
      const sliceHeight = Math.max(1, Math.floor(2 * dpr));
      const maxDisplacement = w * intensity * propsRef.current.fuzzRange;

      if (dir === "both") {
        // For "both", we need an intermediate buffer
        // First apply horizontal to a temp, then vertical from temp to main
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          // Horizontal pass
          for (let y = 0; y < h; y += sliceHeight) {
            const sh = Math.min(sliceHeight, h - y);
            const displacement = (Math.random() - 0.5) * 2 * maxDisplacement;
            tempCtx.drawImage(offscreen, 0, y, w, sh, displacement, y, w, sh);
          }
          // Vertical pass
          const sliceWidth = Math.max(1, Math.floor(2 * dpr));
          const maxVDisplacement = h * intensity * propsRef.current.fuzzRange;
          for (let x = 0; x < w; x += sliceWidth) {
            const sw = Math.min(sliceWidth, w - x);
            const displacement = (Math.random() - 0.5) * 2 * maxVDisplacement;
            ctx.drawImage(tempCanvas, x, 0, sw, h, x, displacement, sw, h);
          }
        }
      } else {
        // Horizontal only
        for (let y = 0; y < h; y += sliceHeight) {
          const sh = Math.min(sliceHeight, h - y);
          const displacement = (Math.random() - 0.5) * 2 * maxDisplacement;
          ctx.drawImage(offscreen, 0, y, w, sh, displacement, y, w, sh);
        }
      }
    } else if (dir === "vertical") {
      // Vertical distortion: offset columns
      const sliceWidth = Math.max(1, Math.floor(2 * dpr));
      const maxDisplacement = h * intensity * propsRef.current.fuzzRange;

      for (let x = 0; x < w; x += sliceWidth) {
        const sw = Math.min(sliceWidth, w - x);
        const displacement = (Math.random() - 0.5) * 2 * maxDisplacement;
        ctx.drawImage(offscreen, x, 0, sw, h, x, displacement, sw, h);
      }
    }
  }, [children, fontSize, fontWeight, fontFamily, color]);

  // Initialize offscreen canvas
  useEffect(() => {
    offscreenRef.current = document.createElement("canvas");
    return () => {
      offscreenRef.current = null;
    };
  }, []);

  // Animation loop capped at configured fps
  useEffect(() => {
    let lastTime = 0;

    function animate(time: number) {
      const frameInterval = 1000 / 30; // 30fps cap
      if (time - lastTime >= frameInterval) {
        const props = propsRef.current;

        // Determine target intensity
        let target = props.baseIntensity;
        if (props.enableHover && isHoveredRef.current) {
          target = props.hoverIntensity;
        }

        // Click burst overlay
        if (clickBurstDecayRef.current) {
          clickBurstRef.current *= 0.88; // exponential decay
          if (clickBurstRef.current < 0.01) {
            clickBurstRef.current = 0;
            clickBurstDecayRef.current = false;
          }
          target = Math.max(target, clickBurstRef.current);
        }

        // Glitch burst overlay
        if (glitchActiveRef.current) {
          target = Math.max(target, 1.0);
        }

        // Lerp intensity toward target
        intensityRef.current +=
          (target - intensityRef.current) * props.transitionDuration;

        render();
        lastTime = time;
      }
      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [render]);

  const handleClick = useCallback(() => {
    if (propsRef.current.clickEffect) {
      clickBurstRef.current = 1.0;
      clickBurstDecayRef.current = true;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", position: "relative" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}

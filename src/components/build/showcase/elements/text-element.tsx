"use client";

import { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { GradientText } from "./gradient-text";
import { FuzzyText } from "./fuzzy-text";
import type { ShowcaseTextElement } from "@/lib/types";

const RichTextEditor = dynamic(() => import("./rich-text-editor"), { ssr: false });

const textAlignMap: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const fontFamilyMap: Record<string, string> = {
  geist: "font-sans",
  orbitron: "font-[family-name:var(--font-orbitron)]",
  rajdhani: "font-[family-name:var(--font-rajdhani)]",
  exo2: "font-[family-name:var(--font-exo2)]",
  shareTechMono: "font-[family-name:var(--font-share-tech-mono)]",
  audiowide: "font-[family-name:var(--font-audiowide)]",
  chakraPetch: "font-[family-name:var(--font-chakra-petch)]",
};

interface TextElementProps {
  element: ShowcaseTextElement;
  isEditing?: boolean;
  onContentChange?: (content: string) => void;
  onHtmlContentChange?: (html: string) => void;
}

export function TextElement({ element, isEditing, onContentChange, onHtmlContentChange }: TextElementProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(ref.current);
      // If content is the default placeholder, select all so typing replaces it
      if (element.content === "Double-click to edit...") {
        // Leave range selecting all content
      } else {
        // Place cursor at end for existing content
        range.collapse(false);
      }
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing, element.content]);

  const baseClassName = cn(
    "w-full h-full leading-relaxed whitespace-pre-wrap break-words overflow-hidden",
    textAlignMap[element.textAlign],
    fontFamilyMap[element.fontFamily] || "font-sans",
    element.bold && "font-bold",
    element.italic && "italic",
    isEditing && "outline-none cursor-text ring-1 ring-blue-400/50"
  );

  // Scale all sizes proportionally with canvas width using container query units.
  // Reference: ~1000px canvas width → 1cqi = 10px.
  const sharedStyle: React.CSSProperties = {
    fontSize: `${element.fontSize / 10}cqi`,
    padding: `${0.8}cqi ${1.2}cqi`,
    borderRadius: `${0.8}cqi`,
    backgroundColor: element.backgroundColor || "transparent",
    writingMode: element.textDirection === "vertical" ? "vertical-rl" : undefined,
  };

  // Rich text mode: render Tiptap editor when editing, or render HTML when viewing
  if (element.htmlContent) {
    if (isEditing && onHtmlContentChange) {
      return (
        <div className={baseClassName} style={sharedStyle}>
          <RichTextEditor
            content={element.htmlContent}
            color={element.color}
            fontSize={`${element.fontSize / 10}cqi`}
            fontFamily={fontFamilyMap[element.fontFamily] || "sans-serif"}
            textAlign={element.textAlign}
            onChange={onHtmlContentChange}
          />
        </div>
      );
    }
    return (
      <div
        className={baseClassName}
        style={{ ...sharedStyle, color: element.color }}
        dangerouslySetInnerHTML={{ __html: element.htmlContent }}
      />
    );
  }

  // Fuzzy text (canvas-based distortion effect) — takes priority over gradient
  if (element.fuzzy && !isEditing) {
    return (
      <div className={baseClassName} style={sharedStyle}>
        <FuzzyText
          fontSize={element.fontSize}
          fontWeight={element.bold ? 700 : 400}
          color={element.color}
          baseIntensity={element.fuzzyIntensity}
          hoverIntensity={element.fuzzyHoverIntensity}
          fuzzRange={element.fuzzyFuzzRange}
          direction={element.fuzzyDirection}
          transitionDuration={element.fuzzyTransitionDuration}
          letterSpacing={element.fuzzyLetterSpacing}
          enableHover={element.fuzzyEnableHover}
          clickEffect={element.fuzzyClickEffect}
          glitchMode={element.fuzzyGlitchMode}
          glitchInterval={element.fuzzyGlitchInterval}
          glitchDuration={element.fuzzyGlitchDuration}
        >
          {element.content}
        </FuzzyText>
      </div>
    );
  }

  // When gradient is active but not editing, wrap in GradientText
  // GradientText handles its own underline/strikethrough via textDecorationColor
  if (element.gradient && !isEditing) {
    return (
      <div className={baseClassName} style={sharedStyle}>
        <GradientText
          colors={element.gradientColors}
          speed={element.gradientSpeed}
          underline={element.underline}
          strikethrough={element.strikethrough}
          decorationColor={element.gradientColors[0]}
        >
          {element.content}
        </GradientText>
      </div>
    );
  }

  // Build text-decoration for underline/strikethrough
  const decorationLines: string[] = [];
  if (element.underline) decorationLines.push("underline");
  if (element.strikethrough) decorationLines.push("line-through");

  // Normal text (no gradient or editing mode)
  return (
    <div
      ref={ref}
      className={baseClassName}
      style={{
        ...sharedStyle,
        color: element.color,
        textDecorationLine: decorationLines.length > 0 ? decorationLines.join(" ") : undefined,
        textDecorationColor: element.color,
      }}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onBlur={(e) => {
        if (isEditing && onContentChange) {
          onContentChange(e.currentTarget.textContent || "");
        }
      }}
    >
      {element.content}
    </div>
  );
}

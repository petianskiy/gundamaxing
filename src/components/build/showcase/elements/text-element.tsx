"use client";

import { cn } from "@/lib/utils";
import type { ShowcaseTextElement } from "@/lib/types";

const fontSizeMap: Record<string, string> = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
};

const fontWeightMap: Record<string, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const textAlignMap: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

interface TextElementProps {
  element: ShowcaseTextElement;
  isEditing?: boolean;
  onContentChange?: (content: string) => void;
}

export function TextElement({ element, isEditing, onContentChange }: TextElementProps) {
  return (
    <div
      className={cn(
        "w-full h-full px-3 py-2 leading-relaxed whitespace-pre-wrap break-words overflow-hidden",
        fontSizeMap[element.fontSize],
        fontWeightMap[element.fontWeight],
        textAlignMap[element.textAlign],
        isEditing && "outline-none cursor-text"
      )}
      style={{
        color: element.color,
        backgroundColor: element.backgroundColor || "transparent",
        borderRadius: "8px",
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

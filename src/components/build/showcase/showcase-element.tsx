"use client";

import { ImageElement } from "./elements/image-element";
import { TextElement } from "./elements/text-element";
import { MetadataElement } from "./elements/metadata-element";
import { EffectElement } from "./elements/effect-element";
import { VideoElement } from "./elements/video-element";
import type { Build, ShowcaseElement as ShowcaseElementType } from "@/lib/types";

interface ShowcaseElementProps {
  element: ShowcaseElementType;
  build: Build;
  isEditing?: boolean;
  onContentChange?: (content: string) => void;
}

export function ShowcaseElement({ element, build, isEditing, onContentChange }: ShowcaseElementProps) {
  switch (element.type) {
    case "image":
      return <ImageElement element={element} />;
    case "text":
      return (
        <TextElement
          element={element}
          isEditing={isEditing}
          onContentChange={onContentChange}
        />
      );
    case "metadata":
      return <MetadataElement element={element} build={build} />;
    case "effect":
      return <EffectElement element={element} />;
    case "video":
      return <VideoElement element={element} isEditing={isEditing} />;
    default:
      return null;
  }
}

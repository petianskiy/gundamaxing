"use client";

import { ImageElement } from "./elements/image-element";
import { TextElement } from "./elements/text-element";
import { MetadataElement } from "./elements/metadata-element";
import { EffectElement } from "./elements/effect-element";
import { VideoElement } from "./elements/video-element";
import { ShapeElement } from "./elements/shape-element";
import type { Build, ShowcaseElement as ShowcaseElementType } from "@/lib/types";

interface ShowcaseElementProps {
  element: ShowcaseElementType;
  build: Build;
  isEditing?: boolean;
  onContentChange?: (content: string) => void;
  onHtmlContentChange?: (html: string) => void;
}

export function ShowcaseElement({ element, build, isEditing, onContentChange, onHtmlContentChange }: ShowcaseElementProps) {
  switch (element.type) {
    case "image":
      return <ImageElement element={element} />;
    case "text":
      return (
        <TextElement
          element={element}
          isEditing={isEditing}
          onContentChange={onContentChange}
          onHtmlContentChange={onHtmlContentChange}
        />
      );
    case "metadata":
      return <MetadataElement element={element} build={build} />;
    case "effect":
      return <EffectElement element={element} />;
    case "video":
      return <VideoElement element={element} isEditing={isEditing} />;
    case "shape":
      return <ShapeElement element={element} isEditing={isEditing} />;
    default:
      return null;
  }
}

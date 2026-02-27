"use client";

import { useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  color: string;
  fontSize: string;
  fontFamily: string;
  textAlign: "left" | "center" | "right";
  onChange: (html: string) => void;
}

export default function RichTextEditor({
  content,
  color,
  fontSize,
  fontFamily,
  textAlign,
  onChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable heading, codeBlock, blockquote — keep it simple
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      TextStyle,
      Color,
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        style: [
          `color: ${color}`,
          `font-size: ${fontSize}`,
          `font-family: ${fontFamily}`,
          `text-align: ${textAlign}`,
        ].join("; "),
        class: "outline-none min-h-[1em] w-full h-full",
      },
    },
  });

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editor) return;
      editor.chain().focus().setColor(e.target.value).run();
    },
    [editor],
  );

  if (!editor) return null;

  return (
    <div className="flex flex-col w-full h-full">
      {/* Mini toolbar */}
      <div className="flex items-center gap-0.5 rounded-md bg-zinc-900/90 backdrop-blur-sm p-0.5 mb-1 w-fit">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded text-zinc-400 hover:text-white transition-colors",
            editor.isActive("bold") && "bg-blue-600 text-white",
          )}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded text-zinc-400 hover:text-white transition-colors",
            editor.isActive("italic") && "bg-blue-600 text-white",
          )}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded text-zinc-400 hover:text-white transition-colors",
            editor.isActive("underline") && "bg-blue-600 text-white",
          )}
          title="Underline"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>

        <label
          className="flex items-center justify-center w-6 h-6 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer relative"
          title="Text color"
        >
          <Palette className="w-3.5 h-3.5" />
          <input
            type="color"
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            defaultValue={color}
            onChange={handleColorChange}
          />
        </label>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="flex-1 bg-transparent [&_.tiptap]:outline-none [&_.tiptap]:w-full [&_.tiptap]:h-full"
      />
    </div>
  );
}

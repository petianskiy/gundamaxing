"use client";

import { useState, useCallback, type KeyboardEvent } from "react";
import type { BrushCategory } from "../../engine/brush-types";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<BrushCategory, string> = {
  pencils: "Pencils",
  inks: "Inks",
  paints: "Paints",
  airbrush: "Airbrush",
  markers: "Markers",
  textures: "Textures",
  fx: "FX",
  mecha: "Mecha",
  erasers: "Erasers",
  custom: "Custom",
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as BrushCategory[];

const inputClassName =
  "bg-zinc-800 text-xs text-zinc-300 px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500";

interface BrushStudioHeaderProps {
  name: string;
  category: BrushCategory;
  folder?: string;
  tags: string[];
  isNew: boolean;
  isSaving: boolean;
  onNameChange: (name: string) => void;
  onCategoryChange: (category: BrushCategory) => void;
  onFolderChange: (folder: string | undefined) => void;
  onTagsChange: (tags: string[]) => void;
  onSave: () => void;
  onSaveAs: () => void;
  onReset: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function BrushStudioHeader({
  name,
  category,
  folder,
  tags,
  isNew,
  isSaving,
  onNameChange,
  onCategoryChange,
  onFolderChange,
  onTagsChange,
  onSave,
  onSaveAs,
  onReset,
  onCancel,
  onDelete,
}: BrushStudioHeaderProps) {
  const [tagInput, setTagInput] = useState("");

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        onTagsChange([...tags, tag]);
      }
      setTagInput("");
    },
    [tags, onTagsChange]
  );

  const removeTag = useCallback(
    (tag: string) => {
      onTagsChange(tags.filter((t) => t !== tag));
    },
    [tags, onTagsChange]
  );

  const handleTagKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(tagInput);
      }
      // Allow backspace to remove last tag when input is empty
      if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
        removeTag(tags[tags.length - 1]);
      }
    },
    [tagInput, tags, addTag, removeTag]
  );

  const handleTagInputChange = useCallback(
    (value: string) => {
      // If user pastes or types a comma, split and add tags
      if (value.includes(",")) {
        const parts = value.split(",");
        // Add all complete parts (before the last comma)
        for (const part of parts.slice(0, -1)) {
          addTag(part);
        }
        // Keep whatever is after the last comma as current input
        setTagInput(parts[parts.length - 1]);
      } else {
        setTagInput(value);
      }
    },
    [addTag]
  );

  return (
    <div className="space-y-2">
      {/* Name input */}
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Brush name..."
        className={cn(inputClassName, "w-full")}
      />

      {/* Category + Folder row */}
      <div className="flex gap-2">
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as BrushCategory)}
          className={cn(inputClassName, "flex-1")}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={folder ?? ""}
          onChange={(e) =>
            onFolderChange(e.target.value || undefined)
          }
          placeholder="Folder (optional)"
          className={cn(inputClassName, "w-36")}
        />
      </div>

      {/* Tags */}
      <div className="space-y-1">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-zinc-700 text-[10px] text-zinc-300 px-2 py-0.5 rounded-full flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-zinc-500 hover:text-white"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => handleTagInputChange(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={() => {
            if (tagInput.trim()) addTag(tagInput);
          }}
          placeholder="Add tags (comma-separated)"
          className={cn(inputClassName, "w-full")}
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>

        {!isNew && (
          <button
            type="button"
            onClick={onSaveAs}
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs px-3 py-1.5 rounded-md"
          >
            Save As
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          className="text-zinc-400 hover:text-white text-xs px-2 py-1.5"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="text-zinc-400 hover:text-white text-xs px-2 py-1.5"
        >
          Cancel
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-red-400 hover:text-red-300 text-xs px-2 py-1.5"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

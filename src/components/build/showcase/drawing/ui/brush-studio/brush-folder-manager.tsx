"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrushFolderManagerProps {
  folders: string[];
  currentFolder?: string;
  onSelectFolder: (folder: string | undefined) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (oldName: string, newName: string) => void;
  onDeleteFolder: (name: string) => void;
}

export function BrushFolderManager({
  folders,
  currentFolder,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: BrushFolderManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);

  const createInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus the create input when it appears
  useEffect(() => {
    if (isCreating && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [isCreating]);

  // Focus the edit input when it appears
  useEffect(() => {
    if (editingFolder && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingFolder]);

  function handleCreateSubmit() {
    const trimmed = newFolderName.trim();
    if (trimmed && !folders.includes(trimmed)) {
      onCreateFolder(trimmed);
    }
    setNewFolderName("");
    setIsCreating(false);
  }

  function handleRenameSubmit(oldName: string) {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== oldName && !folders.includes(trimmed)) {
      onRenameFolder(oldName, trimmed);
    }
    setEditingFolder(null);
    setEditName("");
  }

  function handleFolderAction(folder: string) {
    // Toggle the action buttons for this folder
    setExpandedFolder((prev) => (prev === folder ? null : folder));
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-zinc-500">Folders</label>
        <button
          onClick={() => {
            setIsCreating(true);
            setExpandedFolder(null);
          }}
          className="text-zinc-500 hover:text-blue-400 transition-colors"
          title="New folder"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {/* Uncategorized — always first */}
        <button
          onClick={() => onSelectFolder(undefined)}
          className={cn(
            "text-[10px] px-2 py-1 rounded-md transition-colors",
            currentFolder === undefined
              ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50"
              : "bg-zinc-800 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700"
          )}
        >
          Uncategorized
        </button>

        {/* Folder chips */}
        {folders.map((folder) => (
          <div key={folder} className="relative">
            {editingFolder === folder ? (
              <input
                ref={editInputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit(folder);
                  if (e.key === "Escape") {
                    setEditingFolder(null);
                    setEditName("");
                  }
                }}
                onBlur={() => handleRenameSubmit(folder)}
                className="text-[10px] px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-blue-500 outline-none w-20"
              />
            ) : (
              <button
                onClick={() => onSelectFolder(folder)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleFolderAction(folder);
                }}
                onPointerDown={(e) => {
                  if (e.pointerType === "touch") {
                    const timer = setTimeout(() => handleFolderAction(folder), 500);
                    const cleanup = () => {
                      clearTimeout(timer);
                      e.target.removeEventListener("pointerup", cleanup);
                      e.target.removeEventListener("pointercancel", cleanup);
                    };
                    e.target.addEventListener("pointerup", cleanup, { once: true });
                    e.target.addEventListener("pointercancel", cleanup, { once: true });
                  }
                }}
                className={cn(
                  "text-[10px] px-2 py-1 rounded-md transition-colors",
                  currentFolder === folder
                    ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700"
                )}
              >
                {folder}
              </button>
            )}

            {/* Inline rename / delete actions */}
            {expandedFolder === folder && editingFolder !== folder && (
              <div className="absolute top-full left-0 mt-0.5 flex gap-0.5 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditName(folder);
                    setEditingFolder(folder);
                    setExpandedFolder(null);
                  }}
                  className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-blue-400 transition-colors"
                  title="Rename"
                >
                  <Pencil className="h-2.5 w-2.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folder);
                    setExpandedFolder(null);
                  }}
                  className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Inline create input */}
        {isCreating && (
          <input
            ref={createInputRef}
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateSubmit();
              if (e.key === "Escape") {
                setIsCreating(false);
                setNewFolderName("");
              }
            }}
            onBlur={handleCreateSubmit}
            placeholder="Folder name"
            className="text-[10px] px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-blue-500 outline-none w-20 placeholder:text-zinc-600"
          />
        )}
      </div>
    </div>
  );
}

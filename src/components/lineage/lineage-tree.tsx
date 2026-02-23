"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GitFork, ChevronRight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import type { LineageNodeUI } from "@/lib/types";

interface LineageTreeProps {
  nodes: LineageNodeUI[];
  interactive?: boolean;
}

// ─── Single tree node ────────────────────────────────────────

function TreeNodeCard({
  node,
  isSelected,
  onClick,
  depth,
}: {
  node: LineageNodeUI;
  isSelected: boolean;
  onClick: () => void;
  depth: number;
}) {
  const primaryImage = node.build.images.find((img) => img.isPrimary) || node.build.images[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: depth * 0.08 }}
      onClick={onClick}
      className={cn(
        "w-52 rounded-lg border bg-card cursor-pointer transition-all duration-200 overflow-hidden flex shrink-0",
        isSelected
          ? "border-gx-red shadow-lg shadow-gx-red/10 ring-1 ring-gx-red/30"
          : "border-border/50 hover:border-gx-red/40"
      )}
    >
      {/* Thumbnail */}
      {primaryImage && (
        <div className="relative w-14 h-[68px] flex-shrink-0">
          <Image src={primaryImage.url} alt={node.build.title} fill className="object-cover" unoptimized />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 p-2 flex flex-col justify-center">
        <p className="text-xs font-semibold text-foreground truncate">{node.build.title}</p>
        <p className="text-[10px] text-muted-foreground truncate">{node.build.kitName}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{node.build.grade}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{node.build.scale}</span>
        </div>
      </div>

      {/* Annotation indicator */}
      {node.annotation && (
        <div className="flex items-center pr-2">
          <MessageSquare className="h-3 w-3 text-gx-red/50" />
        </div>
      )}
    </motion.div>
  );
}

// ─── Recursive branch renderer ───────────────────────────────

function TreeBranch({
  node,
  depth,
  selectedNodeId,
  onNodeClick,
}: {
  node: LineageNodeUI;
  depth: number;
  selectedNodeId: string | null;
  onNodeClick: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-0">
      {/* This node */}
      <TreeNodeCard
        node={node}
        isSelected={selectedNodeId === node.id}
        onClick={() => onNodeClick(node.id)}
        depth={depth}
      />

      {/* Children */}
      {node.children.length > 0 && (
        <>
          {/* Horizontal connector from this node to children column */}
          <div className="w-8 h-px bg-border/60 shrink-0 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-border/60" />
          </div>

          {/* Children column */}
          <div className="flex flex-col gap-3 relative">
            {/* Vertical connector line spanning the children */}
            {node.children.length > 1 && (
              <div className="absolute left-0 top-[34px] bottom-[34px] w-px bg-border/40" />
            )}

            {node.children.map((child) => (
              <div key={child.id} className="flex items-center gap-0 relative">
                {/* Horizontal tick from vertical line to child */}
                {node.children.length > 1 && (
                  <div className="w-4 h-px bg-border/40 shrink-0" />
                )}
                <TreeBranch
                  node={child}
                  depth={depth + 1}
                  selectedNodeId={selectedNodeId}
                  onNodeClick={onNodeClick}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main tree component ─────────────────────────────────────

export function LineageTree({ nodes, interactive = true }: LineageTreeProps) {
  const { t } = useTranslation();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Flatten all nodes for lookup
  const allNodesMap = useMemo(() => {
    const map = new Map<string, LineageNodeUI>();
    function walk(node: LineageNodeUI) {
      map.set(node.id, node);
      for (const child of node.children) walk(child);
    }
    for (const root of nodes) walk(root);
    return map;
  }, [nodes]);

  const selectedNode = selectedNodeId ? allNodesMap.get(selectedNodeId) ?? null : null;

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (!interactive) return;
      setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
    },
    [interactive]
  );

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <GitFork className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-sm">{t("lineage.tree.emptyTree")}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Scrollable tree container */}
      <div className="overflow-x-auto pb-4">
        <div className="flex flex-col gap-6 min-w-fit p-4">
          {nodes.map((root) => (
            <TreeBranch
              key={root.id}
              node={root}
              depth={0}
              selectedNodeId={selectedNodeId}
              onNodeClick={handleNodeClick}
            />
          ))}
        </div>
      </div>

      {/* Selected node detail panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 rounded-lg border border-border/50 bg-card p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground">{selectedNode.build.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {selectedNode.build.kitName} &middot; {selectedNode.build.grade} &middot; {selectedNode.build.scale}
                </p>
                {selectedNode.annotation && (
                  <div className="mt-3 p-3 rounded-md bg-zinc-900/50 border border-border/30">
                    <p className="text-[10px] font-medium text-gx-red uppercase tracking-wider mb-1">
                      {t("lineage.tree.annotation")}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{selectedNode.annotation}</p>
                  </div>
                )}
              </div>
              <Link
                href={`/builds/${selectedNode.build.slug}`}
                className="shrink-0 text-xs font-medium text-gx-red hover:text-red-400 transition-colors flex items-center gap-1"
              >
                {t("lineage.tree.viewBuild")}
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

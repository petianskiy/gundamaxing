"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Check, Search, GitFork, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { LineageTree } from "./lineage-tree";
import { createLineage, updateLineage, saveLineageNodes } from "@/lib/actions/lineage";
import type { Build, LineageNodeUI } from "@/lib/types";

type BuildOption = Pick<Build, "id" | "slug" | "title" | "kitName" | "grade" | "scale" | "images" | "status">;

interface NodeDraft {
  buildId: string;
  parentId: string | null;
  annotation: string | null;
  order: number;
}

interface LineageCreatorProps {
  userBuilds: BuildOption[];
  // For editing an existing lineage
  existingLineage?: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    isPublic: boolean;
    nodes: LineageNodeUI[];
  };
}

export function LineageCreator({ userBuilds, existingLineage }: LineageCreatorProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const isEditing = !!existingLineage;

  // Step state
  const [step, setStep] = useState(0);

  // Step 1: Metadata
  const [title, setTitle] = useState(existingLineage?.title ?? "");
  const [description, setDescription] = useState(existingLineage?.description ?? "");
  const [isPublic, setIsPublic] = useState(existingLineage?.isPublic ?? false);

  // Step 2: Build selection
  const [selectedBuildIds, setSelectedBuildIds] = useState<Set<string>>(() => {
    if (existingLineage?.nodes) {
      return new Set(flattenNodeBuildIds(existingLineage.nodes));
    }
    return new Set();
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Step 3: Node arrangement
  const [nodeDrafts, setNodeDrafts] = useState<NodeDraft[]>(() => {
    if (existingLineage?.nodes) {
      return flattenNodes(existingLineage.nodes);
    }
    return [];
  });

  const [isSaving, setIsSaving] = useState(false);

  // Filter builds by search
  const filteredBuilds = useMemo(() => {
    if (!searchQuery) return userBuilds;
    const q = searchQuery.toLowerCase();
    return userBuilds.filter(
      (b) => b.title.toLowerCase().includes(q) || b.kitName.toLowerCase().includes(q)
    );
  }, [userBuilds, searchQuery]);

  const selectedBuilds = useMemo(
    () => userBuilds.filter((b) => selectedBuildIds.has(b.id)),
    [userBuilds, selectedBuildIds]
  );

  // Toggle build selection
  const toggleBuild = useCallback((buildId: string) => {
    setSelectedBuildIds((prev) => {
      const next = new Set(prev);
      if (next.has(buildId)) next.delete(buildId);
      else next.add(buildId);
      return next;
    });
  }, []);

  // Initialize node drafts when moving to step 3
  const goToStep3 = useCallback(() => {
    setNodeDrafts((prev) => {
      const existing = new Map(prev.map((n) => [n.buildId, n]));
      const drafts: NodeDraft[] = [];
      let order = 0;
      for (const buildId of selectedBuildIds) {
        if (existing.has(buildId)) {
          drafts.push({ ...existing.get(buildId)!, order });
        } else {
          drafts.push({ buildId, parentId: null, annotation: null, order });
        }
        order++;
      }
      return drafts;
    });
    setStep(2);
  }, [selectedBuildIds]);

  // Update a node draft
  const updateNodeDraft = useCallback((buildId: string, updates: Partial<NodeDraft>) => {
    setNodeDrafts((prev) =>
      prev.map((n) => (n.buildId === buildId ? { ...n, ...updates } : n))
    );
  }, []);

  // Build tree preview from node drafts
  const previewTree = useMemo((): LineageNodeUI[] => {
    const buildMap = new Map(userBuilds.map((b) => [b.id, b]));
    const nodeMap = new Map<string, LineageNodeUI>();

    // Create nodes
    for (const draft of nodeDrafts) {
      const build = buildMap.get(draft.buildId);
      if (!build) continue;
      nodeMap.set(draft.buildId, {
        id: draft.buildId,
        buildId: draft.buildId,
        build,
        parentId: draft.parentId,
        annotation: draft.annotation,
        order: draft.order,
        children: [],
      });
    }

    // Build tree
    const roots: LineageNodeUI[] = [];
    for (const draft of nodeDrafts) {
      const node = nodeMap.get(draft.buildId);
      if (!node) continue;
      if (draft.parentId && nodeMap.has(draft.parentId)) {
        nodeMap.get(draft.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }, [nodeDrafts, userBuilds]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSaving(true);

    try {
      let slug = existingLineage?.slug;

      if (isEditing && existingLineage) {
        // Update metadata
        const metaData = new FormData();
        metaData.set("id", existingLineage.id);
        metaData.set("title", title);
        metaData.set("description", description);
        metaData.set("isPublic", String(isPublic));
        const metaResult = await updateLineage(metaData);
        if ("error" in metaResult) {
          toast.error(metaResult.error);
          setIsSaving(false);
          return;
        }

        // Save nodes
        const nodeData = new FormData();
        nodeData.set("lineageId", existingLineage.id);
        nodeData.set("nodes", JSON.stringify(nodeDrafts));
        const nodeResult = await saveLineageNodes(nodeData);
        if ("error" in nodeResult) {
          toast.error(nodeResult.error);
          setIsSaving(false);
          return;
        }

        toast.success(t("lineage.action.saved"));
      } else {
        // Create lineage
        const createData = new FormData();
        createData.set("title", title);
        createData.set("description", description);
        createData.set("isPublic", String(isPublic));
        const createResult = await createLineage(createData);
        if ("error" in createResult) {
          toast.error(createResult.error);
          setIsSaving(false);
          return;
        }

        // Save nodes using the returned lineage ID
        if (nodeDrafts.length > 0 && createResult.id) {
          const nodeData = new FormData();
          nodeData.set("lineageId", createResult.id);
          nodeData.set("nodes", JSON.stringify(nodeDrafts));
          const nodeResult = await saveLineageNodes(nodeData);
          if ("error" in nodeResult) {
            toast.error(nodeResult.error);
            setIsSaving(false);
            return;
          }
        }

        slug = createResult.slug;
        toast.success(t("lineage.action.created"));
      }

      router.push(slug ? `/lineages/${slug}` : "/lineages/mine");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }, [title, description, isPublic, isEditing, existingLineage, nodeDrafts, router, t]);

  const steps = [
    t("lineage.creator.step1"),
    t("lineage.creator.step2"),
    t("lineage.creator.step3"),
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors",
                i < step
                  ? "bg-gx-red text-white"
                  : i === step
                    ? "bg-gx-red/15 text-gx-red border border-gx-red/30"
                    : "bg-zinc-800 text-zinc-500"
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-xs font-medium hidden sm:block",
                i === step ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className="w-8 h-px bg-border mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t("lineage.creator.titleLabel")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("lineage.creator.titlePlaceholder")}
              className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gx-red/50 focus:border-gx-red/50"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t("lineage.creator.descLabel")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("lineage.creator.descPlaceholder")}
              className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gx-red/50 focus:border-gx-red/50 resize-none"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{t("lineage.creator.publicLabel")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("lineage.creator.publicDesc")}</p>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                isPublic ? "bg-gx-red" : "bg-zinc-700"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                  isPublic ? "translate-x-5.5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(1)}
              disabled={!title.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gx-red text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("lineage.creator.next")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Builds */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("lineage.creator.selectBuilds")}
            </p>
            <span className="text-xs text-gx-red font-medium">
              {t("lineage.creator.selectedCount").replace("{{count}}", String(selectedBuildIds.size))}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("lineage.creator.searchBuilds")}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-900 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gx-red/50"
            />
          </div>

          {/* Build grid */}
          {filteredBuilds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <GitFork className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-sm">{t("lineage.creator.noBuilds")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {filteredBuilds.map((build) => {
                const isSelected = selectedBuildIds.has(build.id);
                const primaryImage = build.images.find((img) => img.isPrimary) || build.images[0];

                return (
                  <button
                    key={build.id}
                    onClick={() => toggleBuild(build.id)}
                    className={cn(
                      "relative rounded-lg border overflow-hidden text-left transition-all",
                      isSelected
                        ? "border-gx-red ring-2 ring-gx-red/20"
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-24 bg-zinc-900">
                      {primaryImage && (
                        <Image
                          src={primaryImage.url}
                          alt={build.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                      {/* Selection check */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gx-red flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-foreground truncate">{build.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{build.grade} &middot; {build.scale}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(0)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("lineage.creator.back")}
            </button>
            <button
              onClick={goToStep3}
              disabled={selectedBuildIds.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gx-red text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("lineage.creator.next")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Arrange Tree */}
      {step === 2 && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            {t("lineage.creator.arrangeDesc")}
          </p>

          {/* Node arrangement form */}
          <div className="space-y-3">
            {nodeDrafts.map((draft) => {
              const build = selectedBuilds.find((b) => b.id === draft.buildId);
              if (!build) return null;
              const primaryImage = build.images.find((img) => img.isPrimary) || build.images[0];

              return (
                <div
                  key={draft.buildId}
                  className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50 border border-border/30"
                >
                  {/* Build thumbnail */}
                  {primaryImage && (
                    <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                      <Image src={primaryImage.url} alt={build.title} fill className="object-cover" unoptimized />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-xs font-semibold text-foreground truncate">{build.title}</p>

                    {/* Parent select */}
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {t("lineage.creator.parentLabel")}
                      </label>
                      <select
                        value={draft.parentId ?? ""}
                        onChange={(e) =>
                          updateNodeDraft(draft.buildId, {
                            parentId: e.target.value || null,
                          })
                        }
                        className="w-full mt-0.5 px-2 py-1.5 rounded bg-zinc-800 border border-border/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gx-red/50"
                      >
                        <option value="">{t("lineage.creator.noParent")}</option>
                        {selectedBuilds
                          .filter((b) => b.id !== draft.buildId)
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.title}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Annotation */}
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {t("lineage.creator.annotationLabel")}
                      </label>
                      <input
                        type="text"
                        value={draft.annotation ?? ""}
                        onChange={(e) =>
                          updateNodeDraft(draft.buildId, {
                            annotation: e.target.value || null,
                          })
                        }
                        placeholder={t("lineage.creator.annotationPlaceholder")}
                        className="w-full mt-0.5 px-2 py-1.5 rounded bg-zinc-800 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-red/50"
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live preview */}
          {previewTree.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {t("lineage.creator.preview")}
              </p>
              <div className="rounded-lg border border-border/30 bg-zinc-950/50 p-4">
                <LineageTree nodes={previewTree} interactive={false} />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("lineage.creator.back")}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gx-red text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("lineage.creator.saving")}
                </>
              ) : (
                t("lineage.creator.save")
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function flattenNodeBuildIds(nodes: LineageNodeUI[]): string[] {
  const ids: string[] = [];
  function collect(node: LineageNodeUI) {
    ids.push(node.buildId);
    for (const child of node.children) collect(child);
  }
  for (const root of nodes) collect(root);
  return ids;
}

function flattenNodes(nodes: LineageNodeUI[]): NodeDraft[] {
  const drafts: NodeDraft[] = [];
  let order = 0;
  function collect(node: LineageNodeUI, parentId: string | null) {
    drafts.push({
      buildId: node.buildId,
      parentId,
      annotation: node.annotation,
      order: order++,
    });
    for (const child of node.children) {
      collect(child, node.buildId);
    }
  }
  for (const root of nodes) collect(root, null);
  return drafts;
}

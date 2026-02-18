"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/context";
import {
  createEra,
  deleteEra,
  assignBuildToEra,
  removeBuildFromEra,
} from "@/lib/actions/era";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  X,
  Package,
} from "lucide-react";

interface SimpleBuild {
  id: string;
  title: string;
  kitName: string;
}

interface EraAssignment {
  build: SimpleBuild;
  buildId: string;
  eraId: string;
  order: number;
}

interface EraWithBuilds {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  order: number;
  userId: string;
  builds: EraAssignment[];
}

interface EraManagerProps {
  initialEras: EraWithBuilds[];
  allBuilds: SimpleBuild[];
}

export function EraManager({ initialEras, allBuilds }: EraManagerProps) {
  const { t } = useTranslation();
  const [eras, setEras] = useState<EraWithBuilds[]>(initialEras);
  const [expandedEras, setExpandedEras] = useState<Set<string>>(new Set());

  // Create era state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEraName, setNewEraName] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Assign build state
  const [assigningEraId, setAssigningEraId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  function toggleExpand(eraId: string) {
    setExpandedEras((prev) => {
      const next = new Set(prev);
      if (next.has(eraId)) {
        next.delete(eraId);
      } else {
        next.add(eraId);
      }
      return next;
    });
  }

  // Get builds that are NOT assigned to a specific era
  function getUnassignedBuildsForEra(eraId: string): SimpleBuild[] {
    const era = eras.find((e) => e.id === eraId);
    if (!era) return allBuilds;
    const assignedIds = new Set(era.builds.map((b) => b.buildId));
    return allBuilds.filter((b) => !assignedIds.has(b.id));
  }

  async function handleCreateEra() {
    if (!newEraName.trim()) return;
    setCreating(true);

    const result = await createEra({ name: newEraName.trim() });
    setCreating(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.era) {
      toast.success(t("hangar.settings.eraSaved"));
      setEras((prev) => [...prev, { ...result.era, builds: [] } as EraWithBuilds]);
      setNewEraName("");
      setShowCreateForm(false);
      // Auto-expand new era
      setExpandedEras((prev) => new Set([...prev, result.era!.id]));
    }
  }

  async function handleDeleteEra(eraId: string) {
    setDeleting(true);

    const result = await deleteEra(eraId);
    setDeleting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("hangar.settings.eraDeleted"));
      setEras((prev) => prev.filter((e) => e.id !== eraId));
      setDeleteTarget(null);
    }
  }

  async function handleAssignBuild(buildId: string, eraId: string) {
    setAssigning(true);

    const result = await assignBuildToEra(buildId, eraId);
    setAssigning(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("hangar.settings.buildAssigned"));
      const build = allBuilds.find((b) => b.id === buildId);
      if (build) {
        setEras((prev) =>
          prev.map((era) => {
            if (era.id !== eraId) return era;
            return {
              ...era,
              builds: [
                ...era.builds,
                {
                  build,
                  buildId: build.id,
                  eraId,
                  order: era.builds.length,
                },
              ],
            };
          })
        );
      }
      setAssigningEraId(null);
    }
  }

  async function handleRemoveBuild(buildId: string, eraId: string) {
    const result = await removeBuildFromEra(buildId, eraId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("hangar.settings.buildRemoved"));
      setEras((prev) =>
        prev.map((era) => {
          if (era.id !== eraId) return era;
          return {
            ...era,
            builds: era.builds.filter((b) => b.buildId !== buildId),
          };
        })
      );
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">{t("hangar.settings.eras")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("hangar.settings.erasDesc")}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {t("hangar.settings.createEra")}
        </Button>
      </div>

      {/* Create era inline form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-4 p-4 rounded-xl border border-border/50 bg-gx-surface">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    label={t("hangar.settings.eraName")}
                    value={newEraName}
                    onChange={(e) => setNewEraName(e.target.value)}
                    placeholder={t("hangar.settings.eraNamePlaceholder")}
                    maxLength={100}
                  />
                </div>
                <div className="flex gap-2 pb-0.5">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    loading={creating}
                    onClick={handleCreateEra}
                    disabled={!newEraName.trim()}
                  >
                    {t("hangar.settings.createEra")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewEraName("");
                    }}
                  >
                    {t("settings.cancel")}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Era list */}
      {eras.length === 0 && !showCreateForm ? (
        <div className="py-12 text-center rounded-xl border border-dashed border-border/50 bg-gx-surface/50">
          <Package className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t("hangar.settings.noEras")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {eras.map((era) => {
            const isExpanded = expandedEras.has(era.id);
            const unassigned = getUnassignedBuildsForEra(era.id);

            return (
              <div
                key={era.id}
                className="rounded-xl border border-border/50 bg-gx-surface overflow-hidden"
              >
                {/* Era header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(era.id)}
                    className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleExpand(era.id)}
                      className="text-sm font-medium text-foreground hover:text-gx-red transition-colors text-left"
                    >
                      {era.name}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {era.builds.length === 1
                        ? t("hangar.era.build")
                        : t("hangar.era.builds", { count: era.builds.length })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(era.id)}
                      className="text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Expanded: builds list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        {/* Assigned builds */}
                        {era.builds.length === 0 ? (
                          <p className="text-xs text-muted-foreground/60 py-2 pl-6">
                            {t("hangar.era.empty")}
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {era.builds.map((assignment) => (
                              <div
                                key={assignment.buildId}
                                className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-background/50 group"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-foreground truncate">
                                    {assignment.build.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {assignment.build.kitName}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveBuild(assignment.buildId, era.id)
                                  }
                                  className="p-1 rounded text-muted-foreground/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Assign build selector */}
                        {assigningEraId === era.id ? (
                          <div className="space-y-1.5 pt-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1">
                              {t("hangar.settings.unassignedBuilds")}
                            </p>
                            {unassigned.length === 0 ? (
                              <p className="text-xs text-muted-foreground/60 py-1 pl-1">
                                {t("hangar.era.empty")}
                              </p>
                            ) : (
                              <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-border/30 p-1.5 bg-background/30">
                                {unassigned.map((build) => (
                                  <button
                                    key={build.id}
                                    type="button"
                                    disabled={assigning}
                                    onClick={() => handleAssignBuild(build.id, era.id)}
                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gx-red/10 transition-colors disabled:opacity-50"
                                  >
                                    <p className="text-sm text-foreground truncate">
                                      {build.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {build.kitName}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setAssigningEraId(null)}
                            >
                              {t("settings.cancel")}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setAssigningEraId(era.id)}
                            className="mt-1"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {t("hangar.settings.assignBuilds")}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={t("hangar.settings.deleteEra")}
      >
        <p className="text-sm text-muted-foreground mb-6">
          {t("hangar.settings.deleteEraConfirm")}
        </p>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(null)}
          >
            {t("settings.cancel")}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            loading={deleting}
            onClick={() => deleteTarget && handleDeleteEra(deleteTarget)}
          >
            {t("hangar.settings.deleteEra")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

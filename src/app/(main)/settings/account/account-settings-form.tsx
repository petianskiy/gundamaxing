"use client";

import { useState } from "react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/context";
import { deleteAccount } from "@/lib/actions/settings";
import { Calendar, ShieldCheck, Award, AlertTriangle } from "lucide-react";

export function AccountSettingsForm({
  memberSince,
  role,
  verificationTier,
  hasPassword,
}: {
  memberSince: string;
  role: string;
  verificationTier: string;
  hasPassword: boolean;
}) {
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteAccount({
      password: deletePassword,
      confirmation: deleteConfirmation,
    });

    if ("error" in result) {
      toast.error(result.error);
      setDeleting(false);
    } else {
      toast.success(t("settings.account.deleted"));
      signOut({ callbackUrl: "/" });
    }
  }

  const tierDisplay: Record<string, string> = {
    UNVERIFIED: "Unverified",
    VERIFIED: "Verified",
    FEATURED: "Featured",
    MASTER: "Master",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">{t("settings.account.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("settings.account.subtitle")}</p>
      </div>

      <div className="space-y-6">
        {/* Account Info */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("settings.account.memberSince")}</p>
              <p className="text-sm text-foreground">{memberSince}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("settings.account.role")}</p>
              <p className="text-sm text-foreground capitalize">{role.toLowerCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Award className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("settings.account.verificationTier")}</p>
              <p className="text-sm text-foreground">{tierDisplay[verificationTier] ?? verificationTier}</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">{t("settings.account.dangerZone")}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {t("settings.account.deleteWarning")}
          </p>
          <Button
            variant="danger"
            onClick={() => setShowDeleteDialog(true)}
            disabled={!hasPassword}
          >
            {t("settings.account.deleteAccount")}
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletePassword("");
          setDeleteConfirmation("");
        }}
        title={t("settings.account.deleteAccount")}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("settings.account.deleteWarning")}
          </p>
          <PasswordInput
            label={t("settings.account.password")}
            id="delete-password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
          <Input
            label={t("settings.account.deleteConfirmation")}
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="DELETE"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletePassword("");
                setDeleteConfirmation("");
              }}
            >
              {t("settings.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
              disabled={deleteConfirmation !== "DELETE" || !deletePassword}
            >
              {t("settings.account.deleteAccount")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

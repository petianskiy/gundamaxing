"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/context";
import { deleteAccount } from "@/lib/actions/settings";
import { Calendar, AlertTriangle } from "lucide-react";

type Props = {
  memberSince: string;
  hasPassword: boolean;
};

export function AccountSettingsForm({ memberSince, hasPassword }: Props) {
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const result = await deleteAccount({
        password: deletePassword,
        confirmation: deleteConfirmation,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("settings.account.deleted"));
        await signOut({ callbackUrl: "/" });
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("settings.account.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("settings.account.subtitle")}</p>
      </div>

      {/* Account info */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("settings.account.memberSince")}
            </p>
            <p className="text-sm text-foreground mt-0.5">{memberSince}</p>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <h3 className="text-sm font-semibold text-red-400">
            {t("settings.account.dangerZone")}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground">
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

      {/* Delete dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
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
            placeholder='Type "DELETE"'
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
            >
              {t("settings.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
              disabled={deleteConfirmation !== "DELETE" || !deletePassword}
            >
              {deleting ? "Deleting..." : t("settings.account.deleteAccount")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

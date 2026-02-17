"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { changePassword } from "@/lib/actions/settings";
import { Lock, Mail, Check } from "lucide-react";

type Props = {
  email: string;
  hasPassword: boolean;
};

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Lowercase", met: /[a-z]/.test(password) },
    { label: "Uppercase", met: /[A-Z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
  ];
  const metCount = checks.filter((c) => c.met).length;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < metCount
                ? metCount <= 1
                  ? "bg-red-500"
                  : metCount <= 2
                  ? "bg-orange-500"
                  : metCount <= 3
                  ? "bg-yellow-500"
                  : "bg-green-500"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map((check) => (
          <span
            key={check.label}
            className={`text-xs flex items-center gap-1 ${
              check.met ? "text-green-400" : "text-muted-foreground/50"
            }`}
          >
            <Check className="h-3 w-3" />
            {check.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SecuritySettingsForm({ email, hasPassword }: Props) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleChangePassword() {
    setSaving(true);
    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("settings.security.passwordChanged"));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("settings.security.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("settings.security.subtitle")}</p>
      </div>

      {/* Email (read-only) */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("settings.security.email")}
          </label>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/30 bg-muted/20 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            {email}
          </div>
          <p className="text-xs text-muted-foreground/60">{t("settings.security.emailReadOnly")}</p>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            {t("settings.security.changePassword")}
          </h3>
        </div>

        {hasPassword ? (
          <>
            <PasswordInput
              label={t("settings.security.currentPassword")}
              id="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />

            <PasswordInput
              label={t("settings.security.newPassword")}
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />

            {newPassword && <PasswordStrength password={newPassword} />}

            <PasswordInput
              label={t("settings.security.confirmPassword")}
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              error={
                confirmPassword && newPassword !== confirmPassword
                  ? "Passwords don't match"
                  : undefined
              }
            />

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleChangePassword}
                loading={saving}
                variant="primary"
                disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
              >
                {saving ? t("settings.saving") : t("settings.security.changePassword")}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("settings.security.noPassword")}
          </p>
        )}
      </div>
    </div>
  );
}

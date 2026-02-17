"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { changePassword } from "@/lib/actions/settings";
import { Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
  if (score <= 4) return { score, label: "Strong", color: "bg-green-500" };
  return { score, label: "Very Strong", color: "bg-emerald-400" };
}

export function SecuritySettingsForm({
  email,
  hasPassword,
}: {
  email: string;
  hasPassword: boolean;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const strength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordsMatch) {
      toast.error("Passwords don't match");
      return;
    }

    setSaving(true);
    const result = await changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    setSaving(false);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(t("settings.security.passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">{t("settings.security.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("settings.security.subtitle")}</p>
      </div>

      <div className="space-y-6">
        {/* Email (read-only) */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">{t("settings.security.email")}</h3>
          </div>
          <Input value={email} disabled hint={t("settings.security.emailReadonly")} />
        </div>

        {/* Change Password */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">{t("settings.security.changePassword")}</h3>
          </div>

          {!hasPassword ? (
            <p className="text-sm text-muted-foreground">{t("settings.security.noPassword")}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordInput
                label={t("settings.security.currentPassword")}
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />

              <div className="space-y-2">
                <PasswordInput
                  label={t("settings.security.newPassword")}
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                {newPassword && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-colors",
                            i < strength.score ? strength.color : "bg-zinc-700"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{strength.label}</p>
                  </div>
                )}
              </div>

              <PasswordInput
                label={t("settings.security.confirmPassword")}
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                error={confirmPassword && !passwordsMatch ? "Passwords don't match" : undefined}
              />

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  disabled={!currentPassword || !newPassword || !confirmPassword || !passwordsMatch}
                >
                  {saving ? t("settings.saving") : t("settings.security.changePassword")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

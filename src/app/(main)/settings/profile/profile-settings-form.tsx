"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { updateProfile } from "@/lib/actions/profile";
import { changeUsername } from "@/lib/actions/settings";
import { useUploadThing } from "@/lib/upload/uploadthing";
import { Camera, Upload, X, Loader2, AlertTriangle } from "lucide-react";

interface ProfileFormData {
  displayName: string;
  username: string;
  bio: string;
  avatar: string;
  banner: string;
  accentColor: string;
  socialLinks: {
    twitter: string;
    instagram: string;
    youtube: string;
    github: string;
    discord: string;
    tiktok: string;
  };
}

const USERNAME_COOLDOWN_DAYS = 90;

export function ProfileSettingsForm({
  initialData,
  lastUsernameChange,
}: {
  initialData: ProfileFormData;
  lastUsernameChange: string | null;
}) {
  const { t } = useTranslation();
  const { update: updateSession } = useSession();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialData);

  // Username change state
  const [newUsername, setNewUsername] = useState(initialData.username);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  const canChangeUsername = (() => {
    if (!lastUsernameChange) return true;
    const daysSince = Math.floor(
      (Date.now() - new Date(lastUsernameChange).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSince >= USERNAME_COOLDOWN_DAYS;
  })();

  const nextChangeDate = lastUsernameChange
    ? new Date(new Date(lastUsernameChange).getTime() + USERNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
    : null;

  // Upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { startUpload: startAvatarUpload } = useUploadThing("avatarUpload", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        updateField("avatar", res[0].ufsUrl);
        toast.success(t("settings.profile.avatarUploaded"));
      }
      setUploadingAvatar(false);
    },
    onUploadError: (error) => {
      toast.error(error.message || "Avatar upload failed");
      setUploadingAvatar(false);
    },
  });

  const { startUpload: startBannerUpload } = useUploadThing("bannerUpload", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        updateField("banner", res[0].ufsUrl);
        toast.success(t("settings.profile.bannerUploaded"));
      }
      setUploadingBanner(false);
    },
    onUploadError: (error) => {
      toast.error(error.message || "Banner upload failed");
      setUploadingBanner(false);
    },
  });

  function updateField<K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateSocial(key: string, value: string) {
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }));
  }

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    await startAvatarUpload([file]);
    // Reset the input so the same file can be re-selected
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  async function handleBannerSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    await startBannerUpload([file]);
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.set("displayName", form.displayName);
    formData.set("bio", form.bio);
    formData.set("avatar", form.avatar);
    formData.set("banner", form.banner);
    formData.set("accentColor", form.accentColor);
    formData.set("socialLinks", JSON.stringify(form.socialLinks));

    const result = await updateProfile(formData);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("settings.profile.saved"));
      // Refresh the session so avatar/name update in the navbar
      await updateSession();
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">{t("settings.profile.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("settings.profile.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar & Banner uploads */}
        <div className="space-y-4">
          {/* Banner */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("settings.profile.banner")}
            </label>
            <div className="relative rounded-xl overflow-hidden border border-border/50 bg-gx-surface h-32 group">
              {form.banner ? (
                <Image src={form.banner} alt="Banner" fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Upload className="h-6 w-6" />
                </div>
              )}
              {uploadingBanner && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur text-white text-xs font-medium hover:bg-white/30 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5 inline mr-1.5" />
                  {form.banner ? t("settings.profile.changeBanner") : t("settings.profile.uploadBanner")}
                </button>
                {form.banner && (
                  <button
                    type="button"
                    onClick={() => updateField("banner", "")}
                    className="ml-2 p-1.5 rounded-lg bg-red-500/60 backdrop-blur text-white hover:bg-red-500/80 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerSelect}
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("settings.profile.bannerHint")}</p>
          </div>

          {/* Avatar */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("settings.profile.avatar")}
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border/50 bg-gx-surface group shrink-0">
                {form.avatar ? (
                  <Image src={form.avatar} alt="Avatar" fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <Camera className="h-5 w-5 text-white" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      {t("settings.profile.uploading")}
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      {t("settings.profile.uploadAvatar")}
                    </>
                  )}
                </Button>
                {form.avatar && (
                  <button
                    type="button"
                    onClick={() => updateField("avatar", "")}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors text-left"
                  >
                    {t("settings.profile.removeAvatar")}
                  </button>
                )}
                <p className="text-xs text-muted-foreground">{t("settings.profile.avatarHint")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Input
            label={t("settings.profile.username")}
            value={newUsername}
            onChange={(e) => {
              setNewUsername(e.target.value);
              setUsernameError("");
            }}
            disabled={!canChangeUsername || usernameLoading}
            maxLength={24}
            hint={
              canChangeUsername
                ? "You can change your username once every 3 months. Choose carefully."
                : `You can change your username again on ${nextChangeDate?.toLocaleDateString()}.`
            }
          />
          {usernameError && (
            <p className="text-xs text-red-400">{usernameError}</p>
          )}
          {canChangeUsername && newUsername !== form.username && (
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs shrink-0 mt-0.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>This will change your profile URL.</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={usernameLoading}
                onClick={async () => {
                  setUsernameLoading(true);
                  setUsernameError("");
                  const result = await changeUsername({ username: newUsername });
                  setUsernameLoading(false);
                  if (result.error) {
                    setUsernameError(result.error);
                  } else {
                    setForm((prev) => ({ ...prev, username: newUsername }));
                    toast.success("Username changed successfully.");
                    await updateSession();
                  }
                }}
              >
                {usernameLoading ? "Saving..." : "Change Username"}
              </Button>
            </div>
          )}
        </div>

        {/* Editable fields */}
        <Input
          label={t("settings.profile.displayName")}
          value={form.displayName}
          onChange={(e) => updateField("displayName", e.target.value)}
          hint={t("settings.profile.displayNameHint")}
          maxLength={50}
        />

        <Textarea
          label={t("settings.profile.bio")}
          value={form.bio}
          onChange={(e) => updateField("bio", e.target.value)}
          rows={4}
          maxLength={500}
        />

        {/* Accent color */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("settings.profile.accentColor")}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.accentColor}
              onChange={(e) => updateField("accentColor", e.target.value)}
              className="h-10 w-14 rounded-lg border border-border/50 bg-gx-surface cursor-pointer"
            />
            <Input
              value={form.accentColor}
              onChange={(e) => updateField("accentColor", e.target.value)}
              className="max-w-[140px]"
              maxLength={7}
            />
            <div
              className="h-10 flex-1 rounded-lg border border-border/50"
              style={{ backgroundColor: form.accentColor }}
            />
          </div>
        </div>

        {/* Social links */}
        <div className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("settings.profile.socialLinks")}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["twitter", "instagram", "youtube", "github", "discord", "tiktok"] as const).map(
              (platform) => (
                <Input
                  key={platform}
                  label={t(`settings.profile.${platform}`)}
                  value={form.socialLinks[platform]}
                  onChange={(e) => updateSocial(platform, e.target.value)}
                  placeholder={platform === "discord" ? "username#0000" : "https://..."}
                />
              )
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" loading={saving}>
            {saving ? t("settings.saving") : t("settings.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}

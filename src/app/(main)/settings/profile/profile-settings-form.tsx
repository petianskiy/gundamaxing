"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { updateProfile } from "@/lib/actions/profile";
import { Lock } from "lucide-react";

type Props = {
  user: {
    username: string;
    handle: string;
    displayName: string;
    bio: string;
    avatar: string;
    banner: string;
    accentColor: string;
    socialLinks: Record<string, string>;
  };
};

const socialPlatforms = ["twitter", "instagram", "youtube", "discord", "tiktok"];

export function ProfileSettingsForm({ user }: Props) {
  const { t } = useTranslation();
  const { update } = useSession();
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar);
  const [banner, setBanner] = useState(user.banner);
  const [accentColor, setAccentColor] = useState(user.accentColor);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(user.socialLinks);

  async function handleSave() {
    setSaving(true);
    try {
      const formData = new FormData();
      if (displayName) formData.set("displayName", displayName);
      if (bio) formData.set("bio", bio);
      if (avatar) formData.set("avatar", avatar);
      if (banner) formData.set("banner", banner);
      if (accentColor) formData.set("accentColor", accentColor);

      const filteredLinks = Object.fromEntries(
        Object.entries(socialLinks).filter(([, v]) => v.trim())
      );
      if (Object.keys(filteredLinks).length > 0) {
        formData.set("socialLinks", JSON.stringify(filteredLinks));
      }

      const result = await updateProfile(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("settings.profile.saved"));
        await update();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("settings.profile.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("settings.profile.subtitle")}</p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-6">
        {/* Read-only fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("settings.profile.username")}
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/30 bg-muted/20 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              {user.username}
            </div>
            <p className="text-xs text-muted-foreground/60">{t("settings.profile.usernameReadonly")}</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("settings.profile.handle")}
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/30 bg-muted/20 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              @{user.handle}
            </div>
            <p className="text-xs text-muted-foreground/60">{t("settings.profile.handleReadonly")}</p>
          </div>
        </div>

        {/* Editable fields */}
        <Input
          label={t("settings.profile.displayName")}
          hint={t("settings.profile.displayNameHint")}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
        />

        <Textarea
          label={t("settings.profile.bio")}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Tell the community about yourself..."
        />
        <p className="text-xs text-muted-foreground/60 -mt-4">{bio.length}/500</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t("settings.profile.avatar")}
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://..."
          />
          <Input
            label={t("settings.profile.banner")}
            value={banner}
            onChange={(e) => setBanner(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("settings.profile.accentColor")}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border border-border/50 bg-transparent"
            />
            <Input
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-32"
              maxLength={7}
            />
          </div>
        </div>

        {/* Social links */}
        <div className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("settings.profile.socialLinks")}
          </label>
          {socialPlatforms.map((platform) => (
            <Input
              key={platform}
              label={platform.charAt(0).toUpperCase() + platform.slice(1)}
              value={socialLinks[platform] ?? ""}
              onChange={(e) =>
                setSocialLinks((prev) => ({ ...prev, [platform]: e.target.value }))
              }
              placeholder={platform === "discord" ? "username#0000" : `https://${platform}.com/...`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} variant="primary">
          {saving ? t("settings.saving") : t("settings.save")}
        </Button>
      </div>
    </div>
  );
}

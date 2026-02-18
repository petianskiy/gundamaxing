"use client";

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Rocket,
  Upload,
  ImageIcon,
  Twitter,
  Instagram,
  Youtube,
  Github,
  MessageCircle,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signUpAction } from "@/lib/actions/auth";
import {
  saveBuilderIdentity,
  saveWorkshopSetup,
  saveProfilePersonalization,
  completeOnboarding,
} from "@/lib/actions/registration";
import { stepDSchema, type StepDInput } from "@/lib/validations/registration-wizard";
import type { StepAInput, StepBInput, StepCInput } from "@/lib/validations/registration-wizard";

interface StepProfileProps {
  data: Partial<StepDInput>;
  allData: {
    stepA: StepAInput;
    stepB: StepBInput;
    stepC: StepCInput;
  };
  onBack: () => void;
}

const ACCENT_PRESETS = [
  { hex: "#dc2626", label: "Red" },
  { hex: "#3b82f6", label: "Blue" },
  { hex: "#22c55e", label: "Green" },
  { hex: "#8b5cf6", label: "Purple" },
  { hex: "#f97316", label: "Orange" },
  { hex: "#ec4899", label: "Pink" },
  { hex: "#06b6d4", label: "Cyan" },
  { hex: "#d4a017", label: "Gold" },
] as const;

const SOCIAL_FIELDS = [
  { key: "twitter" as const, label: "Twitter / X", icon: Twitter, placeholder: "https://x.com/yourhandle" },
  { key: "instagram" as const, label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/yourhandle" },
  { key: "youtube" as const, label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@yourchannel" },
  { key: "github" as const, label: "GitHub", icon: Github, placeholder: "https://github.com/yourusername" },
  { key: "discord" as const, label: "Discord", icon: MessageCircle, placeholder: "username#0000" },
] as const;

function UploadZone({
  label,
  maxSize,
  aspect,
  preview,
  onFileSelect,
}: {
  label: string;
  maxSize: string;
  aspect: string;
  preview: string | null;
  onFileSelect: (file: File | null) => void;
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
          aspect === "square" ? "aspect-square max-w-[120px]" : "aspect-[3/1]",
          dragActive
            ? "border-gx-red bg-gx-red/5"
            : "border-border/50 bg-gx-surface hover:border-border"
        )}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0] ?? null;
            onFileSelect(file);
          };
          input.click();
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover rounded-lg"
          />
        ) : (
          <>
            {aspect === "square" ? (
              <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground/40" />
            )}
            <span className="text-[10px] font-mono text-muted-foreground/40 text-center">
              Drop or click
              <br />
              Max {maxSize}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function StepProfile({ data, allData, onBack }: StepProfileProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [customHex, setCustomHex] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StepDInput>({
    resolver: zodResolver(stepDSchema),
    defaultValues: {
      bio: data.bio ?? "",
      avatar: data.avatar ?? "",
      banner: data.banner ?? "",
      accentColor: data.accentColor ?? "#dc2626",
      socialLinks: data.socialLinks ?? {
        twitter: "",
        instagram: "",
        youtube: "",
        github: "",
        discord: "",
      },
    },
    mode: "onChange",
  });

  const watchedBio = watch("bio");
  const watchedAccent = watch("accentColor");
  const bioLength = watchedBio?.length ?? 0;

  function handleAvatarSelect(file: File | null) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Avatar must be under 4MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    // Placeholder -- real upload integration comes later
    setValue("avatar", "");
  }

  function handleBannerSelect(file: File | null) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Banner must be under 8MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setBannerPreview(url);
    // Placeholder -- real upload integration comes later
    setValue("banner", "");
  }

  function handleCustomHex(hex: string) {
    setCustomHex(hex);
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      setValue("accentColor", hex, { shouldValidate: true });
    }
  }

  async function onSubmit(stepDData: StepDInput) {
    setIsSubmitting(true);

    try {
      // 1. Create account via signUpAction
      const formData = new FormData();
      formData.set("email", allData.stepA.email);
      formData.set("username", allData.stepA.username);
      formData.set("password", allData.stepA.password);

      const signUpResult = await signUpAction(formData);
      if ("error" in signUpResult) {
        toast.error(signUpResult.error);
        setIsSubmitting(false);
        return;
      }

      // 2. Auto sign-in to get a session
      const signInResult = await signIn("credentials", {
        email: allData.stepA.email.toLowerCase(),
        password: allData.stepA.password,
        redirect: false,
      });

      if (!signInResult || signInResult.error) {
        toast.error("Account created but sign-in failed. Please log in manually.");
        router.push("/login");
        return;
      }

      // Use the userId from signUpAction directly (session may not be refreshed yet)
      const userId = signUpResult.userId;

      // 3. Save builder identity (Step B data)
      const identityResult = await saveBuilderIdentity(userId, {
        country: allData.stepB.country,
        skillLevel: allData.stepB.skillLevel,
        preferredGrades: allData.stepB.preferredGrades,
        favoriteTimelines: allData.stepB.favoriteTimelines,
      });
      if ("error" in identityResult) {
        console.warn("[StepProfile] Identity save failed:", identityResult.error);
      }

      // 4. Save workshop setup (Step C data)
      const workshopResult = await saveWorkshopSetup(userId, {
        tools: allData.stepC.tools,
        techniques: allData.stepC.techniques,
      });
      if ("error" in workshopResult) {
        console.warn("[StepProfile] Workshop save failed:", workshopResult.error);
      }

      // 5. Save profile personalization (Step D data)
      const profileResult = await saveProfilePersonalization(userId, {
        bio: stepDData.bio,
        avatar: stepDData.avatar,
        banner: stepDData.banner,
        accentColor: stepDData.accentColor,
        socialLinks: stepDData.socialLinks,
      });
      if ("error" in profileResult) {
        console.warn("[StepProfile] Profile save failed:", profileResult.error);
      }

      // 6. Complete onboarding
      await completeOnboarding(userId);

      // Show success
      setDeploySuccess(true);
      toast.success("Mobile suit deployed! Welcome, pilot.");

      // Redirect after animation
      setTimeout(() => {
        router.push("/builds");
      }, 2000);
    } catch (err) {
      console.error("[StepProfile] Submit error:", err);
      toast.error("Deployment failed. Please try again.");
      setIsSubmitting(false);
    }
  }

  // Success animation overlay
  if (deploySuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-gx-red/20 border-2 border-gx-red flex items-center justify-center"
        >
          <Check className="h-10 w-10 text-gx-red" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center space-y-2"
        >
          <h2 className="text-2xl font-bold tracking-wider text-foreground">
            DEPLOYMENT COMPLETE
          </h2>
          <p className="text-xs font-mono tracking-wider text-muted-foreground">
            REDIRECTING TO HANGAR...
          </p>
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.8, delay: 0.6 }}
          className="h-1 bg-gx-red rounded-full max-w-[200px]"
        />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step header */}
      <div className="space-y-1">
        <p className="text-[10px] font-mono tracking-[0.3em] text-gx-red uppercase">
          Step 04 of 04
        </p>
        <h2 className="text-xl font-bold tracking-wider text-foreground">
          MOBILE SUIT CUSTOMIZATION
        </h2>
        <p className="text-xs font-mono tracking-wider text-muted-foreground/60">
          FINAL CONFIGURATION
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar & Banner uploads */}
        <div className="flex gap-4 items-start">
          <UploadZone
            label="Avatar"
            maxSize="4MB"
            aspect="square"
            preview={avatarPreview}
            onFileSelect={handleAvatarSelect}
          />
          <div className="flex-1">
            <UploadZone
              label="Banner"
              maxSize="8MB"
              aspect="wide"
              preview={bannerPreview}
              onFileSelect={handleBannerSelect}
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <Textarea
            label="Bio"
            placeholder="Tell the world about your building journey..."
            rows={4}
            maxLength={500}
            error={errors.bio?.message}
            {...register("bio")}
          />
          <p className={cn(
            "text-[10px] font-mono text-right",
            bioLength > 450 ? "text-orange-500" : "text-muted-foreground/40"
          )}>
            {bioLength}/500
          </p>
        </div>

        {/* Accent Color */}
        <Controller
          control={control}
          name="accentColor"
          render={({ field }) => (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Accent Color
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    title={preset.label}
                    onClick={() => {
                      field.onChange(preset.hex);
                      setCustomHex("");
                    }}
                    className={cn(
                      "w-8 h-8 rounded-lg border-2 transition-all",
                      field.value === preset.hex
                        ? "border-white scale-110"
                        : "border-transparent hover:border-border"
                    )}
                    style={{ backgroundColor: preset.hex }}
                  />
                ))}
                {/* Custom hex input */}
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-dashed border-border/50"
                    style={{
                      backgroundColor: /^#[0-9a-fA-F]{6}$/.test(customHex) ? customHex : "transparent",
                    }}
                  />
                  <input
                    type="text"
                    value={customHex}
                    onChange={(e) => handleCustomHex(e.target.value)}
                    placeholder="#hex"
                    maxLength={7}
                    className="w-20 px-2 py-1.5 rounded-md border bg-gx-surface text-foreground text-xs font-mono border-border/50 focus:outline-none focus:ring-1 focus:border-gx-red/50 focus:ring-gx-red/20"
                  />
                </div>
              </div>
              {errors.accentColor && (
                <p className="text-xs text-red-400">{errors.accentColor.message}</p>
              )}
            </div>
          )}
        />

        {/* Social Links */}
        <div className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Social Links
          </label>
          {SOCIAL_FIELDS.map((social) => {
            const Icon = social.icon;
            return (
              <div key={social.key} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  placeholder={social.placeholder}
                  autoComplete="off"
                  error={errors.socialLinks?.[social.key]?.message}
                  {...register(`socialLinks.${social.key}`)}
                />
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onBack}
            disabled={isSubmitting}
            className="font-mono tracking-wider"
          >
            <ChevronLeft className="h-4 w-4" />
            BACK
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            className="flex-1 font-mono tracking-wider"
          >
            <Rocket className="h-4 w-4" />
            DEPLOY
          </Button>
        </div>
      </form>
    </div>
  );
}

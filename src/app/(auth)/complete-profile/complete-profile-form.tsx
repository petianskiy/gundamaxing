"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, AtSign, User, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { completeOAuthProfile } from "@/lib/actions/registration";
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

export function CompleteProfileForm({
  currentUsername,
  currentDisplayName,
}: {
  currentUsername: string;
  currentDisplayName: string | null;
}) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState(currentDisplayName ?? "");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const strength = getPasswordStrength(password);

  async function checkUsername(value: string) {
    if (value.length < 3) {
      setUsernameError("Handle must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError("Only letters, numbers, and underscores");
      return;
    }

    setChecking(true);
    try {
      const res = await fetch(`/api/username-check?username=${encodeURIComponent(value.toLowerCase())}`);
      const data = await res.json();
      if (data.available === false) {
        setUsernameError(data.reason === "inappropriate" ? "That handle contains inappropriate language" : "Handle is already taken");
      } else {
        setUsernameError(null);
      }
    } catch {
      setUsernameError(null);
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || username.length < 3 || usernameError) return;

    setIsSubmitting(true);
    const result = await completeOAuthProfile({
      username: username.toLowerCase(),
      displayName: displayName || undefined,
      password: password || undefined,
    });
    setIsSubmitting(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success("Profile complete!");
    await updateSession();
    router.push("/builds");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-sm p-6 sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-wider text-white">
            COMPLETE YOUR PROFILE
          </h1>
          <p className="mt-2 font-mono text-sm tracking-wider text-gray-500">
            CHOOSE YOUR CALLSIGN
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Login Handle */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
              <AtSign className="h-3.5 w-3.5" />
              Login Handle
              <span className="text-red-400">*</span>
            </label>
            <Input
              value={username}
              onChange={(e) => {
                const v = e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
                setUsername(v);
                if (v.length >= 3) checkUsername(v);
                else setUsernameError(null);
              }}
              placeholder="your_handle"
              autoComplete="username"
              autoFocus
            />
            {checking && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Checking...
              </p>
            )}
            {usernameError && (
              <p className="text-xs text-red-400">{usernameError}</p>
            )}
            {username.length >= 3 && !usernameError && !checking && (
              <p className="text-xs text-green-400">Handle is available</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              This is your unique @handle used for login and profile URL. 3-20 characters, letters/numbers/underscores only.
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
              <User className="h-3.5 w-3.5" />
              Display Name
              <span className="text-gray-600 text-[10px] normal-case">(optional)</span>
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
              placeholder="Your public name"
              autoComplete="name"
            />
            <p className="text-[11px] text-muted-foreground">
              Shown publicly on your profile and comments. Can be changed anytime.
            </p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
              <Lock className="h-3.5 w-3.5" />
              Set Password
              <span className="text-gray-600 text-[10px] normal-case">(optional)</span>
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enable login with handle + password"
              autoComplete="new-password"
            />
            {password && (
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
            <p className="text-[11px] text-muted-foreground">
              Set a password to also log in with your handle + password. You can always set one later in Settings.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isSubmitting || !username || username.length < 3 || !!usernameError || checking}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                SAVING...
              </>
            ) : (
              "LAUNCH PROFILE"
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-600">
          Your current auto-generated handle is <span className="font-mono text-gray-400">@{currentUsername}</span>
        </p>
      </div>
    </motion.div>
  );
}

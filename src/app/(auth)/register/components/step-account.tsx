"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { UsernameChecker } from "@/components/auth/username-checker";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { CaptchaWidget } from "@/components/auth/captcha-widget";
import { usePasswordStrength } from "@/hooks/use-password-strength";
import { generateHoneypotFieldName } from "@/lib/security/honeypot";
import { stepASchema, type StepAInput } from "@/lib/validations/registration-wizard";

interface StepAccountProps {
  data: Partial<StepAInput & { confirmPassword: string }>;
  onNext: (data: StepAInput) => void;
}

export function StepAccount({ data, onNext }: StepAccountProps) {
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [honeypotField] = useState(() => generateHoneypotFieldName());
  const [timingToken] = useState(() => {
    // Client-side timing token using btoa
    return typeof window !== "undefined" ? btoa(Date.now().toString()) : "";
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<StepAInput & { confirmPassword: string }>({
    resolver: zodResolver(
      stepASchema.extend({
        confirmPassword: stepASchema.shape.password,
      }).refine((d) => d.password === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
    ),
    defaultValues: {
      email: data.email ?? "",
      username: data.username ?? "",
      password: data.password ?? "",
      confirmPassword: data.confirmPassword ?? "",
    },
    mode: "onChange",
  });

  const watchedPassword = watch("password");
  const watchedUsername = watch("username");
  const strength = usePasswordStrength(watchedPassword ?? "");

  const canProceed = isValid && captchaVerified;

  function onSubmit(values: StepAInput & { confirmPassword: string }) {
    const { confirmPassword: _, ...stepData } = values;
    onNext(stepData);
  }

  return (
    <div className="space-y-6">
      {/* Step header */}
      <div className="space-y-1">
        <p className="text-[10px] font-mono tracking-[0.3em] text-gx-red uppercase">
          Step 01 of 04
        </p>
        <h2 className="text-xl font-bold tracking-wider text-foreground">
          SYSTEMS INITIALIZATION
        </h2>
        <p className="text-xs font-mono tracking-wider text-muted-foreground/60">
          ACCOUNT BOOTSTRAP
        </p>
      </div>

      {/* OAuth section */}
      <div>
        <OAuthButtons />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/50" />
        <span className="text-xs tracking-wider text-muted-foreground/40 font-mono">
          -- OR --
        </span>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Honeypot field -- hidden from humans */}
        <div className="absolute opacity-0 pointer-events-none h-0 overflow-hidden" aria-hidden="true">
          <input
            type="text"
            name={honeypotField}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Timing token */}
        <input type="hidden" name="_timing" value={timingToken} />

        {/* Email */}
        <Input
          label="Email"
          type="email"
          placeholder="pilot@gundamaxing.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />

        {/* Username */}
        <div>
          <Input
            label="Username"
            placeholder="gundam_pilot_01"
            autoComplete="username"
            error={errors.username?.message}
            {...register("username")}
          />
          <UsernameChecker username={watchedUsername ?? ""} />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <PasswordInput
            label="Password"
            id="password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          {watchedPassword && watchedPassword.length > 0 && (
            <PasswordStrengthMeter score={strength.score} label={strength.label} />
          )}
        </div>

        {/* Confirm password */}
        <PasswordInput
          label="Confirm Password"
          id="confirm-password"
          placeholder="Re-enter password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {/* Captcha */}
        <CaptchaWidget onVerify={setCaptchaVerified} />

        {/* Next button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!canProceed}
          className="w-full font-mono tracking-wider"
        >
          NEXT
          <ChevronRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

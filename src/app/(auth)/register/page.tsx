"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import { WizardShell } from "./components/wizard-shell";
import { StepAccount } from "./components/step-account";
import { StepIdentity } from "./components/step-identity";
import { StepWorkshop } from "./components/step-workshop";
import { StepProfile } from "./components/step-profile";
import type { StepAInput, StepBInput, StepCInput, StepDInput } from "@/lib/validations/registration-wizard";

const STEPS = [
  { label: "SYSTEMS ONLINE" },
  { label: "PILOT ID" },
  { label: "HANGAR SETUP" },
  { label: "DEPLOY" },
];

interface WizardData {
  stepA: Partial<StepAInput & { confirmPassword: string }>;
  stepB: Partial<StepBInput>;
  stepC: Partial<StepCInput>;
  stepD: Partial<StepDInput>;
}

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [wizardData, setWizardData] = useState<WizardData>({
    stepA: {},
    stepB: {},
    stepC: {},
    stepD: {},
  });

  const goForward = useCallback(() => {
    setDirection("forward");
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  }, []);

  const goBack = useCallback(() => {
    setDirection("back");
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only allow arrow key navigation if not focused on an input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowLeft" && currentStep > 0) {
        goBack();
      }
      // ArrowRight is intentionally disabled to prevent skipping validation
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, goBack]);

  // Step A completion handler
  function handleStepA(data: StepAInput) {
    setWizardData((prev) => ({ ...prev, stepA: data }));
    goForward();
  }

  // Step B completion handler
  function handleStepB(data: StepBInput) {
    setWizardData((prev) => ({ ...prev, stepB: data }));
    goForward();
  }

  // Step C completion handler
  function handleStepC(data: StepCInput) {
    setWizardData((prev) => ({ ...prev, stepC: data }));
    goForward();
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <ProgressBar steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Wizard card */}
      <div className="rounded-xl border border-border/50 bg-card p-6 sm:p-8 mecha-frame">
        <WizardShell step={currentStep} direction={direction}>
          {currentStep === 0 && (
            <StepAccount data={wizardData.stepA} onNext={handleStepA} />
          )}
          {currentStep === 1 && (
            <StepIdentity
              data={wizardData.stepB}
              onNext={handleStepB}
              onBack={goBack}
            />
          )}
          {currentStep === 2 && (
            <StepWorkshop
              data={wizardData.stepC}
              onNext={handleStepC}
              onBack={goBack}
            />
          )}
          {currentStep === 3 && (
            <StepProfile
              data={wizardData.stepD}
              allData={{
                stepA: wizardData.stepA as StepAInput,
                stepB: wizardData.stepB as StepBInput,
                stepC: wizardData.stepC as StepCInput,
              }}
              onBack={goBack}
            />
          )}
        </WizardShell>
      </div>

      {/* Sign in link */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-gx-red transition-colors hover:text-red-400"
        >
          Sign in
        </Link>
      </p>

      {/* Decorative bottom line */}
      <div className="mt-4 flex justify-center">
        <div className="h-1 w-16 rounded-full bg-gx-red/30" />
      </div>
    </div>
  );
}

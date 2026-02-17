import { useMemo } from "react";

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export function usePasswordStrength(password: string): PasswordStrength {
  return useMemo(() => {
    if (!password || password.length === 0) {
      return { score: 0, label: "Too short", color: "text-gray-500" };
    }

    let checks = 0;
    if (password.length >= 8) checks++;
    if (/[A-Z]/.test(password)) checks++;
    if (/[a-z]/.test(password)) checks++;
    if (/[0-9]/.test(password)) checks++;
    if (/[^A-Za-z0-9]/.test(password)) checks++;

    const score = Math.max(0, checks - 1);

    const levels: Record<number, { label: string; color: string }> = {
      0: { label: "Too short", color: "text-gray-500" },
      1: { label: "Weak", color: "text-red-500" },
      2: { label: "Fair", color: "text-orange-500" },
      3: { label: "Good", color: "text-yellow-500" },
      4: { label: "Strong", color: "text-green-500" },
    };

    const level = levels[score] ?? levels[0];

    return { score, label: level.label, color: level.color };
  }, [password]);
}

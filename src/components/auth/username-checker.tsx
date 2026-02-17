"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface UsernameCheckerProps {
  username: string;
}

type CheckStatus = "idle" | "checking" | "available" | "taken" | "inappropriate" | "error";

export function UsernameChecker({ username }: UsernameCheckerProps) {
  const [status, setStatus] = useState<CheckStatus>("idle");
  const debouncedUsername = useDebounce(username, 500);

  useEffect(() => {
    if (!debouncedUsername || debouncedUsername.length < 3) {
      setStatus("idle");
      return;
    }

    let cancelled = false;

    async function checkAvailability() {
      setStatus("checking");

      try {
        const res = await fetch(
          `/api/username-check?username=${encodeURIComponent(debouncedUsername)}`
        );
        if (cancelled) return;

        if (!res.ok) {
          setStatus("error");
          return;
        }

        const data = await res.json();
        if (data.reason === "inappropriate") {
          setStatus("inappropriate");
        } else {
          setStatus(data.available ? "available" : "taken");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    checkAvailability();

    return () => {
      cancelled = true;
    };
  }, [debouncedUsername]);

  if (status === "idle") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-1.5 mt-1"
      >
        {status === "checking" && (
          <>
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            <span className="text-[10px] font-mono tracking-wider text-muted-foreground">
              CHECKING AVAILABILITY...
            </span>
          </>
        )}
        {status === "available" && (
          <>
            <Check className="h-3 w-3 text-green-500" />
            <span className="text-[10px] font-mono tracking-wider text-green-500">
              CALLSIGN AVAILABLE
            </span>
          </>
        )}
        {status === "taken" && (
          <>
            <X className="h-3 w-3 text-red-500" />
            <span className="text-[10px] font-mono tracking-wider text-red-500">
              CALLSIGN TAKEN
            </span>
          </>
        )}
        {status === "inappropriate" && (
          <>
            <X className="h-3 w-3 text-red-500" />
            <span className="text-[10px] font-mono tracking-wider text-red-500">
              INAPPROPRIATE — CHOOSE ANOTHER
            </span>
          </>
        )}
        {status === "error" && (
          <>
            <X className="h-3 w-3 text-orange-500" />
            <span className="text-[10px] font-mono tracking-wider text-orange-500">
              CHECK FAILED
            </span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

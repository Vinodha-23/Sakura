"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const IDLE_MS = 30 * 60 * 1000; // 30 minutes
const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;

/** Redirects to /session-timeout after 30 minutes of inactivity. */
export function SessionIdleGuard() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        await authClient.signOut();
        router.push("/session-timeout");
        router.refresh();
      }, IDLE_MS);
    };

    reset();
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      if (timer.current) clearTimeout(timer.current);
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [router]);

  return null;
}

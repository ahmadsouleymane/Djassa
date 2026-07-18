import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { LAUNCH_AT } from "@/config/launch";
import { Waitlist } from "@/pages/Waitlist";

const PREVIEW_STORAGE_KEY = "djassa_preview_ok";

function hasPreviewAccess(searchParams: URLSearchParams): boolean {
  if (typeof window === "undefined") return false;

  const key = import.meta.env.VITE_PREVIEW_KEY as string | undefined;
  const suppliedKey = searchParams.get("preview");
  if (key && suppliedKey === key) {
    localStorage.setItem(PREVIEW_STORAGE_KEY, "1");
    return true;
  }
  return localStorage.getItem(PREVIEW_STORAGE_KEY) === "1";
}

/**
 * Verrouille tout le site derrière la page de liste d'attente jusqu'à LAUNCH_AT.
 * `?preview=<VITE_PREVIEW_KEY>` débloque l'accès réel pour l'équipe (persistant via localStorage).
 */
export function LaunchGate({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const [unlocked, setUnlocked] = useState(
    () => Date.now() >= LAUNCH_AT.getTime() || hasPreviewAccess(searchParams),
  );

  useEffect(() => {
    if (unlocked) return;
    const id = window.setInterval(() => {
      if (Date.now() >= LAUNCH_AT.getTime()) setUnlocked(true);
    }, 1000);
    return () => window.clearInterval(id);
  }, [unlocked]);

  if (!unlocked) return <Waitlist />;
  return <>{children}</>;
}

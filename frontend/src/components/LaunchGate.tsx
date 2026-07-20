import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { LAUNCH_AT } from "@/config/launch";
import { Waitlist } from "@/pages/Waitlist";
import { useAuth } from "@/context/AuthContext";

const PREVIEW_STORAGE_KEY = "djassa_preview_ok";

/** Pages publiques qui restent accessibles même avant l'ouverture : auth, infos vendeur */
const PUBLIC_ROUTES = [
  "/connexion",
  "/inscription",
  "/inscription-vendeur",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
  "/vendre",
];

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
 * Verrouille l'accès au site avant LAUNCH_AT, SAUF pour :
 * - Les pages d'inscription/connexion (créer un compte, se connecter)
 * - Les utilisateurs déjà connectés (qui peuvent continuer à utiliser l'app)
 * - Les admins/testeurs via `?preview=<VITE_PREVIEW_KEY>`
 *
 * Cela permet aux vendeurs de s'inscrire, vérifier leur identité et ajouter
 * des produits avant l'ouverture officielle.
 */
export function LaunchGate({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();
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

  // Passé la date d'ouverture → tout le monde passe
  if (unlocked) return <>{children}</>;

  // Utilisateur connecté → laisse passer (il a déjà un compte)
  if (user) return <>{children}</>;

  // Pages publiques autorisées (inscription, connexion, etc.)
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    location.pathname.startsWith(route),
  );
  if (isPublicRoute) return <>{children}</>;

  // Tout le reste → liste d'attente
  return <Waitlist />;
}

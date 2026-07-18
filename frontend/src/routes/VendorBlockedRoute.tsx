import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Layout } from "../components/Layout";

/**
 * Le Marché et le Panier sont réservés aux acheteurs : un compte vendeur
 * connecté est redirigé vers son propre espace plutôt que d'y accéder.
 */
export function VendorBlockedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading)
    return (
      <div className="grid min-h-[100dvh] place-items-center">
        <div className="size-8 animate-spin rounded-full border-[3px] border-secondary border-t-primary" />
      </div>
    );
  if (user?.accountType === "vendeur") return <Navigate to="/vendeur/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

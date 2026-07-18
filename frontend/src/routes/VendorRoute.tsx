import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Layout } from "../components/Layout";

export function VendorRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading)
    return (
      <div className="grid min-h-[100dvh] place-items-center">
        <div className="size-8 animate-spin rounded-full border-[3px] border-secondary border-t-primary" />
      </div>
    );
  if (!user) return <Navigate to="/connexion" replace />;
  if (user.accountType !== "vendeur") return <Navigate to="/marche" replace />;
  return <Layout>{children}</Layout>;
}

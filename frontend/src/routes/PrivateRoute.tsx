import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Layout } from "../components/Layout";

export function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="empty-state">Chargement...</div>;
  if (!user) return <Navigate to="/connexion" replace />;
  return <Layout>{children}</Layout>;
}

import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p>Chargement...</p>;
  if (!user) return <Navigate to="/connexion" replace />;
  return <>{children}</>;
}

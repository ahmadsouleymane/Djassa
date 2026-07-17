import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/api/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageTitle } from "@/hooks/usePageTitle";

export function Login() {
  usePageTitle("Connexion");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/marche");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de connexion");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      tagline="Le marché en ligne ivoirien où l'argent reste protégé jusqu'à ta confirmation de réception."
      bullets={[
        "Séquestre automatique sur chaque commande",
        "Vendeurs vérifiés par pièce d'identité",
        "Messagerie et négociation intégrées",
      ]}
    >
      <span className="text-sm font-semibold tracking-wide text-primary uppercase">
        Connexion
      </span>
      <h1 className="mt-2 text-3xl font-semibold">Content de te revoir</h1>
      <p className="mt-1.5 text-muted-foreground">Connecte-toi à ton compte Jassa.</p>

      <form className="mt-7 flex flex-col gap-4" onSubmit={handleSubmit}>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="toi@exemple.com"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="login-password">Mot de passe</Label>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <Button type="submit" size="lg" className="mt-1" disabled={isSubmitting}>
          {isSubmitting ? "Connexion…" : "Se connecter"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link to="/inscription" className="font-semibold text-primary">
          Créer un compte
        </Link>
      </p>
    </AuthLayout>
  );
}

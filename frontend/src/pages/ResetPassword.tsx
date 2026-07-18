import { useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import { apiClient, ApiError } from "@/api/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePageTitle } from "@/hooks/usePageTitle";

export function ResetPassword() {
  usePageTitle("Réinitialiser le mot de passe");
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/api/auth/reset-password", { token, password, confirmPassword });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Ce lien est invalide ou a expiré.",
      );
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
      {done ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
            <CircleCheck className="size-7" />
          </span>
          <h1 className="text-2xl font-semibold">Mot de passe mis à jour</h1>
          <p className="text-muted-foreground">Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
          <Button className="mt-2" onClick={() => navigate("/connexion")}>
            Se connecter
          </Button>
        </div>
      ) : (
        <>
          <span className="text-sm font-semibold tracking-wide text-primary uppercase">
            Nouveau mot de passe
          </span>
          <h1 className="mt-2 text-3xl font-semibold">Choisis un nouveau mot de passe</h1>

          <form className="mt-7 flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && (
              <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="reset-password">Nouveau mot de passe</Label>
              <PasswordInput
                id="reset-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 caractères minimum"
                minLength={8}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reset-confirm-password">Confirme le mot de passe</Label>
              <PasswordInput
                id="reset-confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" size="lg" className="mt-1" disabled={isSubmitting}>
              {isSubmitting ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            <Link to="/connexion" className="font-semibold text-primary">
              Retour à la connexion
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}

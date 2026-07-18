import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { apiClient } from "@/api/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageTitle } from "@/hooks/usePageTitle";

export function ForgotPassword() {
  usePageTitle("Mot de passe oublié");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post("/api/auth/forgot-password", { email });
    } catch {
      // On affiche toujours le même message de succès (pas d'énumération d'emails).
    } finally {
      setIsSubmitting(false);
      setSent(true);
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
      {sent ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
            <MailCheck className="size-7" />
          </span>
          <h1 className="text-2xl font-semibold">Vérifie ta boîte mail</h1>
          <p className="text-muted-foreground">
            Si un compte existe pour <strong>{email}</strong>, un lien de
            réinitialisation vient de lui être envoyé.
          </p>
          <Button asChild variant="secondary" className="mt-2">
            <Link to="/connexion">Retour à la connexion</Link>
          </Button>
        </div>
      ) : (
        <>
          <span className="text-sm font-semibold tracking-wide text-primary uppercase">
            Mot de passe oublié
          </span>
          <h1 className="mt-2 text-3xl font-semibold">Réinitialise ton mot de passe</h1>
          <p className="mt-1.5 text-muted-foreground">
            On t'envoie un lien de réinitialisation par email.
          </p>

          <form className="mt-7 flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@exemple.com"
                required
              />
            </div>
            <Button type="submit" size="lg" className="mt-1" disabled={isSubmitting}>
              {isSubmitting ? "Envoi…" : "Envoyer le lien"}
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

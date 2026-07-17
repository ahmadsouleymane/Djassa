import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/api/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RegisterFormProps = {
  accountType: "client" | "vendeur";
  kicker: string;
  title: string;
  lead: string;
  brandTag: string;
  brandBullets: string[];
  redirectTo: string;
  switchPrompt: string;
  switchLinkTo: string;
  switchLinkLabel: string;
};

export function RegisterForm({
  accountType,
  kicker,
  title,
  lead,
  brandTag,
  brandBullets,
  redirectTo,
  switchPrompt,
  switchLinkTo,
  switchLinkLabel,
}: RegisterFormProps) {
  const { register } = useAuth();
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
      await register(email, password, accountType);
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur d'inscription");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout tagline={brandTag} bullets={brandBullets}>
      <span className="text-sm font-semibold tracking-wide text-primary uppercase">
        {kicker}
      </span>
      <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
      <p className="mt-1.5 text-muted-foreground">{lead}</p>

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
          <Label htmlFor="reg-email">Email</Label>
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="toi@exemple.com"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-password">Mot de passe</Label>
          <PasswordInput
            id="reg-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8 caractères minimum"
            minLength={8}
            required
          />
        </div>
        <Button type="submit" size="lg" className="mt-1" disabled={isSubmitting}>
          {isSubmitting ? "Création…" : "Créer mon compte"}
        </Button>
      </form>

      <div className="mt-6 space-y-1.5 text-sm text-muted-foreground">
        <p>
          Déjà un compte ?{" "}
          <Link to="/connexion" className="font-semibold text-primary">
            Se connecter
          </Link>
        </p>
        <p>
          {switchPrompt}{" "}
          <Link to={switchLinkTo} className="font-semibold text-primary">
            {switchLinkLabel}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

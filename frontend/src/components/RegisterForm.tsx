import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/api/client";
import { referralApi } from "@/api/referrals";
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
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref")?.trim() ?? undefined;
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phoneValid = /^0\d{9}$/.test(phone);
  const passwordsMatch = password === confirmPassword;

  // Vérifier le code de parrainage dans l'URL
  useEffect(() => {
    if (!referralCode) return;
    referralApi.checkCode(referralCode).then((res) => {
      setReferrerName(res.referrerName);
    }).catch(() => {});
  }, [referralCode]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!phoneValid) {
      setError("Le numéro doit commencer par 0 et contenir exactement 10 chiffres.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (!passwordsMatch) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, phone, password, accountType, referralCode);
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

      {referrerName && (
        <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          🎉 <strong>{referrerName}</strong> t'a invité sur Djassa. Ton premier achat est 100% protégé.
        </div>
      )}

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
          <Label htmlFor="reg-phone">Numéro de téléphone</Label>
          <div className="flex items-stretch overflow-hidden rounded-md border border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
            <span className="flex shrink-0 items-center gap-1.5 border-r border-input bg-muted px-3 text-sm font-medium text-muted-foreground select-none">
              <span aria-hidden>🇨🇮</span> +225
            </span>
            <Input
              id="reg-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="0700000000"
              aria-invalid={phone.length > 0 && !phoneValid}
              className="border-0 focus-visible:ring-0"
              required
            />
          </div>
          {phone.length > 0 && !phoneValid && (
            <p className="text-xs text-destructive">
              Le numéro doit commencer par 0 et faire exactement 10 chiffres.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-password">Mot de passe</Label>
          <PasswordInput
            id="reg-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choisis ton mot de passe"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-password-confirm">Confirme le mot de passe</Label>
          <PasswordInput
            id="reg-password-confirm"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Retape ton mot de passe"
            aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
            required
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-destructive">Les mots de passe ne correspondent pas.</p>
          )}
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

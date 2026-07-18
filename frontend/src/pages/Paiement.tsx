import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Lock, ShieldCheck, Loader2, Check } from "lucide-react";
import { ordersApi, type CheckoutSummary } from "@/api/orders";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatFcfa, cn } from "@/lib/utils";

type Operator = { id: string; name: string; hint: string; accent: string };

const OPERATORS: Operator[] = [
  { id: "orange", name: "Orange Money", hint: "#144#", accent: "#ff7900" },
  { id: "mtn", name: "MTN MoMo", hint: "*133#", accent: "#ffcc00" },
  { id: "moov", name: "Moov Money", hint: "*155#", accent: "#0066b3" },
  { id: "wave", name: "Wave", hint: "App Wave", accent: "#1dc3ff" },
];

function PaymentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-[900px] items-center justify-between px-4">
          <Logo />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Lock className="size-3.5" /> Paiement sécurisé
          </span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}

export function Paiement() {
  usePageTitle("Paiement sécurisé", {
    description: "Règle ta commande Djassa. Ton argent reste séquestré jusqu'à réception confirmée.",
  });
  const { reference } = useParams<{ reference: string }>();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [operator, setOperator] = useState<string>("orange");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");
  const [payError, setPayError] = useState<string | null>(null);

  const phoneValid = /^0\d{9}$/.test(phone);

  useEffect(() => {
    if (!reference) return;
    setIsLoading(true);
    ordersApi
      .checkoutSummary(reference)
      .then(setSummary)
      .catch((err) =>
        setLoadError(
          err instanceof ApiError ? err.message : "Impossible de charger ce paiement.",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [reference]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!reference || !phoneValid || code.length < 4) return;
    setStatus("processing");
    setPayError(null);
    try {
      await ordersApi.pay(reference);
      setStatus("done");
      setTimeout(() => navigate("/commandes?paye=1"), 1400);
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : "Le paiement a échoué. Réessaie.");
      setStatus("idle");
    }
  }

  if (isLoading) {
    return (
      <PaymentShell>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement du paiement…</p>
        </div>
      </PaymentShell>
    );
  }

  if (loadError || !summary) {
    return (
      <PaymentShell>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            {loadError ?? "Ce paiement n'est plus disponible."}
          </p>
          <Button asChild>
            <Link to="/commandes">Voir mes commandes</Link>
          </Button>
        </div>
      </PaymentShell>
    );
  }

  if (status === "done") {
    return (
      <PaymentShell>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-primary/15 text-primary">
            <Check className="size-8" strokeWidth={3} />
          </span>
          <div>
            <p className="text-lg font-semibold">Paiement confirmé</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ton argent est séquestré chez Djassa. On te redirige…
            </p>
          </div>
        </div>
      </PaymentShell>
    );
  }

  const processing = status === "processing";

  return (
    <PaymentShell>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] md:p-8">
        <h1 className="text-2xl font-semibold">Payer ma commande</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisis ton moyen de paiement mobile et confirme.
        </p>

        {/* Récap */}
        <ul className="mt-5 space-y-2 rounded-xl bg-secondary/50 p-4">
          {summary.items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-muted-foreground">
                {it.title}
                {it.quantity > 1 && <span className="ml-1">×{it.quantity}</span>}
              </span>
              <span className="shrink-0 font-medium tabular">{formatFcfa(it.linePrice)}</span>
            </li>
          ))}
          <li className="mt-1 flex items-baseline justify-between border-t border-border pt-2.5">
            <span className="font-semibold">Total à payer</span>
            <span className="font-display text-xl font-semibold tabular">
              {formatFcfa(summary.total)}
            </span>
          </li>
        </ul>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handlePay}>
          {/* Opérateurs */}
          <div className="grid grid-cols-2 gap-2.5">
            {OPERATORS.map((op) => {
              const active = operator === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setOperator(op.id)}
                  className={cn(
                    "press flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors",
                    active
                      ? "border-primary bg-accent/60 ring-1 ring-primary"
                      : "border-border bg-card hover:border-brand-300",
                  )}
                >
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: op.accent }}
                  >
                    {op.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{op.name}</span>
                    <span className="block text-xs text-muted-foreground">{op.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Numéro */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="pay-phone">Numéro {OPERATORS.find((o) => o.id === operator)?.name}</Label>
            <div className="flex items-stretch overflow-hidden rounded-md border border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
              <span className="flex shrink-0 items-center gap-1.5 border-r border-input bg-muted px-3 text-sm font-medium text-muted-foreground select-none">
                <span aria-hidden>🇨🇮</span> +225
              </span>
              <Input
                id="pay-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="0700000000"
                aria-invalid={phone.length > 0 && !phoneValid}
                className="border-0 focus-visible:ring-0"
                disabled={processing}
                required
              />
            </div>
          </div>

          {/* Code */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="pay-code">Code secret</Label>
            <Input
              id="pay-code"
              type="password"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Code de validation mobile money"
              disabled={processing}
              required
            />
            <p className="text-xs text-muted-foreground">
              Tu recevras une demande de confirmation sur ton téléphone.
            </p>
          </div>

          {payError && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive"
            >
              {payError}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="mt-1 w-full"
            disabled={processing || !phoneValid || code.length < 4}
          >
            {processing ? (
              <>
                <Loader2 className="size-5 animate-spin" /> Confirmation…
              </>
            ) : (
              <>Payer {formatFcfa(summary.total)}</>
            )}
          </Button>
        </form>

        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          Paiement sécurisé via GeniusPay. L'argent reste séquestré par Djassa
          jusqu'à réception confirmée.
        </p>
      </div>
    </PaymentShell>
  );
}

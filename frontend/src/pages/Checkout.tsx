import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ordersApi } from "@/api/orders";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatFcfa } from "@/lib/utils";

function CheckoutShell({ children }: { children: React.ReactNode }) {
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
      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}

export function Checkout() {
  usePageTitle("Paiement", {
    description: "Finalise ton paiement sécurisé Jassa pour les articles de ton panier.",
  });
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vendorCount = new Set(items.map((i) => i.vendorId)).size;

  async function handlePay() {
    if (!user) {
      navigate("/connexion");
      return;
    }
    setIsPaying(true);
    setError(null);
    try {
      const { checkoutUrl } = await ordersApi.createDirect(items.map((i) => i.productId));
      clear();
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Le paiement n'a pas pu être initié.");
      setIsPaying(false);
    }
  }

  if (isPaying) {
    return (
      <CheckoutShell>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="font-medium">Redirection vers le paiement sécurisé GeniusPay…</p>
          <p className="text-sm text-muted-foreground">Ne ferme pas cette page.</p>
        </div>
      </CheckoutShell>
    );
  }

  if (items.length === 0) {
    return (
      <CheckoutShell>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">Ton panier est vide.</p>
          <Button asChild>
            <Link to="/marche">Parcourir le marché</Link>
          </Button>
        </div>
      </CheckoutShell>
    );
  }

  return (
    <CheckoutShell>
      <Link
        to="/panier"
        className="mb-5 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground no-underline hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour au panier
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] md:p-8">
        <h1 className="text-2xl font-semibold">Valider et payer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Prix affiché garanti, sans négociation.
        </p>

        <ul className="mt-6 divide-y divide-border">
          {items.map((item) => (
            <li key={item.productId} className="flex items-center gap-3 py-3">
              <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {item.photo && (
                  <img src={item.photo} alt="" className="size-full object-cover" />
                )}
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {item.title}
              </span>
              <span className="text-sm font-semibold tabular">
                {formatFcfa(item.price)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span className="font-semibold">Total à payer</span>
          <span className="font-display text-2xl font-semibold tabular">
            {formatFcfa(total)}
          </span>
        </div>

        {vendorCount > 1 && (
          <p className="mt-3 rounded-lg bg-secondary/70 p-3 text-xs text-muted-foreground">
            Réparti en {vendorCount} commandes distinctes, réglées en un seul
            paiement.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}

        <Button size="lg" className="mt-6 w-full" onClick={handlePay}>
          Payer {formatFcfa(total)}
        </Button>

        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          Paiement sécurisé via GeniusPay. L'argent reste séquestré par Jassa
          jusqu'à réception confirmée.
        </p>
      </div>
    </CheckoutShell>
  );
}

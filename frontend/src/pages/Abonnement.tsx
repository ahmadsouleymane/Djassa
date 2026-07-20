import { useEffect, useState } from "react";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { billingApi, type PlanStatus } from "@/api/billing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";

const STANDARD_FEATURES = [
  "Commission de 5% par commande confirmée",
  "Paiement garanti dès la confirmation de l'acheteur",
  "Messagerie et négociation intégrées",
  "Aucun engagement",
];

const PRO_FEATURES = [
  "Commission de 5% par commande confirmée (identique au Standard)",
  "Produits mis en avant en tête du marché",
  "Badge Vendeur Pro sur ton profil",
  "Boutique personnalisable",
  "Statistiques de vente détaillées",
  "Accès à plus de données sur ton activité",
];

export function Abonnement() {
  usePageTitle("Abonnement vendeur : Standard ou Pro");
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Si on revient de GeniusPay (paramètre ref), on force la synchro
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && !status) {
      setIsSyncing(true);
      // Essayer immédiatement, puis réessayer toutes les 2s pendant 30s max
      let attempts = 0;
      const maxAttempts = 15;
      const trySync = async () => {
        try {
          const result = await billingApi.sync();
          if (result.planTier === "pro") {
            setStatus({ planTier: "pro", planPeriodEnd: result.planPeriodEnd ?? null });
            setIsSyncing(false);
            return;
          }
          if (result.synced) {
            // Relire le statut
            const me = await billingApi.me();
            setStatus(me);
            setIsSyncing(false);
            return;
          }
        } catch {}
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(trySync, 2000);
        } else {
          setIsSyncing(false);
          // Dernière tentative : recharger le statut
          billingApi.me().then(setStatus).catch(() => {});
        }
      };
      trySync();
      return;
    }

    billingApi.me().then(setStatus).catch(() => {});
  }, []);

  async function handleSubscribe() {
    setIsRedirecting(true);
    try {
      const { checkoutUrl } = await billingApi.checkout();
      window.location.href = checkoutUrl;
    } catch {
      setIsRedirecting(false);
    }
  }

  const isPro = status?.planTier === "pro";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header className="text-center">
        <h1 className="text-3xl font-semibold md:text-4xl">Choisis ton palier vendeur</h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          La commission de 5% est la même pour tous les paliers. Passe Pro pour
          gagner en visibilité, personnaliser ta boutique et accéder à plus de données.
        </p>
        {isSyncing ? (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-muted-foreground">Synchronisation du paiement…</span>
          </div>
        ) : status ? (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Palier actuel :</span>
            <Badge variant={isPro ? "success" : "secondary"}>
              {isPro ? "Pro" : "Standard"}
            </Badge>
            {isPro && status.planPeriodEnd && (
              <span className="text-muted-foreground">
                jusqu'au {new Date(status.planPeriodEnd).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>
        ) : null}
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Standard */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-xs)]">
          <h2 className="font-display text-xl font-semibold">Standard</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pour se lancer sans frais.</p>
          <p className="mt-4">
            <span className="font-display text-3xl font-semibold">Gratuit</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3">
            {STANDARD_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
          <Button variant="secondary" className="mt-6 w-full" disabled>
            {isPro ? "Non actif" : "Palier actuel"}
          </Button>
        </div>

        {/* Pro */}
        <div
          className={cn(
            "relative flex flex-col rounded-2xl border-2 bg-card p-6 shadow-[var(--shadow-md)]",
            "border-primary",
          )}
        >
          <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            <Sparkles className="size-3" /> Recommandé
          </span>
          <h2 className="font-display text-xl font-semibold">Pro</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pour vendre plus et mieux.</p>
          <p className="mt-4 flex items-baseline gap-1">
            <span className="font-display text-3xl font-semibold tabular">7 000 FCFA</span>
            <span className="text-sm text-muted-foreground">/mois</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
          {isPro ? (
            <Button className="mt-6 w-full" disabled>
              <Check className="size-4" /> Tu es Pro
            </Button>
          ) : (
            <Button className="mt-6 w-full" onClick={handleSubscribe} disabled={isRedirecting}>
              {isRedirecting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Redirection…
                </>
              ) : (
                "Passer Pro"
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-secondary/40 p-6">
        <h3 className="font-semibold">Pourquoi passer Pro ?</h3>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
          La commission reste à 5% quel que soit ton palier. Avec le palier Pro,
          tes produits gagnent en visibilité (mis en avant en tête du marché),
          tu profites d'une boutique personnalisable avec ton nom et ton image
          de marque, et tu accèdes à des données détaillées sur tes ventes.
          L'abonnement à 7 000 FCFA/mois est un investissement dans ta croissance
          sur Djassa.
        </p>
      </div>
    </div>
  );
}

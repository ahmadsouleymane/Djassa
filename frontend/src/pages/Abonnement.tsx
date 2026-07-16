import { useEffect, useState } from "react";
import { billingApi, type PlanStatus } from "../api/billing";

export function Abonnement() {
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  function reload() {
    billingApi.me().then(setStatus);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSubscribe() {
    const { checkoutUrl } = await billingApi.checkout();
    setCheckoutUrl(checkoutUrl);
  }

  return (
    <div>
      <h1>Abonnement</h1>
      {status && (
        <p>
          Palier actuel : {status.planTier === "pro" ? "Pro" : "Standard"}
          {status.planPeriodEnd && ` (jusqu'au ${new Date(status.planPeriodEnd).toLocaleDateString("fr-FR")})`}
        </p>
      )}
      {status?.planTier !== "pro" && (
        <div>
          <p>Palier Pro : 7 000 FCFA/mois — commission réduite à 3%, badge, mise en avant, stats avancées.</p>
          <button onClick={handleSubscribe}>Passer Pro</button>
        </div>
      )}
      {checkoutUrl && <p>Paiement simulé — référence : {checkoutUrl}</p>}
    </div>
  );
}

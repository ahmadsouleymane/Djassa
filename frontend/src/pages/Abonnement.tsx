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

  const isPro = status?.planTier === "pro";

  return (
    <div>
      <div className="page-header">
        <h1>Abonnement</h1>
      </div>
      <div className="card section">
        {status && (
          <p>
            Palier actuel : <span className={`pill ${isPro ? "pill-success" : "pill-neutral"}`}>{isPro ? "Pro" : "Standard"}</span>
            {status.planPeriodEnd && (
              <span style={{ color: "var(--text2)" }}> — jusqu'au {new Date(status.planPeriodEnd).toLocaleDateString("fr-FR")}</span>
            )}
          </p>
        )}
        {!isPro && (
          <div style={{ marginTop: "1rem" }}>
            <p>
              Passe Pro pour vendre plus vite : commission à 3% au lieu de 5%, le badge Vendeur vérifié affiché sur toutes tes
              annonces, une mise en avant sur le Marché et des statistiques de vente détaillées — pour{" "}
              <span className="price">7 000 FCFA/mois</span>.
            </p>
            <button className="btn btn-primary" onClick={handleSubscribe}>
              Passer Pro
            </button>
          </div>
        )}
        {checkoutUrl && <p className="code-chip" style={{ marginTop: "1rem" }}>Paiement simulé — référence : {checkoutUrl}</p>}
      </div>
    </div>
  );
}

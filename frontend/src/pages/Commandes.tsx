import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ordersApi, type Order } from "../api/orders";
import { ReviewForm } from "../components/ReviewForm";
import "./Commandes.css";

const STATUS_LABELS: Record<Order["status"], string> = {
  en_attente_paiement: "En attente de paiement",
  paye: "Payée",
  expedie: "Expédiée",
  confirme: "Confirmée",
  en_litige: "En litige",
  rembourse: "Remboursée",
};

const STATUS_TONE: Record<Order["status"], string> = {
  en_attente_paiement: "pill-warning",
  paye: "pill-neutral",
  expedie: "pill-neutral",
  confirme: "pill-success",
  en_litige: "pill-danger",
  rembourse: "pill-danger",
};

const STEP_INDEX: Record<Order["status"], number> = {
  en_attente_paiement: 0,
  paye: 1,
  expedie: 2,
  confirme: 3,
  en_litige: 1,
  rembourse: 1,
};

function OrderRail({ status }: { status: Order["status"] }) {
  const step = STEP_INDEX[status];
  const isDispute = status === "en_litige" || status === "rembourse";
  const dots = [0, 1, 2, 3];
  return (
    <div className="rail">
      {dots.map((i) => (
        <div className="rail-step" key={i}>
          <div
            className={`rail-dot ${
              isDispute && i === step ? "is-danger" : i < step ? "is-done" : i === step ? "is-current" : ""
            }`}
          />
          {i < 3 && <div className={`rail-line ${i < step ? "is-done" : ""}`} />}
        </div>
      ))}
    </div>
  );
}

function OrderRow({ order, currentUserId, onChange }: { order: Order; currentUserId: string; onChange: () => void }) {
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [checkoutInfo, setCheckoutInfo] = useState<string | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const isBuyer = order.buyerId === currentUserId;
  const isVendor = order.vendorId === currentUserId;

  async function handleCheckout() {
    const { checkoutUrl } = await ordersApi.checkout(order.id);
    setCheckoutInfo(checkoutUrl);
    onChange();
  }

  async function handleShip() {
    await ordersApi.ship(order.id);
    onChange();
  }

  async function handleConfirm() {
    await ordersApi.confirm(order.id);
    onChange();
  }

  async function handleDispute() {
    if (!disputeReason.trim()) return;
    await ordersApi.dispute(order.id, disputeReason);
    setDisputeReason("");
    setShowDisputeForm(false);
    onChange();
  }

  return (
    <li className="card order-card">
      <div className="order-card-top">
        <span className="price">{order.price.toLocaleString("fr-FR")} FCFA</span>
        <span className={`pill ${STATUS_TONE[order.status]}`}>{STATUS_LABELS[order.status]}</span>
      </div>
      <OrderRail status={order.status} />
      {isBuyer && order.confirmationCode && (
        <p>
          Code de confirmation : <span className="code-chip">{order.confirmationCode}</span>
        </p>
      )}
      {checkoutInfo && <p className="code-chip">Paiement simulé — référence : {checkoutInfo}</p>}
      <div className="order-actions">
        {isBuyer && order.status === "en_attente_paiement" && (
          <button className="btn btn-primary btn-sm" onClick={handleCheckout}>
            Payer
          </button>
        )}
        {isVendor && order.status === "paye" && (
          <button className="btn btn-primary btn-sm" onClick={handleShip}>
            Expédier
          </button>
        )}
        {isBuyer && order.status === "expedie" && (
          <button className="btn btn-primary btn-sm" onClick={handleConfirm}>
            Confirmer la réception
          </button>
        )}
        {(isBuyer || isVendor) && (order.status === "paye" || order.status === "expedie") && !showDisputeForm && (
          <button className="btn btn-danger btn-sm" onClick={() => setShowDisputeForm(true)}>
            Signaler un litige
          </button>
        )}
      </div>
      {showDisputeForm && (
        <div className="dispute-form">
          <input
            className="input"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Ex : colis jamais reçu, produit différent de l'annonce..."
          />
          <button className="btn btn-danger btn-sm" onClick={handleDispute}>
            Envoyer le litige
          </button>
        </div>
      )}
      {isBuyer && order.status === "confirme" && !reviewSubmitted && (
        <ReviewForm orderId={order.id} onSubmitted={() => setReviewSubmitted(true)} />
      )}
      {reviewSubmitted && <p className="pill pill-success">Merci pour ton avis</p>}
    </li>
  );
}

export function Commandes() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  function reload() {
    ordersApi.listMine().then((res) => setOrders(res.orders));
  }

  useEffect(() => {
    reload();
    setIsLoading(false);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Mes commandes</h1>
        <p>Les fonds restent bloqués sur Jassa jusqu'à confirmation de réception.</p>
      </div>
      {isLoading ? (
        <div className="empty-state">Chargement...</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">Aucune commande pour l'instant. Direction le Marché pour trouver ta prochaine trouvaille.</div>
      ) : (
        <ul className="card-list">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} currentUserId={user!.id} onChange={reload} />
          ))}
        </ul>
      )}
    </div>
  );
}

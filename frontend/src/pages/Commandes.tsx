import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ordersApi, type Order } from "../api/orders";
import { ReviewForm } from "../components/ReviewForm";

const STATUS_LABELS: Record<Order["status"], string> = {
  en_attente_paiement: "En attente de paiement",
  paye: "Payée",
  expedie: "Expédiée",
  confirme: "Confirmée",
  en_litige: "En litige",
  rembourse: "Remboursée",
};

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
    <li>
      <p>
        {order.price.toLocaleString("fr-FR")} FCFA — {STATUS_LABELS[order.status]}
      </p>
      {isBuyer && order.confirmationCode && <p>Code de confirmation : {order.confirmationCode}</p>}
      {checkoutInfo && <p>Paiement simulé — référence : {checkoutInfo}</p>}
      {isBuyer && order.status === "en_attente_paiement" && <button onClick={handleCheckout}>Payer</button>}
      {isVendor && order.status === "paye" && <button onClick={handleShip}>Expédier</button>}
      {isBuyer && order.status === "expedie" && <button onClick={handleConfirm}>Confirmer la réception</button>}
      {(isBuyer || isVendor) && (order.status === "paye" || order.status === "expedie") && (
        <>
          {showDisputeForm ? (
            <span>
              <input
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Décris le problème"
              />
              <button onClick={handleDispute}>Envoyer le litige</button>
            </span>
          ) : (
            <button onClick={() => setShowDisputeForm(true)}>Signaler un litige</button>
          )}
        </>
      )}
      {isBuyer && order.status === "confirme" && !reviewSubmitted && (
        <ReviewForm orderId={order.id} onSubmitted={() => setReviewSubmitted(true)} />
      )}
      {reviewSubmitted && <p>Merci pour votre avis.</p>}
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
      <h1>Mes commandes</h1>
      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <ul>
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} currentUserId={user!.id} onChange={reload} />
          ))}
        </ul>
      )}
    </div>
  );
}

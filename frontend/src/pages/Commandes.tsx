import { useEffect, useState } from "react";
import { PackageOpen, CircleCheck, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ordersApi, type Order } from "@/api/orders";
import { ReviewForm } from "@/components/ReviewForm";
import { ShipOrderDialog } from "@/components/orders/ShipOrderDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatFcfa } from "@/lib/utils";

const STATUS_LABELS: Record<Order["status"], string> = {
  en_attente_paiement: "En attente de paiement",
  paye: "Payée",
  expedie: "Expédiée",
  confirme: "Confirmée",
  en_litige: "En litige",
  rembourse: "Remboursée",
};

const STATUS_VARIANT: Record<Order["status"], React.ComponentProps<typeof Badge>["variant"]> = {
  en_attente_paiement: "warning",
  paye: "secondary",
  expedie: "ink",
  confirme: "success",
  en_litige: "destructive",
  rembourse: "destructive",
};

const STEP_INDEX: Record<Order["status"], number> = {
  en_attente_paiement: 0,
  paye: 1,
  expedie: 2,
  confirme: 3,
  en_litige: 1,
  rembourse: 1,
};

const RAIL = ["En attente", "Payée", "Expédiée", "Confirmée"];

function OrderRail({ status }: { status: Order["status"] }) {
  const step = STEP_INDEX[status];
  const isDispute = status === "en_litige" || status === "rembourse";
  return (
    <div className="flex items-start">
      {RAIL.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <div key={label} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={
                  "grid size-6 place-items-center rounded-full text-white transition-colors " +
                  (isDispute && current
                    ? "bg-destructive"
                    : done
                      ? "bg-primary"
                      : current
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "bg-secondary")
                }
              >
                {done && (
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none">
                    <path d="M5 12.5 10 17 19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-[0.65rem] font-medium text-muted-foreground">{label}</span>
            </div>
            {i < RAIL.length - 1 && (
              <span className={"mx-1 mt-3 h-0.5 flex-1 rounded-full " + (done ? "bg-primary" : "bg-secondary")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderRow({
  order,
  currentUserId,
  onChange,
}: {
  order: Order;
  currentUserId: string;
  onChange: () => void;
}) {
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const isBuyer = order.buyerId === currentUserId;
  const isVendor = order.vendorId === currentUserId;

  async function run(action: string, fn: () => Promise<unknown>, err: string) {
    setBusy(action);
    try {
      await fn();
      onChange();
    } catch {
      toast.error(err);
    } finally {
      setBusy(null);
    }
  }

  async function handleCheckout() {
    setBusy("pay");
    try {
      const { checkoutUrl } = await ordersApi.checkout(order.id);
      window.location.href = checkoutUrl;
    } catch {
      toast.error("Le paiement n'a pas pu être initié.");
      setBusy(null);
    }
  }

  async function handleDispute() {
    if (!disputeReason.trim()) return;
    await run("dispute", () => ordersApi.dispute(order.id, disputeReason), "Le litige n'a pas pu être envoyé.");
    setDisputeReason("");
    setShowDisputeForm(false);
  }

  const canDispute =
    (isBuyer || isVendor) && (order.status === "paye" || order.status === "expedie");

  return (
    <li className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-xs)] md:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-xl font-semibold tabular">
          {formatFcfa(order.price)}
        </span>
        <Badge variant={STATUS_VARIANT[order.status]}>{STATUS_LABELS[order.status]}</Badge>
      </div>

      <div className="mt-5">
        <OrderRail status={order.status} />
      </div>

      {isBuyer && order.confirmationCode && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-secondary/70 px-4 py-3">
          <span className="text-sm text-muted-foreground">Code de confirmation</span>
          <span className="font-mono text-lg font-bold tracking-[0.25em] tabular">
            {order.confirmationCode}
          </span>
        </div>
      )}

      {(order.trackingNumber || order.carrier) && (order.status === "expedie" || order.status === "confirme") && (
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl bg-secondary/70 px-4 py-3 text-sm">
          {order.carrier && (
            <span>
              <span className="text-muted-foreground">Transporteur : </span>
              <span className="font-medium">{order.carrier}</span>
            </span>
          )}
          {order.trackingNumber && (
            <span>
              <span className="text-muted-foreground">Suivi : </span>
              <span className="font-mono font-medium">{order.trackingNumber}</span>
            </span>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2.5">
        {isBuyer && order.status === "en_attente_paiement" && (
          <Button size="sm" onClick={handleCheckout} disabled={busy === "pay"}>
            {busy === "pay" ? <Loader2 className="size-4 animate-spin" /> : null}
            Payer maintenant
          </Button>
        )}
        {isVendor && order.status === "paye" && <ShipOrderDialog orderId={order.id} onShipped={onChange} />}
        {isBuyer && order.status === "expedie" && (
          <Button
            size="sm"
            onClick={() => run("confirm", () => ordersApi.confirm(order.id), "Action impossible.")}
            disabled={busy === "confirm"}
          >
            <CircleCheck className="size-4" /> Confirmer la réception
          </Button>
        )}
        {canDispute && !showDisputeForm && (
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => setShowDisputeForm(true)}
          >
            <AlertTriangle className="size-4" /> Signaler un litige
          </Button>
        )}
      </div>

      {showDisputeForm && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Ex : colis jamais reçu, produit différent de l'annonce…"
          />
          <Button
            variant="destructive"
            onClick={handleDispute}
            disabled={busy === "dispute"}
            className="shrink-0"
          >
            Envoyer
          </Button>
        </div>
      )}

      {isBuyer && order.status === "confirme" && !reviewSubmitted && (
        <div className="mt-5 border-t border-border pt-5">
          <ReviewForm orderId={order.id} onSubmitted={() => setReviewSubmitted(true)} />
        </div>
      )}
      {reviewSubmitted && (
        <Badge variant="success" className="mt-4">
          Merci pour ton avis
        </Badge>
      )}
    </li>
  );
}

export function Commandes() {
  usePageTitle("Mes commandes");
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  function reload() {
    ordersApi
      .listMine()
      .then((res) => setOrders(res.orders))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">Mes commandes</h1>
        <p className="mt-1 text-muted-foreground">
          Les fonds restent bloqués sur Djassa jusqu'à confirmation de réception.
        </p>
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-secondary text-muted-foreground">
            <PackageOpen className="size-7" />
          </span>
          <p className="max-w-sm text-muted-foreground">
            Aucune commande pour l'instant. Direction le marché pour trouver ta
            prochaine trouvaille.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} currentUserId={user!.id} onChange={reload} />
          ))}
        </ul>
      )}
    </div>
  );
}

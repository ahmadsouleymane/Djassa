import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type DisputeOrder } from "@/api/admin";
import { apiClient } from "@/api/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatFcfa } from "@/lib/utils";

export function AdminDisputes() {
  usePageTitle("Litiges");
  const [disputes, setDisputes] = useState<DisputeOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  function reload() {
    adminApi
      .disputes()
      .then((res) => setDisputes(res.disputes))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  async function resolve(orderId: string, resolution: "confirme" | "rembourse") {
    setBusyId(orderId);
    try {
      await apiClient.post(`/api/orders/${orderId}/dispute/resolve`, { resolution });
      toast.success(resolution === "rembourse" ? "Acheteur remboursé" : "Commande confirmée en faveur du vendeur");
      reload();
    } catch {
      toast.error("Action impossible.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell>
      {isLoading ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : disputes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-accent text-primary">
            <ShieldAlert className="size-7" />
          </span>
          <p className="text-muted-foreground">Aucun litige ouvert pour l'instant.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {disputes.map((d) => (
            <li key={d.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-xs)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {d.product.photos[0] && <img src={d.product.photos[0]} alt="" className="size-full object-cover" />}
                  </div>
                  <div>
                    <p className="font-medium">{d.product.title}</p>
                    <p className="text-sm text-muted-foreground">{formatFcfa(d.price)}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Acheteur : {d.buyer.email}</p>
                  <p>Vendeur : {d.vendor.email}</p>
                </div>
              </div>
              {d.disputeReason && (
                <p className="mt-3 rounded-lg bg-secondary/60 p-3 text-sm">{d.disputeReason}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Button size="sm" onClick={() => resolve(d.id, "confirme")} disabled={busyId === d.id}>
                  Confirmer (en faveur du vendeur)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => resolve(d.id, "rembourse")}
                  disabled={busyId === d.id}
                >
                  Rembourser l'acheteur
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

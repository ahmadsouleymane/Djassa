import { useState } from "react";
import { Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ordersApi } from "@/api/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ShipOrderDialog({
  orderId,
  onShipped,
  trigger,
}: {
  orderId: string;
  onShipped: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleShip() {
    setBusy(true);
    try {
      await ordersApi.ship(orderId, {
        trackingNumber: trackingNumber.trim() || undefined,
        carrier: carrier.trim() || undefined,
      });
      toast.success("Commande marquée comme expédiée");
      setOpen(false);
      onShipped();
    } catch {
      toast.error("Impossible de marquer cette commande comme expédiée.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Truck className="size-4" /> Marquer expédiée
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Expédier la commande</DialogTitle>
          <DialogDescription>
            Le numéro de suivi est optionnel mais aide l'acheteur à suivre son colis.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="carrier">Transporteur</Label>
            <Input
              id="carrier"
              placeholder="Ex : DHL, poste locale, coursier…"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tracking-number">Numéro de suivi</Label>
            <Input
              id="tracking-number"
              placeholder="Optionnel"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
            Annuler
          </Button>
          <Button onClick={handleShip} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Truck className="size-4" />}
            Confirmer l'expédition
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

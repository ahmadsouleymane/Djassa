import { useEffect, useState } from "react";
import { Check, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { verificationApi, type PendingVendor } from "@/api/verification";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";

function PhotoLink({ url, label }: { url: string | null; label: string }) {
  if (!url) return <span className="grid size-24 shrink-0 place-items-center rounded-xl border border-dashed border-border bg-secondary/30 text-xs text-muted-foreground">{label}</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block size-24 shrink-0 overflow-hidden rounded-xl border border-border">
      <img src={url} alt={label} className="size-full object-cover" />
    </a>
  );
}

export function AdminVerifications() {
  usePageTitle("Vérifications admin");
  const [pending, setPending] = useState<PendingVendor[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  function reload() {
    verificationApi.listPending().then((res) => setPending(res.users)).catch(() => {});
  }

  useEffect(() => { reload(); }, []);

  async function handleApprove(userId: string) {
    try {
      await verificationApi.approve(userId);
      toast.success("Vendeur approuvé");
      reload();
    } catch { toast.error("Action impossible."); }
  }

  async function handleReject(userId: string) {
    const reason = reasons[userId];
    if (!reason?.trim()) { toast.error("Indique un motif de rejet."); return; }
    try {
      await verificationApi.reject(userId, reason);
      toast.success("Dossier rejeté");
      reload();
    } catch { toast.error("Action impossible."); }
  }

  return (
    <AdminShell>
      <header>
        <h2 className="text-xl font-semibold">Vérifications en attente</h2>
        <p className="mt-1 text-muted-foreground">Examine les 3 photos (recto, verso, selfie) avant d'approuver ou de rejeter.</p>
      </header>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-accent text-primary"><ShieldCheck className="size-7" /></span>
          <p className="text-muted-foreground">Aucune vérification en attente.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {pending.map((u) => (
            <li key={u.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-xs)] md:flex-row md:items-start">
              <div className="flex gap-2">
                <PhotoLink url={u.rectoUrl} label="Recto" />
                <PhotoLink url={u.versoUrl} label="Verso" />
                <PhotoLink url={u.selfieUrl} label="Selfie" />
              </div>
              <span className="flex-1 font-medium break-all pt-2">{u.email}</span>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button size="sm" onClick={() => handleApprove(u.id)}><Check className="size-4" /> Approuver</Button>
                <div className="flex gap-2">
                  <Input value={reasons[u.id] ?? ""} onChange={(e) => setReasons({ ...reasons, [u.id]: e.target.value })} placeholder="Motif de rejet" className="h-9 w-44" />
                  <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleReject(u.id)}><X className="size-4" /> Rejeter</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

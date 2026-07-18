import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type Report } from "@/api/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

const TARGET_LABELS: Record<Report["targetType"], string> = {
  produit: "Produit",
  utilisateur: "Utilisateur",
  message: "Message",
};

export function AdminReports() {
  usePageTitle("Signalements");
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  function reload() {
    adminApi
      .reports("en_attente")
      .then((res) => setReports(res.reports))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  async function resolve(id: string, status: "traite" | "rejete") {
    setBusyId(id);
    try {
      await adminApi.resolveReport(id, status, notes[id]);
      toast.success(status === "traite" ? "Signalement traité" : "Signalement rejeté");
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
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-accent text-primary">
            <Flag className="size-7" />
          </span>
          <p className="text-muted-foreground">Aucun signalement en attente.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {reports.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-xs)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{TARGET_LABELS[r.targetType]}</Badge>
                  <span className="text-sm text-muted-foreground">par {r.reporter.email}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString("fr-FR")}</span>
              </div>
              <p className="mt-3 text-sm">{r.reason}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">Cible : {r.targetId}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={notes[r.id] ?? ""}
                  onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                  placeholder="Note interne (optionnel)"
                  className="sm:flex-1"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => resolve(r.id, "traite")} disabled={busyId === r.id}>
                    Marquer traité
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => resolve(r.id, "rejete")}
                    disabled={busyId === r.id}
                  >
                    Rejeter
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

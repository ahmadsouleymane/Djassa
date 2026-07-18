import { useEffect, useState } from "react";
import { Users, Download } from "lucide-react";
import { adminApi, type WaitlistSignup } from "@/api/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

function toCsv(signups: WaitlistSignup[]): string {
  const header = "Prenom,Nom,Email,Date d'inscription";
  const rows = signups.map((s) =>
    [s.firstName, s.lastName, s.email, new Date(s.createdAt).toISOString()]
      .map((field) => `"${field.replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header, ...rows].join("\n");
}

function downloadCsv(signups: WaitlistSignup[]) {
  const blob = new Blob([toCsv(signups)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `djassa-liste-attente-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminWaitlist() {
  usePageTitle("Liste d'attente");
  const [signups, setSignups] = useState<WaitlistSignup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi
      .waitlist()
      .then((res) => setSignups(res.signups))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AdminShell>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-muted-foreground">
          {isLoading ? "Chargement…" : `${signups.length} inscrit${signups.length > 1 ? "s" : ""}`}
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={signups.length === 0}
          onClick={() => downloadCsv(signups)}
        >
          <Download className="size-4" /> Exporter en CSV
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="mt-4 h-64 rounded-2xl" />
      ) : signups.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-accent text-primary">
            <Users className="size-7" />
          </span>
          <p className="text-muted-foreground">Personne sur la liste d'attente pour l'instant.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-xs)]">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3">Prénom</th>
                <th className="px-5 py-3">Nom</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">{s.firstName}</td>
                  <td className="px-5 py-3">{s.lastName}</td>
                  <td className="px-5 py-3 font-mono text-[0.8rem] text-muted-foreground">{s.email}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(s.createdAt).toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

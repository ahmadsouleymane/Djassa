import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, ShoppingBag, Wallet, ShieldAlert, Flag, Eye } from "lucide-react";
import { adminApi, type AdminOverview as AdminOverviewData, type AnalyticsSeriesPoint } from "@/api/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatFcfa } from "@/lib/utils";

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-semibold tabular">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminOverview() {
  usePageTitle("Vue d'ensemble admin");
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [series, setSeries] = useState<AnalyticsSeriesPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.overview(), adminApi.analyticsSeries(14)])
      .then(([overview, seriesRes]) => {
        setData(overview);
        setSeries(seriesRes.series);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <AdminShell>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </AdminShell>
    );
  }

  const totalUsers = Object.values(data.users.byAccountType).reduce((a, b) => a + b, 0);

  return (
    <AdminShell>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Utilisateurs" value={String(totalUsers)} icon={Users} />
        <StatTile label="Revenu commission (30j)" value={formatFcfa(data.orders.commissionRevenue30d)} icon={Wallet} />
        <StatTile label="Visiteurs (7j)" value={String(data.visitors7d.totalVisitors)} icon={Eye} />
        <StatTile label="Litiges ouverts" value={String(data.openDisputes)} icon={ShieldAlert} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Trafic (14 jours)</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Area type="monotone" dataKey="pageviews" name="Pages vues" stroke="var(--chart-1)" strokeWidth={2} fill="url(#visitorsGradient)" />
                <Area type="monotone" dataKey="sessions" name="Sessions" stroke="var(--chart-3)" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>À traiter</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 pb-6">
            <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground"><ShieldAlert className="size-4" /> Vérifications en attente</span>
              <span className="font-semibold tabular">{data.pendingVerifications}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground"><ShoppingBag className="size-4" /> Litiges ouverts</span>
              <span className="font-semibold tabular">{data.openDisputes}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground"><Flag className="size-4" /> Signalements ouverts</span>
              <span className="font-semibold tabular">{data.openReports}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Erreurs (7j)</span>
              <span className="font-semibold tabular">{data.visitors7d.totalErrors}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Durée moy. session</span>
              <span className="font-semibold tabular">{data.visitors7d.avgSessionDurationSeconds}s</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs par type</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pb-6">
            {Object.entries(data.users.byAccountType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                <span className="text-muted-foreground capitalize">{type}</span>
                <span className="font-semibold tabular">{count}</span>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Nouveaux (30j)</span>
              <span className="font-semibold tabular">{data.users.new30d}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commandes par statut</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pb-6">
            {Object.entries(data.orders.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{status}</span>
                <span className="font-semibold tabular">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

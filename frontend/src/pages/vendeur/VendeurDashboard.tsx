import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Wallet,
  Package,
  TrendingUp,
  Truck,
  LayoutGrid,
  MessageCircle,
  Search,
} from "lucide-react";
import { ordersApi, type VendorStats } from "@/api/orders";
import { ShipOrderDialog } from "@/components/orders/ShipOrderDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatFcfa } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  en_attente_paiement: "En attente",
  paye: "Payées",
  expedie: "Expédiées",
  confirme: "Confirmées",
  en_litige: "En litige",
  rembourse: "Remboursées",
};

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

const QUICK_LINKS = [
  { to: "/catalogue", label: "Mes produits & promotions", icon: LayoutGrid },
  { to: "/messagerie", label: "Messagerie", icon: MessageCircle },
  { to: "/vendeur/recherche", label: "Recherche produits", icon: Search },
];

export function VendeurDashboard() {
  usePageTitle("Tableau de bord vendeur", { description: "Vue d'ensemble de ton activité de vente sur Djassa." });
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function reload() {
    ordersApi
      .vendorStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">Tableau de bord</h1>
        <p className="mt-1 text-muted-foreground">
          Vue d'ensemble de ton activité de vente sur les 30 derniers jours.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Revenu (30j)" value={formatFcfa(stats.revenue30d)} icon={Wallet} />
        <StatTile label="Commandes totales" value={String(stats.totalOrders)} icon={Package} />
        <StatTile label="Panier moyen" value={formatFcfa(stats.averageOrderValue)} icon={TrendingUp} />
        <StatTile label="Colis à expédier" value={String(stats.pendingShipments.length)} icon={Truck} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenu net (30 jours)</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueSeries} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="day"
                  tickFormatter={(d: string) => d.slice(5)}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  formatter={(value) => formatFcfa(Number(value))}
                  labelFormatter={(d) => String(d)}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commandes par statut</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 pb-6">
            {Object.entries(stats.byStatus).length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune commande pour l'instant.</p>
            )}
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{STATUS_LABELS[status] ?? status}</span>
                <span className="font-semibold tabular">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Meilleurs produits</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Pas encore de vente.</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="title"
                      width={110}
                      tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(t: string) => (t.length > 16 ? `${t.slice(0, 16)}…` : t)}
                    />
                    <Tooltip formatter={(value) => formatFcfa(Number(value))} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                    <Bar dataKey="revenue" fill="var(--chart-3)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>À expédier</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pb-6">
            {stats.pendingShipments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Rien à expédier pour le moment.</p>
            ) : (
              stats.pendingShipments.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {s.photo && <img src={s.photo} alt="" className="size-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{s.productTitle}</p>
                    <p className="text-xs text-muted-foreground">{formatFcfa(s.price)}</p>
                  </div>
                  <ShipOrderDialog
                    orderId={s.id}
                    onShipped={reload}
                    trigger={
                      <Button size="sm" variant="secondary">
                        <Truck className="size-4" /> Expédier
                      </Button>
                    }
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 no-underline transition-colors hover:bg-secondary/60"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-foreground">
              <link.icon className="size-4.5" />
            </span>
            <span className="text-sm font-medium text-foreground">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

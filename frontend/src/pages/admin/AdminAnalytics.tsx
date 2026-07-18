import { useEffect, useState } from "react";
import { Monitor, Smartphone, Tablet, Globe2, AlertTriangle } from "lucide-react";
import {
  adminApi,
  type TopPage,
  type DeviceBreakdown,
  type CountryBreakdown,
  type AnalyticsErrorEvent,
} from "@/api/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

const DEVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

export function AdminAnalytics() {
  usePageTitle("Analytics visiteurs");
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [exitPages, setExitPages] = useState<TopPage[]>([]);
  const [devices, setDevices] = useState<DeviceBreakdown[]>([]);
  const [countries, setCountries] = useState<CountryBreakdown[]>([]);
  const [errors, setErrors] = useState<AnalyticsErrorEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.analyticsPages(7),
      adminApi.analyticsExitPages(7),
      adminApi.analyticsDevices(7),
      adminApi.analyticsCountries(7),
      adminApi.analyticsErrors(1),
    ])
      .then(([pages, exits, dev, ctr, errs]) => {
        setTopPages(pages.pages);
        setExitPages(exits.pages);
        setDevices(dev.devices);
        setCountries(ctr.countries);
        setErrors(errs.items);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <AdminShell>
        <Skeleton className="h-72 rounded-2xl" />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pages les plus visitées</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pb-6">
            {topPages.length === 0 && <p className="text-sm text-muted-foreground">Pas encore de données.</p>}
            {topPages.map((p) => (
              <div key={p.path} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                <span className="truncate font-mono text-xs">{p.path}</span>
                <span className="font-semibold tabular">{p.views}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pages de sortie</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pb-6">
            {exitPages.length === 0 && <p className="text-sm text-muted-foreground">Pas encore de données.</p>}
            {exitPages.map((p) => (
              <div key={p.path} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                <span className="truncate font-mono text-xs">{p.path}</span>
                <span className="font-semibold tabular">{p.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appareils</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pb-6">
            {devices.map((d) => {
              const Icon = DEVICE_ICONS[d.deviceType] ?? Monitor;
              return (
                <div key={d.deviceType} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground capitalize">
                    <Icon className="size-4" /> {d.deviceType}
                  </span>
                  <span className="font-semibold tabular">{d.count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Localisation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pb-6">
            {countries.length === 0 && <p className="text-sm text-muted-foreground">Pas encore de données.</p>}
            {countries.map((c) => (
              <div key={c.country} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Globe2 className="size-4" /> {c.country ?? "Inconnu"}
                </span>
                <span className="font-semibold tabular">{c.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4.5 text-destructive" /> Journal d'erreurs récentes
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          {errors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune erreur enregistrée récemment.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {errors.map((e) => (
                <li key={e.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-destructive">{e.message ?? "Erreur inconnue"}</span>
                    <span className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString("fr-FR")}</span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{e.path}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {e.session.deviceType ?? "?"} · {e.session.browser ?? "?"} · {e.session.os ?? "?"} · {e.session.country ?? "?"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}

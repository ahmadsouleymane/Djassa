import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import { referralApi, type ReferralStats } from "@/api/referrals";
import { StatusBadge } from "@/components/referrals/StatusBadge";
import { ReferralStatsCards } from "@/components/referrals/ReferralStats";
import { ShareLink } from "@/components/referrals/ShareLink";
import { WalletCard } from "@/components/referrals/WalletCard";
import { ProgramExplainer } from "@/components/referrals/ProgramExplainer";
import { ContentGallery } from "@/components/referrals/ContentGallery";
import { Leaderboard } from "@/components/referrals/Leaderboard";

const LEVEL_MIN: Record<string, number> = { kpata: 1, boss: 5, grand_choco: 15 };

function computeProgress(level: string, conversions: number): number {
  if (level === "grand_choco") return 100;
  const nextLevels: Record<string, string> = { nouvo: "kpata", kpata: "boss", boss: "grand_choco" };
  const next = nextLevels[level];
  if (!next) return 100;
  const min = LEVEL_MIN[next] ?? 1;
  // On calcule la progression depuis le palier précédent
  const prevMin = LEVEL_MIN[level] ?? 0;
  const range = min - prevMin;
  const progress = ((conversions - prevMin) / range) * 100;
  return Math.min(100, Math.max(0, progress));
}

export function Parrainage() {
  usePageTitle("Gaou Check — Parrainage", {
    description:
      "Parraine tes amis sur Djassa et gagne du crédit. Affiches, QR code et messages prêts à partager.",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isWelcome = searchParams.get("welcome") === "1";
  const nextDestination = searchParams.get("next") || "/marche";

  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function dismissWelcome() {
    const params = new URLSearchParams(searchParams);
    params.delete("welcome");
    params.delete("next");
    setSearchParams(params, { replace: true });
  }

  function reload() {
    setIsLoading(true);
    setError(null);
    Promise.all([referralApi.getCode(), referralApi.getStats()])
      .then(([codeRes, statsRes]) => {
        setCode(codeRes.code);
        setStats(statsRes);
      })
      .catch(() => setError("Impossible de charger tes données de parrainage."))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">{error ?? "Une erreur est survenue."}</p>
        <Button variant="outline" onClick={reload}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Hero de bienvenue (juste après inscription) */}
      {isWelcome && (
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 sm:p-7">
          <button
            type="button"
            onClick={dismissWelcome}
            aria-label="Fermer"
            className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted"
          >
            <X className="size-4" />
          </button>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Bienvenue sur Djassa 🎉
          </p>
          <h2 className="mt-1.5 text-2xl font-semibold sm:text-3xl">
            Ton compte est prêt. Et si tu gagnais de l'argent avec nous ?
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Invite tes amis et des vendeurs, touche une commission sur ce qu'ils font, et retire
            ton argent quand tu veux. Découvre comment juste en dessous 👇
          </p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(nextDestination)}>
            Continuer vers Djassa
            <ArrowRight className="ml-1.5 size-4" />
          </Button>
        </div>
      )}

      {/* Header */}
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">Gaou Check</h1>
        <p className="mt-1 text-muted-foreground">
          Parraine tes amis et gagne du crédit DJASSA à chaque premier achat.
        </p>
      </header>

      {/* Présentation du programme + exemples */}
      <ProgramExplainer />

      {/* Statut + progression */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusBadge level={stats.level} />
        {stats.nextThreshold && (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              <strong>{stats.nextThreshold.needed}</strong> conversion
              {stats.nextThreshold.needed > 1 ? "s" : ""} restante
              {stats.nextThreshold.needed > 1 ? "s" : ""} pour devenir{" "}
              <strong>{stats.nextThreshold.nextLevel === "kpata" ? "Kpata" : stats.nextThreshold.nextLevel === "boss" ? "Boss" : "Grand Choco"}</strong>
            </p>
            <Progress value={computeProgress(stats.level, stats.conversions)} className="h-2 w-32" />
          </div>
        )}
      </div>

      {/* Stats */}
      <ReferralStatsCards stats={stats} />

      {/* Lien + QR */}
      {code && <ShareLink code={code} />}

      {/* Cagnotte + retrait Mobile Money */}
      <WalletCard onChange={reload} />

      {/* Galerie de contenu */}
      <ContentGallery
        currentLevel={stats.level}
        code={code ?? ""}
        count={stats.conversions}
      />

      {/* Classement */}
      <Leaderboard />
    </div>
  );
}

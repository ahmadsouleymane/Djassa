import { useEffect, useState } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { reviewsApi, type TrustScore } from "../api/reviews";
import { cn } from "@/lib/utils";

export function TrustBadge({
  vendorId,
  className,
}: {
  vendorId: string;
  className?: string;
}) {
  const [trust, setTrust] = useState<TrustScore | null>(null);

  useEffect(() => {
    let active = true;
    reviewsApi
      .trustScore(vendorId)
      .then((t) => active && setTrust(t))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [vendorId]);

  if (!trust) return null;

  // Sans historique (aucune vente confirmée, aucun avis), le score par défaut
  // vaut 100 mais ne veut rien dire : on affiche « Nouveau » plutôt qu'un chiffre
  // trompeur. Le score chiffré n'apparaît que lorsqu'il est mérité.
  const hasTrack = trust.salesCount > 0 || trust.reviewCount > 0;

  if (!hasTrack) {
    return (
      <span
        title="Vendeur vérifié · pas encore d'historique de ventes"
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[0.7rem] font-bold text-muted-foreground",
          className,
        )}
      >
        <Sparkles className="size-3" />
        Nouveau
      </span>
    );
  }

  const tone =
    trust.score >= 70
      ? "bg-accent text-accent-foreground"
      : trust.score >= 40
        ? "bg-[#fbf0dc] text-[#8a5a0b]"
        : "bg-[#fbe3e1] text-[#a51f1f]";

  return (
    <span
      title={`Indice de confiance ${trust.score}/100 · ${trust.salesCount} vente${trust.salesCount > 1 ? "s" : ""} confirmée${trust.salesCount > 1 ? "s" : ""}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-bold tabular",
        tone,
        className,
      )}
    >
      <ShieldCheck className="size-3" />
      {trust.score}
    </span>
  );
}

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
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

  const tone =
    trust.score >= 70
      ? "bg-accent text-accent-foreground"
      : trust.score >= 40
        ? "bg-[#fbf0dc] text-[#8a5a0b]"
        : "bg-[#fbe3e1] text-[#a51f1f]";

  return (
    <span
      title={`Indice de confiance ${trust.score}/100`}
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

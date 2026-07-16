import { useEffect, useState } from "react";
import { reviewsApi, type TrustScore } from "../api/reviews";

export function TrustBadge({ vendorId }: { vendorId: string }) {
  const [trust, setTrust] = useState<TrustScore | null>(null);

  useEffect(() => {
    reviewsApi.trustScore(vendorId).then(setTrust);
  }, [vendorId]);

  if (!trust) return null;

  const tone = trust.score >= 70 ? "stamp-accent" : trust.score >= 40 ? "stamp-warning" : "stamp-danger";

  return (
    <span className={`stamp-sm ${tone}`} title={`Confiance ${trust.score}/100`}>
      {trust.score}
    </span>
  );
}

import { useEffect, useState } from "react";
import { reviewsApi, type TrustScore } from "../api/reviews";

export function TrustBadge({ vendorId }: { vendorId: string }) {
  const [trust, setTrust] = useState<TrustScore | null>(null);

  useEffect(() => {
    reviewsApi.trustScore(vendorId).then(setTrust);
  }, [vendorId]);

  if (!trust) return null;

  return <span>Confiance : {trust.score}/100</span>;
}

import { useEffect, useState } from "react";
import { Crown, Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { referralApi, type LeaderboardEntry } from "@/api/referrals";

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="size-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="size-5 text-slate-400" />;
  if (rank === 3) return <Medal className="size-5 text-amber-600" />;
  return <span className="text-sm font-semibold text-muted-foreground">{rank}</span>;
}

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    referralApi
      .getLeaderboard()
      .then((res) => setData(res.leaderboard))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">🏆 Classement des parrains</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">#</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Parrain</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Filleuls</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry) => (
                  <tr key={entry.rank} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">
                      <RankIcon rank={entry.rank} />
                    </td>
                    <td className="px-4 py-2.5 font-medium">{entry.referrerName}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{entry.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Sois le premier parrain ! Partage ton code pour apparaître ici.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

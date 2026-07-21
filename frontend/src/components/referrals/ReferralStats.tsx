import { Users, ShoppingCart, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFcfa } from "@/lib/utils";
import type { ReferralStats } from "@/api/referrals";

export function ReferralStatsCards({ stats }: { stats: ReferralStats }) {
  const cards = [
    {
      icon: Users,
      title: "Filleuls",
      value: String(stats.totalReferrals),
      subtitle: `${stats.conversions} converti${stats.conversions > 1 ? "s" : ""}`,
    },
    {
      icon: ShoppingCart,
      title: "Conversions",
      value: String(stats.conversions),
      subtitle: `${stats.rewardedConversions} récompensé${stats.rewardedConversions > 1 ? "s" : ""}`,
    },
    {
      icon: CreditCard,
      title: "Crédit gagné",
      value: formatFcfa(stats.totalEarnings),
      subtitle: "Utilisable sur Djassa",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <card.icon className="size-4" />
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

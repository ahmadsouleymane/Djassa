import { UserPlus, Store, Wallet, Trophy, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Présentation du programme partenaire (Gaou Check).
 * Explique les deux façons de gagner + exemples concrets de gains.
 * Chiffres alignés sur la règle : le parrain touche 70% de la marge nette Djassa.
 */
export function ProgramExplainer() {
  return (
    <section className="flex flex-col gap-6">
      {/* Intro */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-5 sm:p-6">
        <h2 className="text-xl font-semibold sm:text-2xl">Gagne de l'argent avec Djassa 💰</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Pas besoin de vendre quoi que ce soit. Tu partages ton lien, et tu touches une
          commission réelle sur ce que font les gens que tu ramènes. Ta cagnotte, tu la dépenses
          sur Djassa ou tu la retires en cash.
        </p>
      </div>

      {/* Les 2 façons de gagner */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/70">
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus className="size-5" />
            </div>
            <h3 className="text-base font-semibold">① Tu amènes un acheteur</h3>
            <p className="text-sm text-muted-foreground">
              Ton filleul s'inscrit avec ton lien et fait son <strong>premier achat</strong>.
              Tu gagnes une commission, une fois.
            </p>
            <ul className="mt-1 space-y-1 text-sm">
              <li className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Il achète 10 000 F</span>
                <span className="font-semibold text-primary">tu gagnes 210 F</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Il achète 20 000 F</span>
                <span className="font-semibold text-primary">tu gagnes 490 F</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Il achète 50 000 F</span>
                <span className="font-semibold text-primary">tu gagnes 1 330 F</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-primary/40">
          <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
            Le vrai gain 💥
          </span>
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Store className="size-5" />
            </div>
            <h3 className="text-base font-semibold">② Tu amènes un vendeur</h3>
            <p className="text-sm text-muted-foreground">
              Tu touches une commission sur <strong>toutes ses ventes</strong> pendant ses{" "}
              <strong>30 premiers jours</strong>. Pas une fois : chaque vente te rapporte.
            </p>
            <ul className="mt-1 space-y-1 text-sm">
              <li className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Il vend un article 50 000 F</span>
                <span className="font-semibold text-primary">tu gagnes 1 330 F</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">300 000 F de ventes / mois</span>
                <span className="font-semibold text-primary">≈ 7 000 F</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Cagnotte & retrait */}
      <Card className="border-border/70">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold">Ta cagnotte, ton argent</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tous tes gains s'accumulent au même endroit. Utilise-les sur tes achats, ou{" "}
              <strong>retire-les en cash</strong> sur Wave, Orange Money ou MTN — à tout moment,
              dès <strong>500 F</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grades */}
      <div className="rounded-2xl border border-border/70 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="size-5 text-primary" />
          <h3 className="text-base font-semibold">Plus tu invites, plus tu montes en grade</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="font-semibold">🥉 Kpata</p>
            <p className="text-sm text-muted-foreground">1 à 4 filleuls</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="font-semibold">🥈 Boss</p>
            <p className="text-sm text-muted-foreground">5 à 14 filleuls</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="font-semibold">🥇 Grand Choco</p>
            <p className="text-sm text-muted-foreground">15+ — le patron du djassa</p>
          </div>
        </div>
      </div>

      {/* Rappel étapes */}
      <div className="flex flex-col gap-2 rounded-2xl bg-primary/5 p-5 text-sm sm:flex-row sm:items-center sm:justify-center sm:gap-4">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
          Partage ton lien
        </span>
        <ArrowRight className="hidden size-4 text-muted-foreground sm:block" />
        <span className="flex items-center gap-1.5 font-medium">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
          Ton monde s'inscrit
        </span>
        <ArrowRight className="hidden size-4 text-muted-foreground sm:block" />
        <span className="flex items-center gap-1.5 font-medium">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">3</span>
          Ta cagnotte se remplit
        </span>
      </div>
    </section>
  );
}

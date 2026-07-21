import { PosterTemplate } from "./PosterTemplate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import type { ReferralLevel } from "@/api/referrals";

const LEVELS: ReferralLevel[] = ["nouvo", "kpata", "boss", "grand_choco"];

const LEVEL_ORDER: Record<ReferralLevel, number> = {
  nouvo: 0,
  kpata: 1,
  boss: 2,
  grand_choco: 3,
};

const LEVEL_LABELS: Record<ReferralLevel, string> = {
  nouvo: "Nouvo",
  kpata: "Kpata",
  boss: "Boss",
  grand_choco: "Grand Choco",
};

type Props = {
  currentLevel: ReferralLevel;
  code: string;
  count: number;
};

/**
 * Galerie de contenu viral. Les niveaux supérieurs à `currentLevel` sont
 * affichés comme verrouillés. Le niveau courant est sélectionné par défaut.
 */
export function ContentGallery({ currentLevel, code, count }: Props) {
  if (!code) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Contenu à partager</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Génère ton lien de parrainage pour débloquer du contenu à partager sur tes réseaux.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentOrder = LEVEL_ORDER[currentLevel];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Affiches & messages à partager</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={currentLevel}>
          <TabsList className="flex-wrap">
            {LEVELS.map((level) => {
              const isUnlocked = LEVEL_ORDER[level] <= currentOrder;
              return (
                <TabsTrigger key={level} value={level} disabled={!isUnlocked} className="gap-1.5">
                  {LEVEL_LABELS[level]}
                  {!isUnlocked && <Lock className="size-3" />}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {LEVELS.map((level) => {
            const isUnlocked = LEVEL_ORDER[level] <= currentOrder;
            return (
              <TabsContent key={level} value={level} className="mt-4">
                {isUnlocked ? (
                  <PosterTemplate level={level} code={code} count={count} />
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    <Lock className="mr-1 inline size-3" />
                    Ce contenu sera débloqué quand tu atteindras le niveau <Badge variant="outline" className="mx-1 font-semibold">{LEVEL_LABELS[level]}</Badge>
                  </p>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}

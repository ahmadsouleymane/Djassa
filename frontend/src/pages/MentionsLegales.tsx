import { Prose } from "@/components/site/Prose";
import { Badge } from "@/components/ui/badge";
import { usePageTitle } from "@/hooks/usePageTitle";

export function MentionsLegales() {
  usePageTitle("Mentions légales", {
    description:
      "Mentions légales du site Djassa : éditeur, hébergement et propriété intellectuelle.",
  });

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-2">
        <h1 className="text-3xl font-semibold md:text-4xl">Mentions légales</h1>
      </header>
      <p className="mb-8 text-sm text-muted-foreground">
        Dernière mise à jour : à compléter à la mise en production
      </p>

      <Prose>
        <h2>Éditeur du site</h2>
        <p>
          Le site Djassa est édité par <strong>Djassa</strong>.
        </p>
        <ul>
          <li>
            Forme juridique et numéro RCCM : <Badge variant="warning">à compléter</Badge>
          </li>
          <li>
            Siège social : <Badge variant="warning">à compléter</Badge>, Abidjan,
            Côte d'Ivoire
          </li>
          <li>
            Numéro de contribuable : <Badge variant="warning">à compléter</Badge>
          </li>
          <li>
            Email : support@djassa.net <Badge variant="warning">à compléter</Badge>
          </li>
          <li>
            Directeur de la publication : <Badge variant="warning">à compléter</Badge>
          </li>
        </ul>

        <h2>Hébergement</h2>
        <p>
          Le frontend est hébergé par Vercel Inc., et l'API et la base de données
          par le fournisseur d'infrastructure choisi pour l'environnement de
          production. Le détail exact (nom, adresse) sera précisé ici à la mise en
          production finale.
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          La marque Djassa, le logo, la charte graphique et l'ensemble des contenus
          du site (textes, structure, code) sont la propriété de l'éditeur, sauf
          mention contraire. Toute reproduction non autorisée est interdite.
        </p>

        <h2>Responsabilité</h2>
        <p>
          Djassa est un intermédiaire technique entre acheteurs et vendeurs. Les
          descriptions, photos et prix des produits sont fournis par les vendeurs
          sous leur seule responsabilité. Djassa vérifie l'identité des vendeurs
          mais ne contrôle pas physiquement les produits vendus avant expédition.
        </p>
      </Prose>
    </div>
  );
}

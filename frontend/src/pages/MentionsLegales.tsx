import { Prose } from "@/components/site/Prose";
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
        Dernière mise à jour : 20 juillet 2026
      </p>

      <Prose>
        <h2>Éditeur du site</h2>
        <p>
          Le site Djassa est édité par <strong>Ahmad Souleymane</strong>.
        </p>
        <ul>
          <li>
            Siège social : Yamoussoukro, Côte d'Ivoire
          </li>
          <li>
            Téléphone : +225 01 60 72 63 14
          </li>
          <li>
            Email : contact@djassa.shop
          </li>
          <li>
            Directeur de la publication : Ahmad Souleymane
          </li>
        </ul>

        <h2>Hébergement</h2>
        <p>
          Le frontend est hébergé par Vercel Inc. (340 S Lemon Ave, Walnut, CA 91789, États-Unis)
          et l'API ainsi que la base de données par Render Services Inc.
          (San Francisco, CA, États-Unis).
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

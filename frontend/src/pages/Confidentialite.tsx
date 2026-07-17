import { Link } from "react-router-dom";
import { Prose } from "@/components/site/Prose";
import { Badge } from "@/components/ui/badge";
import { usePageTitle } from "@/hooks/usePageTitle";

export function Confidentialite() {
  usePageTitle("Politique de confidentialité", {
    description:
      "Comment Djassa collecte, utilise et protège les données personnelles des acheteurs et vendeurs.",
  });

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-2">
        <h1 className="text-3xl font-semibold md:text-4xl">
          Politique de confidentialité
        </h1>
      </header>
      <p className="mb-8 text-sm text-muted-foreground">
        Dernière mise à jour : à compléter à la mise en production
      </p>

      <Prose>
        <h2>Données collectées</h2>
        <p>Djassa collecte les données nécessaires au fonctionnement du marché :</p>
        <ul>
          <li>Email et mot de passe (chiffré) à l'inscription</li>
          <li>Type de compte (acheteur ou vendeur)</li>
          <li>Pièce d'identité téléversée pour la vérification vendeur</li>
          <li>Historique de messagerie, offres et commandes</li>
          <li>Photos de produits téléversées par les vendeurs</li>
        </ul>

        <h2>Pourquoi ces données</h2>
        <p>
          Ces informations servent uniquement à faire fonctionner la plateforme :
          authentification, mise en relation acheteur/vendeur, suivi de commande,
          vérification d'identité et calcul du score de confiance affiché sur les
          fiches produit. Aucune donnée n'est vendue à des tiers.
        </p>

        <h2>Pièces d'identité</h2>
        <p>
          Les documents soumis pour la vérification vendeur sont stockés de façon
          sécurisée et consultés uniquement par l'équipe chargée d'approuver ou de
          rejeter les demandes. Ils ne sont jamais affichés publiquement.
        </p>

        <h2>Conservation</h2>
        <p>
          Les données de compte sont conservées tant que le compte est actif. En
          cas de suppression de compte, les données sont supprimées ou anonymisées
          dans un délai raisonnable, sauf obligation légale de conservation
          (notamment comptable) plus longue.
        </p>

        <h2>Partage avec des tiers</h2>
        <p>
          Certaines données transitent par des prestataires techniques
          nécessaires au service : hébergement des photos (Cloudinary),
          prestataire de paiement, et infrastructure d'hébergement de
          l'application. Ces prestataires n'ont accès qu'aux données strictement
          nécessaires à leur fonction.
        </p>

        <h2>Tes droits</h2>
        <p>
          Tu peux demander l'accès, la correction ou la suppression de tes données
          personnelles en écrivant à support@djassa.ci{" "}
          <Badge variant="warning">à compléter</Badge>, ou via la page{" "}
          <Link to="/contact">Contact</Link>.
        </p>
      </Prose>
    </div>
  );
}

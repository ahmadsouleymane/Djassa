import { Link } from "react-router-dom";
import { Prose } from "@/components/site/Prose";
import { usePageTitle } from "@/hooks/usePageTitle";

export function CGU() {
  usePageTitle("Conditions générales d'utilisation", {
    description:
      "Conditions générales d'utilisation de Jassa : compte, commandes, séquestre, commission et résiliation.",
  });

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-2">
        <h1 className="text-3xl font-semibold md:text-4xl">
          Conditions générales d'utilisation
        </h1>
      </header>
      <p className="mb-8 text-sm text-muted-foreground">
        Dernière mise à jour : à compléter à la mise en production
      </p>

      <Prose>
        <h2>1. Objet</h2>
        <p>
          Les présentes conditions régissent l'utilisation de la plateforme
          Jassa, un marché en ligne mettant en relation des acheteurs et des
          vendeurs particuliers ou professionnels en Côte d'Ivoire, avec un
          mécanisme de paiement séquestré décrit sur la page{" "}
          <Link to="/comment-ca-marche">Comment ça marche</Link>.
        </p>

        <h2>2. Création de compte</h2>
        <p>
          L'inscription se fait avec une adresse email et un mot de passe. Un
          compte est créé en tant qu'acheteur ou vendeur. Un compte vendeur ne
          peut publier de produits visibles publiquement qu'après vérification
          d'identité, comme décrit à l'article 5.
        </p>

        <h2>3. Commandes et paiement séquestré</h2>
        <p>
          Une commande naît de l'acceptation, par le vendeur, d'une offre de prix
          envoyée par l'acheteur dans la messagerie. Le paiement de l'acheteur
          est alors bloqué sous séquestre par Jassa. Le vendeur dispose de 72
          heures pour expédier la commande ; à défaut, la commande est annulée et
          l'acheteur intégralement remboursé.
        </p>
        <p>
          L'acheteur dispose de 7 jours à réception pour confirmer la commande ou
          ouvrir un litige. La confirmation, explicite ou automatique à
          l'expiration du délai, déclenche le versement du montant au vendeur,
          déduction faite de la commission de la plateforme.
        </p>

        <h2>4. Commission</h2>
        <p>
          Jassa prélève une commission de 5% du montant de chaque commande
          confirmée pour les comptes vendeur au palier Standard, réduite à 3%
          pour les comptes au palier Pro (abonnement de 7 000 FCFA par mois,
          décrit sur la page <Link to="/abonnement">Abonnement</Link>).
        </p>

        <h2>5. Vérification vendeur</h2>
        <p>
          Tout compte vendeur doit soumettre une pièce d'identité valide via la
          page <Link to="/verification">Vérification</Link>. Jassa se réserve le
          droit d'approuver, rejeter ou révoquer une vérification à tout moment en
          cas de doute sur l'authenticité des documents fournis ou de comportement
          frauduleux constaté.
        </p>

        <h2>6. Litiges</h2>
        <p>
          En cas de désaccord sur une commande (produit non conforme, non reçu,
          etc.), l'acheteur ou le vendeur peut ouvrir un litige avant confirmation
          de réception. Le montant séquestré reste bloqué jusqu'à résolution du
          litige par l'équipe Jassa.
        </p>

        <h2>7. Contenus et annonces</h2>
        <p>
          Chaque vendeur est seul responsable de l'exactitude des titres,
          descriptions, prix et photos qu'il publie. Jassa peut retirer une
          annonce non conforme (produit interdit, contenu trompeur, contrefaçon)
          sans préavis.
        </p>

        <h2>8. Résiliation</h2>
        <p>
          Un utilisateur peut cesser d'utiliser Jassa à tout moment. Jassa peut
          suspendre ou clôturer un compte en cas de manquement grave aux présentes
          conditions, notamment en cas de fraude avérée ou de non-respect répété
          des délais d'expédition.
        </p>

        <h2>9. Droit applicable</h2>
        <p>Les présentes conditions sont soumises au droit ivoirien.</p>
      </Prose>
    </div>
  );
}

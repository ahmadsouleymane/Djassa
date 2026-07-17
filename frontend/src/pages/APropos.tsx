import { Link } from "react-router-dom";
import { Prose } from "@/components/site/Prose";
import { usePageTitle } from "@/hooks/usePageTitle";

export function APropos() {
  usePageTitle("À propos de Djassa", {
    description:
      "Djassa est un marché en ligne pensé pour la Côte d'Ivoire, où chaque commande est protégée par un paiement séquestré jusqu'à confirmation de réception.",
  });

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold md:text-4xl">À propos de Djassa</h1>
        <p className="mt-1 text-muted-foreground">
          Un marché en ligne pensé pour un problème très concret : la confiance
          entre acheteurs et vendeurs.
        </p>
      </header>

      <Prose>
        <h2>Pourquoi Djassa existe</h2>
        <p>
          Acheter en ligne en Côte d'Ivoire passe encore très souvent par des
          messages WhatsApp, des virements avant livraison et beaucoup d'espoir
          que tout se passe bien. Quand un vendeur ne livre pas, ou qu'un
          acheteur ne paie jamais après avoir négocié, il n'y a en général aucun
          recours. Djassa a été construit pour retirer ce risque : l'argent ne
          change de mains qu'après que la commande soit réellement arrivée.
        </p>

        <h2>Comment ça fonctionne concrètement</h2>
        <p>
          Chaque commande passée sur Djassa suit le même chemin : l'acheteur
          négocie avec le vendeur dans la messagerie, l'offre acceptée déclenche
          un paiement séquestré, le vendeur a 72 heures pour expédier, puis
          l'acheteur a 7 jours pour confirmer la réception. C'est cette
          confirmation (ou l'expiration du délai) qui libère l'argent au vendeur.
          Le détail complet est sur la page{" "}
          <Link to="/comment-ca-marche">Comment ça marche</Link>.
        </p>

        <h2>Des vendeurs vérifiés, pas anonymes</h2>
        <p>
          Avant qu'un compte vendeur puisse publier sur le marché, il doit
          soumettre une pièce d'identité qui est examinée manuellement. Ce n'est
          pas une formalité décorative : c'est ce qui permet à un acheteur de
          commander sans avoir à vérifier lui-même qui se trouve de l'autre côté
          de la conversation.
        </p>

        <h2>Où on en est</h2>
        <p>
          Djassa est en développement actif à partir d'Abidjan, avec une priorité
          claire : d'abord un flux d'achat fiable, ensuite tout le reste. Les
          retours des premiers acheteurs et vendeurs orientent directement ce qui
          est construit ensuite.
        </p>

        <h2>Une question ?</h2>
        <p>
          La page <Link to="/contact">Contact</Link> et la{" "}
          <Link to="/faq">FAQ</Link> répondent aux questions les plus courantes
          sur les commandes, les remboursements et la vérification vendeur.
        </p>
      </Prose>
    </div>
  );
}

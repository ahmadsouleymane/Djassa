import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { usePageTitle } from "@/hooks/usePageTitle";

type FaqEntry = { question: string; answer: ReactNode };

const FAQS: FaqEntry[] = [
  {
    question: "Quand est-ce que je paie réellement le vendeur ?",
    answer: (
      <>
        Jamais directement. Ton paiement est mis sous séquestre dès que la
        commande est créée, et il n'est versé au vendeur qu'après que tu
        confirmes avoir reçu ta commande, ou automatiquement après 7 jours si tu
        ne fais rien. Détails sur{" "}
        <Link to="/comment-ca-marche" className="font-semibold text-primary">
          Comment ça marche
        </Link>
        .
      </>
    ),
  },
  {
    question: "Le vendeur ne répond pas ou n'expédie pas, que se passe-t-il ?",
    answer:
      "Un vendeur a 72 heures pour expédier une commande une fois l'offre acceptée. Passé ce délai, la commande est automatiquement annulée et tu es remboursé intégralement, sans aucune démarche à faire.",
  },
  {
    question: "Comment savoir si un vendeur est fiable ?",
    answer:
      "Seuls les vendeurs dont l'identité a été vérifiée apparaissent sur le marché. En plus, chaque fiche produit affiche un score de confiance calculé sur l'historique du vendeur (taux de litiges, ponctualité d'expédition, réactivité) et les avis des acheteurs précédents.",
  },
  {
    question: "Le produit reçu ne correspond pas à l'annonce, que faire ?",
    answer: (
      <>
        Ouvre un litige depuis{" "}
        <Link to="/commandes" className="font-semibold text-primary">
          Mes commandes
        </Link>{" "}
        avant de confirmer la réception. Le paiement reste bloqué tant que le
        litige n'est pas tranché, il n'est jamais versé au vendeur
        automatiquement pendant cette période.
      </>
    ),
  },
  {
    question: "Combien coûte la vente sur Jassa ?",
    answer: (
      <>
        Une commission de 5% est prélevée sur chaque commande livrée et
        confirmée. En passant au plan{" "}
        <Link to="/abonnement" className="font-semibold text-primary">
          Pro
        </Link>{" "}
        (7 000 FCFA/mois), cette commission descend à 3% et ton profil est mis
        en avant sur le marché.
      </>
    ),
  },
  {
    question: "Que dois-je fournir pour devenir vendeur vérifié ?",
    answer: (
      <>
        Une pièce d'identité lisible (carte nationale d'identité, passeport ou
        permis de conduire), à soumettre depuis la page{" "}
        <Link to="/verification" className="font-semibold text-primary">
          Vérification
        </Link>
        . La revue est faite manuellement ; un statut Approuvée est nécessaire
        avant que tes produits soient visibles publiquement.
      </>
    ),
  },
  {
    question: "Puis-je négocier le prix affiché ?",
    answer:
      "Oui. Envoie un message au vendeur depuis la fiche produit et propose ton prix dans la conversation. La commande n'est créée qu'une fois que le vendeur accepte une offre précise.",
  },
  {
    question: "Comment modifier ou retirer un produit que je vends ?",
    answer: (
      <>
        Depuis ton{" "}
        <Link to="/catalogue" className="font-semibold text-primary">
          catalogue
        </Link>
        , chaque produit a un bouton Modifier et un bouton Retirer. Retirer un
        produit le supprime définitivement du marché.
      </>
    ),
  },
];

export function FAQ() {
  usePageTitle("Questions fréquentes", {
    description:
      "Réponses aux questions les plus courantes sur les commandes, le séquestre, les remboursements et la vérification vendeur sur Jassa.",
  });

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold md:text-4xl">Questions fréquentes</h1>
        <p className="mt-1 text-muted-foreground">
          Tout ce qu'on nous demande le plus souvent sur les commandes, les
          remboursements et la vente sur Jassa.
        </p>
      </header>

      <Accordion
        type="single"
        collapsible
        defaultValue="item-0"
        className="rounded-2xl border border-border bg-card px-5 shadow-[var(--shadow-xs)]"
      >
        {FAQS.map((faq, i) => (
          <AccordionItem key={faq.question} value={`item-${i}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <p className="mt-8 text-muted-foreground">
        Une question qui n'est pas ici ?{" "}
        <Link to="/contact" className="font-semibold text-primary">
          Contacte le support
        </Link>
        .
      </p>
    </div>
  );
}

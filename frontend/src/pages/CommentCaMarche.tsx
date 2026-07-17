import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquareText,
  Lock,
  PackageCheck,
  AlertTriangle,
  IdCard,
  Percent,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLandingMotion } from "@/hooks/useLandingMotion";

const JOURNEY = [
  {
    icon: MessageSquareText,
    n: "01",
    title: "Tu négocies dans la messagerie",
    body: (
      <>
        Tu contactes le vendeur depuis la fiche produit, tu discutes du prix si
        besoin, et tu envoies une offre. Rien n'est débité tant que le vendeur
        n'a pas accepté ton offre.
      </>
    ),
  },
  {
    icon: Lock,
    n: "02",
    title: "Ton paiement est séquestré",
    body: (
      <>
        Dès que l'offre est acceptée, la commande est créée et ton paiement est
        mis sous séquestre. Le vendeur a alors <strong>72 heures</strong> pour
        expédier, sinon la commande est annulée et tu es remboursé.
      </>
    ),
  },
  {
    icon: PackageCheck,
    n: "03",
    title: "Tu confirmes, le vendeur est payé",
    body: (
      <>
        À réception, tu as <strong>7 jours</strong> pour confirmer que tout est
        conforme. Cette confirmation libère l'argent au vendeur. Sans action de
        ta part, la réception est validée automatiquement passé ce délai.
      </>
    ),
  },
];

const SELLER = [
  {
    icon: IdCard,
    title: "Vérification d'identité",
    body: "Un compte vendeur soumet une pièce d'identité et doit être approuvé avant que ses produits n'apparaissent sur le marché.",
  },
  {
    icon: Percent,
    title: "Commission standard : 5%",
    body: "Sur chaque commande livrée et confirmée, Jassa prélève 5%. Le reste est versé au vendeur dès la confirmation.",
  },
  {
    icon: Sparkles,
    title: "Passer Pro : commission à 3%",
    body: (
      <>
        L'abonnement Pro (7 000 FCFA/mois) fait baisser la commission à 3%,
        ajoute un badge Pro et une mise en avant. Détails sur{" "}
        <Link to="/abonnement" className="font-semibold text-primary">
          Abonnement
        </Link>
        .
      </>
    ),
  },
];

export function CommentCaMarche() {
  usePageTitle("Comment ça marche : le séquestre Jassa expliqué", {
    description:
      "Comment fonctionne l'achat et la vente sur Jassa : négociation par messagerie, paiement séquestré, 72h de livraison et 7 jours pour confirmer la réception.",
  });
  const rootRef = useRef<HTMLDivElement>(null);
  useLandingMotion(rootRef);

  return (
    <div ref={rootRef} className="flex flex-col gap-14">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">Comment ça marche</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Sur Jassa, aucun paiement n'arrive directement dans la poche du
          vendeur. L'argent de l'acheteur reste séquestré par la plateforme
          jusqu'à ce que la commande soit confirmée reçue, ou remboursé
          automatiquement si quelque chose se passe mal.
        </p>
      </header>

      <section>
        <h2 className="mb-6 text-2xl font-semibold" data-reveal>
          De la négociation au dépôt final
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {JOURNEY.map((s, i) => (
            <div
              key={s.n}
              data-reveal
              data-reveal-delay={i * 0.08}
              className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-xs)]"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-xl bg-accent text-primary">
                  <s.icon className="size-6" />
                </span>
                <span className="font-mono text-sm font-semibold text-muted-foreground/60">
                  {s.n}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section data-reveal>
        <h2 className="mb-6 text-2xl font-semibold">Si ça tourne mal</h2>
        <div className="flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-xs)]">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#fbf0dc] text-[#8a5a0b]">
            <AlertTriangle className="size-6" />
          </span>
          <div className="text-[0.95rem] leading-relaxed text-muted-foreground">
            <p className="mb-3">
              Si le produit reçu ne correspond pas à l'annonce, ou s'il n'arrive
              jamais, tu peux ouvrir un litige depuis{" "}
              <Link to="/commandes" className="font-semibold text-primary">
                Mes commandes
              </Link>
              . Le séquestre reste bloqué le temps que le litige soit examiné :
              l'argent ne part jamais au vendeur tant que le désaccord n'est pas
              résolu.
            </p>
            <p>
              Si le vendeur n'a pas expédié passé le délai de 72 heures, le
              remboursement se déclenche de lui-même, tu n'as rien à réclamer.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-semibold" data-reveal>
          Pour les vendeurs
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {SELLER.map((s, i) => (
            <div
              key={s.title}
              data-reveal
              data-reveal-delay={i * 0.08}
              className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-xs)]"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-ink text-brand-300">
                <s.icon className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        data-reveal
        className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-center text-white"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(30rem 16rem at 50% 0%, rgba(0,178,93,0.28), transparent 60%)",
          }}
        />
        <div className="relative">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            Prêt à essayer Jassa ?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-white/70">
            Que tu viennes acheter ou vendre, ton argent (ou celui de ton client)
            reste protégé jusqu'au bout.
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link to="/inscription">
              Créer mon compte <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

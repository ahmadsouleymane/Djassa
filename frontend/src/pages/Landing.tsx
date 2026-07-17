import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  MessageSquareText,
  BadgeCheck,
  ArrowRight,
  Search,
  CreditCard,
  PackageCheck,
  Store,
} from "lucide-react";
import { publicProductsApi, type Product } from "@/api/products";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { AmbientBackground } from "@/components/visual/AmbientBackground";
import { EscrowFlowCard } from "@/components/visual/EscrowFlowCard";
import { Marquee } from "@/components/visual/Marquee";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLandingMotion } from "@/hooks/useLandingMotion";

const PROOF = [
  "Paiement séquestré",
  "Vendeurs vérifiés",
  "0 frais acheteur",
  "72h ou remboursé",
  "Litige protégé",
  "Support Côte d'Ivoire",
];

const STEPS = [
  {
    icon: Search,
    n: "01",
    title: "Choisis ton affaire",
    body: "Parcours le djassa : des vendeurs vérifiés dans toutes les catégories. Négocie chap-chap dans la messagerie avant d'acheter.",
  },
  {
    icon: CreditCard,
    n: "02",
    title: "Paie, c'est carré",
    body: "Ton djai part chez Djassa, pas chez le vendeur. Il reste bloqué le temps que ton colis arrive.",
  },
  {
    icon: PackageCheck,
    n: "03",
    title: "Reçois et valide",
    body: "Colis en main, tu confirmes, le vendeur est payé. Un souci ? Tu ouvres un litige et tu es remboursé. On est ensemble.",
  },
];

const FEATURES = [
  {
    icon: Lock,
    title: "Séquestre automatique",
    body: "Chaque commande bloque le paiement jusqu'à ta confirmation. Le vendeur a 72h pour expédier, sinon tu es remboursé, y'a pas drap.",
  },
  {
    icon: BadgeCheck,
    title: "Vendeurs vérifiés",
    body: "Chaque mogo passe une vérification d'identité avant de vendre. Tu sais toujours à qui tu as affaire.",
  },
  {
    icon: MessageSquareText,
    title: "Négociation intégrée",
    body: "Discute, envoie ton offre, tombez d'accord sur le prix : tout se passe dans la messagerie Djassa, sans quitter la plateforme.",
  },
];

export function Landing() {
  usePageTitle("Achète en toute confiance", {
    description:
      "Djassa protège chaque achat en Côte d'Ivoire : ton paiement reste bloqué jusqu'à ta confirmation de réception. Zéro arnaque.",
  });
  const [featured, setFeatured] = useState<Product[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    publicProductsApi
      .list({ limit: 10 })
      .then((res) => setFeatured(res.products))
      .catch(() => {});
  }, []);

  useLandingMotion(rootRef, cardRef);

  return (
    <div ref={rootRef}>
      {/* ---------------- Hero ---------------- */}
      {/* Pulled up under the transparent sticky header (-mt), with compensating top padding. */}
      <section className="grain relative -mt-16 overflow-hidden bg-surface-1 text-white md:-mt-[4.5rem]">
        <AmbientBackground />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 pt-28 pb-16 md:pt-36 md:pb-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1
              data-hero
              className="text-4xl leading-[1.02] font-semibold tracking-tight text-white sm:text-5xl md:text-6xl"
            >
              Achète sans être gaou.
              <br />
              <span className="text-brand-300">Ton djai reste bloqué.</span>
            </h1>
            <p data-hero className="mt-5 max-w-lg text-base leading-relaxed text-white/70 md:text-lg">
              Sur Djassa, ton djai reste bloqué en séquestre jusqu'à ce que ton
              colis arrive. Y'a pas drap, zéro arnaque.
            </p>
            <div data-hero className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/marche">
                  Voir le Djassa <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/25 bg-transparent text-white hover:border-white hover:bg-white/10"
              >
                <Link to="/inscription">Créer un compte gratuit</Link>
              </Button>
            </div>
            <p data-hero className="mt-8 text-xs text-white/40">
              <span className="text-white/55">gaou*</span> = celui qui se fait
              avoir · <span className="text-white/55">djai*</span> = l'argent ·{" "}
              <span className="text-white/55">djassa*</span> = le marché
            </p>
          </div>

          <div data-hero className="flex justify-center lg:justify-end">
            <EscrowFlowCard cardRef={cardRef} />
          </div>
        </div>
      </section>

      {/* ---------------- Proof ticker ---------------- */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-[1200px] px-4 py-3.5">
          <Marquee
            items={PROOF.map((p) => (
              <span key={p} className="inline-flex items-center gap-2 px-4 text-sm font-semibold text-foreground/70">
                <ShieldCheck className="size-4 text-primary" />
                {p}
              </span>
            ))}
          />
        </div>
      </div>

      {/* ---------------- How it works ---------------- */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <span className="text-sm font-semibold tracking-wide text-primary uppercase">
            Comment ça marche
          </span>
          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
            Trois étapes, zéro gaou
          </h2>
          <p className="mt-3 text-muted-foreground">
            Le séquestre Djassa te couvre à chaque commande, du paiement à la
            réception.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              data-reveal
              data-reveal-delay={i * 0.08}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-xs)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-xl bg-accent text-primary">
                  <step.icon className="size-6" />
                </span>
                <span className="font-mono text-sm font-semibold text-muted-foreground/60">
                  {step.n}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Featured ---------------- */}
      {featured.length > 0 && (
        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:py-20">
            <div className="flex items-end justify-between gap-4" data-reveal>
              <div>
                <span className="text-sm font-semibold tracking-wide text-primary uppercase">
                  Fraîchement arrivé
                </span>
                <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
                  Les affaires kpata du moment
                </h2>
              </div>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/marche">
                  Tout voir <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-4">
              {featured.slice(0, 10).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Button asChild variant="secondary">
                <Link to="/marche">Voir tout le marché</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ---------------- Escrow explainer ---------------- */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div data-reveal>
            <span className="text-sm font-semibold tracking-wide text-primary uppercase">
              Le séquestre Djassa
            </span>
            <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
              Ton djai bouge pas tant que tu n'as pas reçu
            </h2>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-muted-foreground">
              Quand tu paies, ton djai est gardé par Djassa, pas par le vendeur.
              Il n'est libéré qu'une fois que tu confirmes avoir reçu ta
              commande. Le vendeur est motivé à bien livrer, toi tu es couvert de
              bout en bout.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "72h pour expédier, sinon remboursement automatique",
                "7 jours pour confirmer après réception",
                "Un litige possible à tout moment avant confirmation",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="text-[0.95rem] text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8">
              <Link to="/comment-ca-marche">
                Comprendre le séquestre <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div data-reveal data-reveal-delay={0.1} className="relative">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-lg)] md:p-8">
              <ol className="relative space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-0.5 before:bg-border">
                {[
                  { t: "L'acheteur paie", d: "L'argent arrive en séquestre chez Djassa.", done: true },
                  { t: "Le vendeur expédie", d: "Sous 72h, avec suivi de la commande.", done: true },
                  { t: "L'acheteur confirme", d: "À la réception, en 1 clic.", done: false },
                  { t: "Le vendeur est payé", d: "Djassa libère les fonds, moins la commission.", done: false },
                ].map((s) => (
                  <li key={s.t} className="relative flex gap-4 pl-0">
                    <span
                      className={
                        "z-10 grid size-8 shrink-0 place-items-center rounded-full text-white " +
                        (s.done ? "bg-primary" : "border-2 border-border bg-card text-muted-foreground")
                      }
                    >
                      {s.done ? (
                        <svg viewBox="0 0 24 24" className="size-4" fill="none">
                          <path d="M5 12.5 10 17 19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span className="size-2 rounded-full bg-border" />
                      )}
                    </span>
                    <div>
                      <p className="font-semibold">{s.t}</p>
                      <p className="text-sm text-muted-foreground">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:py-20">
          <div className="grid gap-5 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                data-reveal
                data-reveal-delay={i * 0.08}
                className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-xs)]"
              >
                <span className="grid size-12 place-items-center rounded-xl bg-ink text-brand-300">
                  <f.icon className="size-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Seller strip ---------------- */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 md:py-20">
        <div
          data-reveal
          className="flex flex-col items-start gap-6 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-sm)] md:flex-row md:items-center md:justify-between md:p-10"
        >
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-primary">
              <Store className="size-6" />
            </span>
            <div>
              <h3 className="text-xl font-semibold md:text-2xl">Tu veux vendre sur Djassa ?</h3>
              <p className="mt-1 max-w-xl text-muted-foreground">
                Commission de 5% par vente, 3% avec l'abonnement Pro. Ton djai
                est garanti dès que l'acheteur confirme.
              </p>
            </div>
          </div>
          <Button asChild size="lg" variant="ink" className="w-full shrink-0 md:w-auto">
            <Link to="/vendre">
              Devenir vendeur <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="grain relative overflow-hidden bg-surface-1 text-white">
        <AmbientBackground />
        <div className="relative mx-auto max-w-[900px] px-4 py-20 text-center" data-reveal>
          <h2 className="text-3xl font-semibold text-white md:text-5xl">
            Prêt à faire ton djassa ?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/70">
            Rejoins les mogos qui achètent et vendent sans se faire avoir. On est
            ensemble.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/inscription">Je crée mon compte</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:border-white hover:bg-white/10"
            >
              <Link to="/marche">Je vois le djassa</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

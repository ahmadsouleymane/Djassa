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
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLandingMotion } from "@/hooks/useLandingMotion";

const STEPS = [
  {
    icon: Search,
    n: "01",
    title: "Parcours le marché",
    body: "Des milliers d'articles chez des vendeurs vérifiés, dans toutes les catégories. Ajoute au panier ou négocie dans la messagerie.",
  },
  {
    icon: CreditCard,
    n: "02",
    title: "Paie en sécurité",
    body: "Ton paiement part chez Jassa, pas directement chez le vendeur. Il reste bloqué le temps de la livraison.",
  },
  {
    icon: PackageCheck,
    n: "03",
    title: "Reçois et confirme",
    body: "À la réception, tu confirmes et le vendeur est payé. Un souci ? Tu ouvres un litige et tu es remboursé.",
  },
];

const FEATURES = [
  {
    icon: Lock,
    title: "Séquestre automatique",
    body: "Chaque commande bloque le paiement jusqu'à ta confirmation. Le vendeur a 72h pour expédier, sinon tu es remboursé automatiquement.",
  },
  {
    icon: BadgeCheck,
    title: "Vendeurs vérifiés",
    body: "Chaque vendeur passe une vérification d'identité avant de vendre. Un indice de confiance accompagne chaque profil.",
  },
  {
    icon: MessageSquareText,
    title: "Négociation intégrée",
    body: "Discute, envoie une offre, tombe d'accord sur un prix : tout se passe dans la messagerie Jassa, sans quitter la plateforme.",
  },
];

function HeroCard({ cardRef }: { cardRef: React.RefObject<HTMLDivElement | null> }) {
  const rail = [
    { label: "Payé", done: true },
    { label: "Expédié", done: true },
    { label: "Reçu", done: false, current: true },
    { label: "Confirmé", done: false },
  ];
  return (
    <div className="[perspective:1000px]">
      <div className="animate-float motion-reduce:animate-none">
        <div
          ref={cardRef}
          className="w-[19rem] rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-lg)] will-change-transform sm:w-[21rem]"
        >
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-[radial-gradient(circle_at_30%_20%,var(--brand-100),var(--secondary))] font-display text-sm font-semibold text-brand-600/70">
            J
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Sac à main cuir</p>
            <p className="text-xs text-muted-foreground">Commande #A48213</p>
          </div>
          <span className="rounded-full bg-[#fbf0dc] px-2.5 py-1 text-[0.7rem] font-bold text-[#8a5a0b]">
            Expédiée
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between">
          {rail.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={
                    "grid size-6 place-items-center rounded-full text-white transition-colors " +
                    (step.done
                      ? "bg-primary"
                      : step.current
                        ? "bg-primary/25 ring-2 ring-primary"
                        : "bg-secondary")
                  }
                >
                  {step.done ? (
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none">
                      <path d="M5 12.5 10 17 19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </span>
                <span className="text-[0.6rem] font-medium text-muted-foreground">{step.label}</span>
              </div>
              {i < rail.length - 1 && (
                <span className={"mx-1 -mt-4 h-0.5 flex-1 rounded-full " + (step.done ? "bg-primary" : "bg-secondary")} />
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl bg-secondary/70 p-3.5">
          <p className="text-[0.7rem] font-medium text-muted-foreground">Code de confirmation</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-[0.3em] text-foreground tabular">482913</p>
        </div>

          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-primary">
            <ShieldCheck className="size-4" />
            22 000 FCFA protégés jusqu'à ta confirmation
          </div>
        </div>
      </div>
    </div>
  );
}

export function Landing() {
  usePageTitle("Achète en toute confiance", {
    description:
      "Jassa protège chaque achat en Côte d'Ivoire : ton paiement reste bloqué jusqu'à ta confirmation de réception. Zéro arnaque.",
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
      <section className="relative overflow-hidden bg-ink text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(60rem 30rem at 12% 8%, rgba(0,178,93,0.30), transparent 55%), radial-gradient(50rem 30rem at 92% 90%, rgba(23,195,119,0.20), transparent 50%)",
          }}
        />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-brand-300">
              <span className="size-1.5 rounded-full bg-brand-300" />
              Le marché en ligne ivoirien
            </span>
            <h1 className="mt-5 text-4xl leading-[1.02] font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
              Achète en confiance,
              <br />
              <span className="text-brand-300">l'argent reste protégé.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 md:text-lg">
              Sur Jassa, ton paiement reste bloqué en séquestre jusqu'à ta
              confirmation de réception. Zéro arnaque, zéro mauvaise surprise.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/marche">
                  Explorer le marché <ArrowRight className="size-4" />
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
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              {[
                ["100%", "Paiement séquestré"],
                ["72h", "Pour expédier ou remboursé"],
                ["0", "Frais côté acheteur"],
              ].map(([k, v]) => (
                <div key={v}>
                  <dt className="font-display text-2xl font-semibold text-white tabular">{k}</dt>
                  <dd className="text-sm text-white/60">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroCard cardRef={cardRef} />
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <span className="text-sm font-semibold tracking-wide text-primary uppercase">
            Comment ça marche
          </span>
          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
            Trois étapes, zéro risque
          </h2>
          <p className="mt-3 text-muted-foreground">
            Le séquestre Jassa te protège à chaque commande, du paiement à la
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
                  Ça bouge sur le marché
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
              Le séquestre Jassa
            </span>
            <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
              Ton argent ne bouge pas tant que tu n'as pas reçu
            </h2>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-muted-foreground">
              Quand tu paies, l'argent est gardé par Jassa, pas par le vendeur.
              Il n'est libéré qu'une fois que tu confirmes avoir reçu ta
              commande. Le vendeur est motivé à bien livrer, tu es protégé de
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
                  { t: "L'acheteur paie", d: "L'argent arrive en séquestre chez Jassa.", done: true },
                  { t: "Le vendeur expédie", d: "Sous 72h, avec suivi de la commande.", done: true },
                  { t: "L'acheteur confirme", d: "À la réception, en 1 clic.", done: false },
                  { t: "Le vendeur est payé", d: "Jassa libère les fonds, moins la commission.", done: false },
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
              <h3 className="text-xl font-semibold md:text-2xl">Tu veux vendre sur Jassa ?</h3>
              <p className="mt-1 max-w-xl text-muted-foreground">
                Commission de 5% par vente, 3% avec l'abonnement Pro. Paiement
                garanti dès que l'acheteur confirme.
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
      <section className="relative overflow-hidden bg-ink text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(40rem 20rem at 50% 0%, rgba(0,178,93,0.25), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-[900px] px-4 py-20 text-center" data-reveal>
          <h2 className="text-3xl font-semibold text-white md:text-5xl">
            Prêt à acheter sans stress ?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/70">
            Rejoins le marché où acheteurs et vendeurs se font confiance,
            commande après commande.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/inscription">Créer mon compte</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:border-white hover:bg-white/10"
            >
              <Link to="/marche">Voir le marché</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

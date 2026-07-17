import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  HandCoins,
  IdCard,
  Store,
  Truck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLandingMotion } from "@/hooks/useLandingMotion";

const WHY = [
  {
    icon: HandCoins,
    title: "Paiement garanti",
    body: "L'acheteur paie avant l'expédition. Le djai est bloqué chez Jassa, pas entre ses mains. Impossible qu'il disparaisse sans payer.",
  },
  {
    icon: BadgeCheck,
    title: "Des acheteurs qui te font confiance",
    body: "Ton badge Vendeur vérifié et ton score de confiance rassurent des acheteurs qui n'auraient pas osé t'écrire sur les réseaux.",
  },
  {
    icon: ShieldCheck,
    title: "Zéro négociation forcée",
    body: "Un acheteur peut payer directement au prix affiché, ou négocier dans la messagerie. À toi de choisir ce que tu acceptes.",
  },
];

const STEPS = [
  {
    icon: IdCard,
    n: "01",
    title: "Vérifie ton identité",
    body: "Une pièce d'identité, examinée sous 24 à 72h. C'est ce qui rassure les acheteurs, et c'est obligatoire avant toute vente publique.",
  },
  {
    icon: Store,
    n: "02",
    title: "Publie ton catalogue",
    body: "Titre, prix, photos : ton article est en ligne en quelques minutes, visible sur tout le marché.",
  },
  {
    icon: Truck,
    n: "03",
    title: "Expédie, sois payé",
    body: "72h pour expédier après paiement. Dès la réception confirmée (ou après 7 jours de silence), l'argent t'est versé.",
  },
];

export function LandingVendeur() {
  usePageTitle("Vendre sur Jassa", {
    description:
      "Publie tes produits sur Jassa et sois payé sans risque : le paiement de l'acheteur est bloqué jusqu'à la livraison.",
  });
  const rootRef = useRef<HTMLDivElement>(null);
  useLandingMotion(rootRef);

  return (
    <div ref={rootRef}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55rem 30rem at 15% 10%, rgba(0,178,93,0.30), transparent 55%), radial-gradient(45rem 30rem at 90% 95%, rgba(23,195,119,0.18), transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-[900px] px-4 py-20 text-center md:py-28">
          <span
            data-hero
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-brand-300"
          >
            <span className="size-1.5 rounded-full bg-brand-300" /> Vendre sur Jassa
          </span>
          <h1
            data-hero
            className="mt-5 text-4xl leading-[1.03] font-semibold tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            Vends, encaisse, <span className="text-brand-300">sans te faire avoir.</span>
          </h1>
          <p data-hero className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
            Sur les réseaux, tu risques l'acheteur qui disparaît après réception.
            Sur Jassa, ton djai est bloqué en séquestre dès la commande, et il
            t'est versé dès que le client confirme la réception.
          </p>
          <div data-hero className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/inscription-vendeur">
                Créer mon compte vendeur <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:border-white hover:bg-white/10"
            >
              <Link to="/comment-ca-marche">Voir comment ça marche</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <span className="text-sm font-semibold tracking-wide text-primary uppercase">
            Pourquoi vendre ici
          </span>
          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
            Ce que Jassa change pour toi
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {WHY.map((w, i) => (
            <div
              key={w.title}
              data-reveal
              data-reveal-delay={i * 0.08}
              className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-xs)]"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-accent text-primary">
                <w.icon className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{w.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
                {w.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center" data-reveal>
            <span className="text-sm font-semibold tracking-wide text-primary uppercase">
              La mécanique
            </span>
            <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
              De l'annonce au paiement
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                data-reveal
                data-reveal-delay={i * 0.08}
                className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-xs)]"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-xl bg-ink text-brand-300">
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
        </div>
      </section>

      {/* Commission */}
      <section className="mx-auto max-w-[1000px] px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <span className="text-sm font-semibold tracking-wide text-primary uppercase">
            Commission
          </span>
          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
            Un coût clair, pas de surprise
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div data-reveal className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-xs)]">
            <h3 className="font-display text-xl font-semibold">Standard</h3>
            <p className="mt-1 text-sm text-muted-foreground">Gratuit, sans engagement.</p>
            <p className="mt-4 font-display text-3xl font-semibold">5%</p>
            <p className="text-sm text-muted-foreground">par commande confirmée</p>
          </div>
          <div
            data-reveal
            data-reveal-delay={0.08}
            className="relative rounded-2xl border-2 border-primary bg-card p-6 shadow-[var(--shadow-md)]"
          >
            <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
              Le plus rentable
            </span>
            <h3 className="font-display text-xl font-semibold">Pro · 7 000 FCFA/mois</h3>
            <p className="mt-1 text-sm text-muted-foreground">Pour les vendeurs actifs.</p>
            <p className="mt-4 font-display text-3xl font-semibold">3%</p>
            <ul className="mt-4 space-y-2 text-sm">
              {["Badge Pro visible", "Mise en avant sur le marché", "Statistiques détaillées"].map(
                (f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 text-primary" /> {f}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
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
            Prêt à vendre sans risque ?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/70">
            La vérification prend quelques minutes. Ton premier acheteur peut
            arriver aujourd'hui.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/inscription-vendeur">
              Créer mon compte vendeur <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

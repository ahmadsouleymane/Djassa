import { useRef, useState, useEffect } from "react";
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
  Crown,
  Eye,
  Timer,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AmbientBackground } from "@/components/visual/AmbientBackground";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLandingMotion } from "@/hooks/useLandingMotion";

const OFFER_DEADLINE = new Date("2026-07-27T23:59:59+00:00");

function useCountdown(deadline: Date) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function tick() {
      const now = Date.now();
      const diff = deadline.getTime() - now;
      if (diff <= 0) {
        setRemaining("Offre terminée");
        return;
      }
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setRemaining(`${d}j ${h}h ${m}m`);
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [deadline]);

  return remaining;
}

const OFFER_BENEFITS = [
  {
    icon: Crown,
    title: "2 mois de Djassa Pro offerts",
    subtitle: "Au lieu de 7 000 FCFA/mois",
    body: "Commission réduite, boutique personnalisable, stats avancées. Tout ce qu'il faut pour décoller, gratuit pendant 60 jours.",
  },
  {
    icon: BadgeCheck,
    title: "Badge Fondateur à vie",
    subtitle: "Visible sur ton profil et tes produits",
    body: "Un badge exclusif qui dit à tous les acheteurs que tu fais partie des premiers. Confiance instantanée, même sans historique.",
  },
  {
    icon: Eye,
    title: "Visibilité maximale",
    subtitle: "Tes produits en tête du marché",
    body: "Les Fondateurs sont mis en avant sur la page d'accueil et en tête des résultats de recherche. Maximum d'yeux sur ton catalogue.",
  },
];

const WHY = [
  {
    icon: HandCoins,
    title: "Paiement garanti",
    body: "L'acheteur paie avant l'expédition. Le djai* est bloqué chez Djassa, pas entre ses mains. Impossible qu'il disparaisse sans payer.",
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
    body: "Prends 3 photos en direct depuis ton téléphone : recto, verso de ta pièce, et un selfie. Examen sous 24 à 72h.",
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
  usePageTitle("Deviens vendeur sur Djassa – Offre Fondateur", {
    description:
      "Les 100 premiers vendeurs Djassa reçoivent 2 mois de version Pro gratuits, le badge Fondateur à vie, et une visibilité boostée. Offre valable jusqu'au 27 juillet.",
  });
  const rootRef = useRef<HTMLDivElement>(null);
  useLandingMotion(rootRef);
  const countdown = useCountdown(OFFER_DEADLINE);

  return (
    <div ref={rootRef}>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="grain relative -mt-16 overflow-hidden bg-surface-1 text-white md:-mt-[4.5rem]">
        <AmbientBackground />
        <div className="relative mx-auto max-w-[960px] px-4 pt-28 pb-16 text-center md:pt-36 md:pb-24">
          {/* Badge urgence */}
          <div data-hero className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-300 backdrop-blur-sm">
            <Timer className="size-4" />
            Offre Fondateur · Expire dans {countdown}
          </div>

          <h1
            data-hero
            className="mt-6 text-4xl leading-[1.06] font-semibold tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            Les premiers vendeurs ont tout.
            <br />
            <span className="text-brand-300">Rejoins-les avant le 27.</span>
          </h1>

          <p data-hero className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">
            On lance Djassa, et on veut les meilleurs vendeurs dès le jour 1.
            En échange de ta confiance, on t'offre le plan Pro pendant 2 mois,
            le badge Fondateur à vie, et une visibilité que les suivants n'auront pas.
          </p>

          <div data-hero className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="shadow-[0_0_40px_rgba(0,178,93,0.25)]">
              <Link to="/inscription-vendeur">
                <Sparkles className="size-4" /> Créer mon compte vendeur gratuit
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:border-white/35 hover:bg-white/8"
            >
              <a href="#offre">Voir l'offre en détail</a>
            </Button>
          </div>

          <p className="mt-4 text-xs text-white/35">
            Aucune carte bancaire requise. Standard gratuit, Pro offert 2 mois.
          </p>
        </div>
      </section>

      {/* ── Les 3 avantages fondateur ───────────────────────────────────── */}
      <section id="offre" className="mx-auto max-w-[1200px] px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-sm font-semibold text-brand-400">
            <Crown className="size-3.5" /> Offre Fondateur
          </span>
          <h2 className="mt-4 text-3xl font-semibold md:text-4xl">
            Ce que tu gagnes en t'inscrivant maintenant
          </h2>
          <p className="mt-3 text-muted-foreground">
            Une offre unique pour les vendeurs qui nous rejoignent avant le 27 juillet 2026.
            Après, le Pro redevient payant et le badge Fondateur disparaît.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {OFFER_BENEFITS.map((b, i) => (
            <div
              key={b.title}
              data-reveal
              data-reveal-delay={i * 0.1}
              className="group relative overflow-hidden rounded-2xl border border-brand-200/40 bg-gradient-to-b from-brand-50/60 to-card p-6 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
            >
              {/* Subtle emerald glow on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(600px_circle_at_50%_-30%,rgba(0,178,93,0.06),transparent)] transition-opacity group-hover:opacity-100" />
              <span className="relative grid size-12 place-items-center rounded-xl bg-brand-100 text-brand-600">
                <b.icon className="size-6" />
              </span>
              <h3 className="relative mt-5 text-lg font-semibold">{b.title}</h3>
              <p className="relative mt-1 text-sm font-medium text-brand-600">{b.subtitle}</p>
              <p className="relative mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pourquoi vendre ici ─────────────────────────────────────────── */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center" data-reveal>
            <span className="text-sm font-semibold tracking-wide text-primary uppercase">
              Pourquoi vendre ici
            </span>
            <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
              Ce que Djassa change pour toi
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
        </div>
      </section>

      {/* ── Comment ça marche ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 md:py-24">
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
      </section>

      {/* ── Paliers (modifié pour l'offre) ───────────────────────────────── */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-[1000px] px-4 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center" data-reveal>
            <span className="text-sm font-semibold tracking-wide text-primary uppercase">
              Paliers
            </span>
            <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
              Un coût clair, pas de surprise
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {/* Standard */}
            <div data-reveal className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-xs)]">
              <h3 className="font-display text-xl font-semibold">Standard</h3>
              <p className="mt-1 text-sm text-muted-foreground">Gratuit, sans engagement.</p>
              <p className="mt-4 font-display text-3xl font-semibold">0 FCFA</p>
              <p className="text-sm text-muted-foreground">Commission de 5% par commande</p>
            </div>

            {/* Pro — avec badge fondateur */}
            <div
              data-reveal
              data-reveal-delay={0.08}
              className="relative overflow-hidden rounded-2xl border-2 border-brand-400 bg-gradient-to-b from-brand-50/40 to-card p-6 shadow-[var(--shadow-md)]"
            >
              {/* Glow */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(400px_circle_at_50%_0%,rgba(0,178,93,0.08),transparent)]" />

              <span className="relative inline-flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
                <Crown className="size-3" /> Offre Fondateur
              </span>
              <h3 className="relative mt-3 font-display text-xl font-semibold">Pro</h3>
              <p className="relative mt-1 text-sm text-muted-foreground">
                Pour les vendeurs actifs. 7 000 FCFA/mois après l'offre.
              </p>
              <p className="relative mt-4 font-display text-3xl font-semibold text-brand-600">
                0 FCFA
              </p>
              <p className="relative text-sm font-medium text-brand-600">
                Gratuit pendant 2 mois (au lieu de 14 000 FCFA)
              </p>

              <ul className="relative mt-5 space-y-2.5 text-sm">
                {[
                  "Badge Fondateur à vie sur ton profil",
                  "Produits mis en avant en tête du marché",
                  "Boutique personnalisable",
                  "Statistiques avancées et données de vente",
                  "Commission réduite sur les ventes",
                  "Support prioritaire",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="size-4 shrink-0 text-brand-500" /> {f}
                  </li>
                ))}
              </ul>

              <p className="relative mt-4 text-xs text-muted-foreground">
                Offre valable jusqu'au 27 juillet 2026. Le Badge Fondateur reste à vie
                même si tu ne renouvelles pas le Pro ensuite.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────── */}
      <section className="grain relative overflow-hidden bg-surface-1 text-white">
        <AmbientBackground />
        <div className="relative mx-auto max-w-[900px] px-4 py-20 text-center" data-reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-300 backdrop-blur-sm">
            <Timer className="size-4" />
            Plus que {countdown} avant la fin de l'offre
          </span>

          <h2 className="mt-6 text-3xl font-semibold text-white md:text-5xl">
            Les 100 premières places sont les seules.
          </h2>

          <p className="mx-auto mt-4 max-w-lg text-white/65">
            Après le 27 juillet, le badge Fondateur disparaît et le Pro redevient payant.
            Crée ton compte maintenant, c'est gratuit et sans engagement.
          </p>

          <Button asChild size="lg" className="mt-8 shadow-[0_0_40px_rgba(0,178,93,0.25)]">
            <Link to="/inscription-vendeur">
              <Sparkles className="size-4" /> Créer mon compte vendeur gratuit
              <ArrowRight className="size-4" />
            </Link>
          </Button>

          <p className="mt-4 text-xs text-white/30">
            * djai = l'argent, en nouchi (argot abidjanais). Le séquestre bloque
            le paiement de l'acheteur jusqu'à confirmation de réception.
          </p>
        </div>
      </section>
    </div>
  );
}

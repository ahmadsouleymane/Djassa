import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  BadgeCheck,
  MessageSquareText,
  PackageCheck,
  Percent,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  Store,
} from "lucide-react";
import { waitlistApi } from "@/api/waitlist";
import { ApiError } from "@/api/client";
import { LAUNCH_AT, WHATSAPP_GROUP_URL } from "@/config/launch";
import { AmbientBackground } from "@/components/visual/AmbientBackground";
import { Marquee } from "@/components/visual/Marquee";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLandingMotion } from "@/hooks/useLandingMotion";
import { formatFcfa } from "@/lib/utils";

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

const PRO_MONTHLY_PRICE = 7000;

const PROOF = [
  "Paiement séquestré",
  "Vendeurs vérifiés",
  "Ouverture le 27 juillet",
  "Support Côte d'Ivoire",
  "Litige protégé",
];

const BUYER_POINTS = [
  {
    icon: ShieldCheck,
    title: "Paiement séquestré",
    body: "Ton argent reste bloqué chez Djassa jusqu'à ce que tu confirmes avoir reçu ta commande.",
  },
  {
    icon: BadgeCheck,
    title: "Vendeurs vérifiés",
    body: "Chaque vendeur passe une vérification d'identité avant de pouvoir vendre sur la plateforme.",
  },
  {
    icon: MessageSquareText,
    title: "Négociation intégrée",
    body: "Discute avec le vendeur et fais une offre directement dans la messagerie, avant d'acheter.",
  },
  {
    icon: PackageCheck,
    title: "Livraison encadrée",
    body: "72h pour l'expédition sinon remboursement automatique, puis 7 jours pour confirmer la réception.",
  },
];

const SELLER_POINTS = [
  {
    icon: BadgeCheck,
    title: "Vérification d'identité",
    body: "Une vérification (KYC) est obligatoire avant de pouvoir publier tes premières annonces.",
  },
  {
    icon: Percent,
    title: "Commission claire",
    body: "5% de commission, identique pour tous les paliers. Aucun frais caché.",
  },
  {
    icon: Store,
    title: `Formule Pro à ${formatFcfa(PRO_MONTHLY_PRICE)}/mois`,
    body: "Produits mis en avant, boutique personnalisable et données détaillées.",
  },
  {
    icon: MessageSquareText,
    title: "Messagerie de négociation",
    body: "Reçois les offres de tes acheteurs et fixe le prix final directement dans la messagerie.",
  },
];

function useCountdown(target: Date) {
  const [remaining, setRemaining] = useState(() => target.getTime() - Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setRemaining(target.getTime() - Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const clamped = Math.max(0, remaining);
  return {
    days: Math.floor(clamped / 86_400_000),
    hours: Math.floor((clamped % 86_400_000) / 3_600_000),
    minutes: Math.floor((clamped % 3_600_000) / 60_000),
    seconds: Math.floor((clamped % 60_000) / 1_000),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 sm:px-6 sm:py-5">
      <span className="tabular font-display text-3xl font-semibold text-white sm:text-4xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[0.7rem] font-medium tracking-wide text-white/55 uppercase sm:text-xs">
        {label}
      </span>
    </div>
  );
}

export function Waitlist() {
  usePageTitle("Liste d'attente", {
    description:
      "Djassa ouvre le lundi 27 juillet. Inscris-toi sur la liste d'attente et rejoins le groupe WhatsApp pour être informé en premier.",
  });

  const rootRef = useRef<HTMLDivElement>(null);
  useLandingMotion(rootRef);
  const countdown = useCountdown(LAUNCH_AT);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    waitlistApi
      .count()
      .then((res) => setCount(res.count))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setError(null);
  setIsSubmitting(true);
  try {
    await waitlistApi.join({ firstName, lastName, email });
    setCount((c) => (c ?? 0) + 1);
    setSubmitted(true);

    // ✅ TRACK META LEAD (avec fallback silencieux)
    if (typeof window !== 'undefined') {
      try {
        if (window.fbq) {
          window.fbq('track', 'Lead', {
            content_name: 'Liste d\'attente Djassa',
            content_category: 'Pré-inscription',
            value: 0,
            currency: 'XOF'
          });
        }
      } catch (e) {
        // Le tracking a échoué mais on ignore pour ne pas bloquer l'utilisateur
        console.warn('Meta Pixel non disponible, tracking ignoré');
      }
    }

    toast.success("Tu es sur la liste d'attente Djassa");
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      setSubmitted(true);

      // ✅ MÊME SI DÉJÀ INSCRIT, ON TRACK (lead qualifié)
      try {
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', 'Lead', {
            content_name: 'Liste d\'attente Djassa (déjà inscrit)',
            content_category: 'Pré-inscription'
          });
        }
      } catch (e) {
        // Ignorer silencieusement
        console.warn('Meta Pixel non disponible pour ce doublon');
      }

      toast.info("Cet email est déjà inscrit, mais bienvenue quand même");
    } else if (err instanceof ApiError) {
      setError(err.message);
    } else {
      setError("Une erreur est survenue, réessaie.");
    }
  } finally {
    setIsSubmitting(false);
  }
}

  return (
    <div ref={rootRef} className="min-h-dvh bg-background">
      {/* ---------------- Header ---------------- */}
      <header className="absolute inset-x-0 top-0 z-20 mx-auto flex max-w-[1200px] items-center justify-between px-4 py-6 sm:px-6">
        <Logo variant="light" to="/liste-attente" />
        <Button asChild variant="outline" size="sm" className="border-white/25 bg-transparent text-white hover:border-white hover:bg-white/10">
          <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noreferrer">
            <MessageCircle className="size-4" /> Groupe WhatsApp
          </a>
        </Button>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section className="grain relative overflow-hidden bg-surface-1 text-white">
        <AmbientBackground />
        <div className="relative mx-auto flex max-w-[900px] flex-col items-center px-4 pt-32 pb-16 text-center sm:px-6 md:pt-40 md:pb-20">
          <span
            data-hero
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-brand-300 uppercase"
          >
            Ouverture officielle : lundi 27 juillet
          </span>
          <h1
            data-hero
            className="mt-6 text-4xl leading-[1.05] font-semibold tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            Le djassa arrive.
            <br />
            <span className="text-brand-300">Sois parmi les premiers.</span>
          </h1>
          <p data-hero className="mt-5 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
            Djassa sécurise chaque achat en Côte d'Ivoire : ton paiement reste bloqué jusqu'à ta
            confirmation de réception. Inscris-toi sur la liste d'attente pour être informé dès
            l'ouverture.
          </p>

          <div data-hero className="mt-10 grid grid-cols-4 gap-2.5 sm:gap-4">
            <CountdownUnit value={countdown.days} label="Jours" />
            <CountdownUnit value={countdown.hours} label="Heures" />
            <CountdownUnit value={countdown.minutes} label="Minutes" />
            <CountdownUnit value={countdown.seconds} label="Secondes" />
          </div>

          <div data-hero className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href="#rejoindre">
                Rejoindre la liste d'attente <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:border-white hover:bg-white/10"
            >
              <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" /> Groupe WhatsApp
              </a>
            </Button>
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

      {/* ---------------- Ce qu'il faut savoir ---------------- */}
      <section className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <span className="text-sm font-semibold tracking-wide text-primary uppercase">
            Avant l'ouverture
          </span>
          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Ce qu'il faut savoir</h2>
          <p className="mt-3 text-muted-foreground">
            Que tu viennes acheter ou vendre, voici comment Djassa te protège dès le premier jour.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div data-reveal className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] md:p-8">
            <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary">
              <ShoppingBag className="size-5" />
            </span>
            <h3 className="mt-4 text-xl font-semibold">Si tu viens acheter</h3>
            <ul className="mt-5 space-y-4">
              {BUYER_POINTS.map((point) => (
                <li key={point.title} className="flex items-start gap-3">
                  <point.icon className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{point.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{point.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div data-reveal data-reveal-delay={0.08} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] md:p-8">
            <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary">
              <Store className="size-5" />
            </span>
            <h3 className="mt-4 text-xl font-semibold">Si tu viens vendre</h3>
            <ul className="mt-5 space-y-4">
              {SELLER_POINTS.map((point) => (
                <li key={point.title} className="flex items-start gap-3">
                  <point.icon className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{point.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{point.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------- Formulaire ---------------- */}
      <section id="rejoindre" className="border-t border-border bg-secondary/40 scroll-mt-6">
        <div className="mx-auto max-w-[560px] px-4 py-16 sm:px-6 md:py-24">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-lg)] md:p-8" data-reveal>
            {!submitted ? (
              <>
                <div className="text-center">
                  {count !== null && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-foreground">
                      {count.toLocaleString("fr-FR")} inscrit{count > 1 ? "s" : ""} pour le moment
                    </span>
                  )}
                  <h2 className="mt-4 text-2xl font-semibold md:text-3xl">Rejoins la liste d'attente</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nom, prénom, email : c'est tout. On te préviendra dès l'ouverture, avec des
                    surprises réservées aux premiers inscrits.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
                  {error && (
                    <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                      {error}
                    </p>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="wl-first-name">Prénom</Label>
                      <Input
                        id="wl-first-name"
                        autoComplete="given-name"
                        required
                        placeholder="Awa"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="wl-last-name">Nom</Label>
                      <Input
                        id="wl-last-name"
                        autoComplete="family-name"
                        required
                        placeholder="Koné"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="wl-email">Email</Label>
                    <Input
                      id="wl-email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="toi@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit" size="lg" className="mt-1" disabled={isSubmitting}>
                    {isSubmitting ? "Inscription…" : "Je m'inscris"}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent text-primary">
                  <CheckCircle2 className="size-7" />
                </span>
                <h2 className="mt-4 text-2xl font-semibold">Tu es sur la liste</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  On te préviendra par email dès l'ouverture. Rejoins aussi le groupe WhatsApp pour
                  être informé en premier et profiter des surprises réservées aux membres.
                </p>
                <Button asChild size="lg" className="mt-6">
                  <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noreferrer">
                    <MessageCircle className="size-4" /> Rejoindre le groupe WhatsApp
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="bg-ink text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 py-10 text-center sm:px-6">
          <Logo variant="light" to="/liste-attente" />
          <p className="max-w-md text-sm text-white/60">
            Djassa, la marketplace de confiance pour acheter et vendre en Côte d'Ivoire.
          </p>
          <p className="text-xs text-white/40">© {new Date().getFullYear()} Djassa. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

import { Star } from "lucide-react";
import { Marquee } from "./Marquee";

type Testimonial = {
  name: string;
  city: string;
  quote: string;
  rating: number;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Aïcha K.",
    city: "Cocody, Abidjan",
    quote:
      "J'avais peur d'acheter en ligne après une arnaque sur les réseaux. Là mon paiement est resté bloqué jusqu'à la livraison. Reçu, validé, zéro stress.",
    rating: 5,
  },
  {
    name: "Serge B.",
    city: "Yopougon, Abidjan",
    quote:
      "Vendeur depuis 6 mois. Je suis payé à chaque commande confirmée, plus personne qui disparaît après réception. Ça a changé mon business.",
    rating: 5,
  },
  {
    name: "Fatou D.",
    city: "Bouaké",
    quote:
      "La négociation dans la messagerie, c'est carré. On s'entend sur le prix, je paie, le colis arrive. Simple et clair.",
    rating: 5,
  },
  {
    name: "Kouassi N.",
    city: "Marcory, Abidjan",
    quote:
      "Un colis pas conforme, j'ai ouvert un litige et j'ai été remboursé sans galère. C'est ça qui me fait rester sur Djassa.",
    rating: 4,
  },
  {
    name: "Mariam T.",
    city: "Treichville, Abidjan",
    quote:
      "Chaque vendeur est vérifié, tu vois à qui tu as affaire. Je recommande à toutes mes copines qui vendent leurs articles.",
    rating: 5,
  },
  {
    name: "Yann A.",
    city: "San-Pédro",
    quote:
      "72h pour expédier sinon remboursé, ça pousse les vendeurs à être sérieux. J'ai reçu mes baskets en deux jours.",
    rating: 5,
  },
];

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="mx-1.5 flex h-full w-[19rem] flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-xs)] sm:w-[22rem]">
      <div className="flex items-center gap-1 text-primary">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={i < t.rating ? "size-4 fill-current" : "size-4 text-border"}
          />
        ))}
      </div>
      <blockquote className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-foreground/90">
        “{t.quote}”
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent font-display text-sm font-semibold text-accent-foreground">
          {t.name[0]}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{t.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{t.city}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** Two rows of testimonial cards scrolling in opposite directions. */
export function Testimonials() {
  const half = Math.ceil(TESTIMONIALS.length / 2);
  const rowA = TESTIMONIALS.slice(0, half);
  const rowB = TESTIMONIALS.slice(half);
  return (
    <div className="space-y-4">
      <Marquee gap="gap-0" items={rowA.map((t) => <Card key={t.name} t={t} />)} />
      <Marquee gap="gap-0" reverse items={rowB.map((t) => <Card key={t.name} t={t} />)} />
    </div>
  );
}

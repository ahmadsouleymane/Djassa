import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  MessageSquareText,
  ShoppingBag,
  Check,
  Store,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { publicProductsApi, type Product } from "@/api/products";
import { conversationsApi } from "@/api/conversations";
import { ApiError } from "@/api/client";
import { reviewsApi, type Review } from "@/api/reviews";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { TrustBadge } from "@/components/TrustBadge";
import { QuantityStepper } from "@/components/QuantityStepper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatFcfa, cn } from "@/lib/utils";

function useProductJsonLd(product: Product | null) {
  useEffect(() => {
    if (!product) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.description,
      image: product.photos,
      offers: {
        "@type": "Offer",
        priceCurrency: "XOF",
        price: product.price,
        availability: "https://schema.org/InStock",
        url: window.location.href,
      },
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [product]);
}

const CATEGORY_LABELS: Record<string, string> = {
  mode_beaute: "Mode & Beauté",
  electronique: "Électronique",
  maison: "Maison",
  telephones: "Téléphones",
  alimentation: "Alimentation",
  autre: "Autre",
};

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i <= Math.round(value)
              ? "fill-[#f5a623] text-[#f5a623]"
              : "fill-secondary text-border",
          )}
        />
      ))}
    </span>
  );
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addItem, isInCart } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState<"message" | null>(null);
  const [notFound, setNotFound] = useState(false);

  usePageTitle(product?.title ?? "Produit", {
    description: product?.description.slice(0, 155),
    image: product?.photos[0],
  });
  useProductJsonLd(product);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setNotFound(false);
    publicProductsApi
      .get(id)
      .then((res) => {
        setProduct(res.product);
        setActivePhoto(0);
        reviewsApi.listForVendor(res.product.vendorId).then((r) => setReviews(r.reviews));
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleMessage() {
    if (!product) return;
    if (!user) {
      navigate("/connexion");
      return;
    }
    setIsActing("message");
    try {
      const { conversation } = await conversationsApi.start(product.id);
      navigate(`/messagerie/${conversation.id}`);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Impossible de démarrer la conversation.",
      );
    } finally {
      setIsActing(null);
    }
  }

  function handleAddToCart() {
    if (!product || isInCart(product.id)) return;
    addItem(
      {
        productId: product.id,
        vendorId: product.vendorId,
        title: product.title,
        price: product.price,
        photo: product.photos[0] ?? null,
      },
      quantity,
    );
    toast.success(
      quantity > 1 ? `${quantity} ajoutés au panier` : "Ajouté au panier",
      { description: product.title },
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">
          Ce produit n'existe plus ou n'est pas encore disponible.
        </p>
        <Button asChild variant="secondary">
          <Link to="/marche">
            <ArrowLeft className="size-4" /> Retour au marché
          </Link>
        </Button>
      </div>
    );
  }

  const photos = product.photos;
  const inCart = isInCart(product.id);
  const avgRating =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return (
    <div className="flex flex-col gap-10">
      <Link
        to="/marche"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour au marché
      </Link>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-secondary">
            {photos[activePhoto] ? (
              <img
                src={photos[activePhoto]}
                alt={product.title}
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center bg-[radial-gradient(circle_at_30%_20%,var(--brand-100),var(--secondary))]">
                <span className="font-display text-2xl font-semibold text-brand-600/50">
                  Djassa
                </span>
              </div>
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {photos.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setActivePhoto(i)}
                  className={cn(
                    "size-18 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                    i === activePhoto ? "border-primary" : "border-transparent hover:border-border",
                  )}
                >
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Badge variant="secondary" className="mb-3">
            {CATEGORY_LABELS[product.category] ?? product.category}
          </Badge>
          <h1 className="text-3xl font-semibold md:text-4xl">{product.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="font-display text-3xl font-semibold text-foreground tabular">
              {formatFcfa(product.price)}
            </span>
            <Link
              to={`/vendeur/${product.vendorId}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground no-underline transition-colors hover:border-brand-300 hover:bg-secondary"
            >
              <Store className="size-4 text-muted-foreground" />
              Voir le vendeur
              <TrustBadge vendorId={product.vendorId} />
            </Link>
          </div>

          <p className="mt-5 leading-relaxed whitespace-pre-line text-foreground/85">
            {product.description}
          </p>

          {!inCart && (
            <div className="mt-6 flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Quantité</span>
              <QuantityStepper value={quantity} onChange={setQuantity} />
              {quantity > 1 && (
                <span className="text-sm text-muted-foreground">
                  soit{" "}
                  <strong className="text-foreground tabular">
                    {formatFcfa(product.price * quantity)}
                  </strong>
                </span>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={inCart}
            >
              {inCart ? (
                <>
                  <Check className="size-5" /> Dans le panier
                </>
              ) : (
                <>
                  <ShoppingBag className="size-5" /> Ajouter au panier
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="flex-1"
              onClick={handleMessage}
              disabled={isActing !== null}
            >
              <MessageSquareText className="size-5" />
              {isActing === "message" ? "Un instant…" : "Négocier le prix"}
            </Button>
          </div>

          {inCart && (
            <Button asChild variant="link" className="mt-2 px-0">
              <Link to="/panier">Voir mon panier</Link>
            </Button>
          )}

          {/* Escrow reassurance */}
          <div className="mt-6 flex gap-3 rounded-xl border border-brand-100 bg-accent/60 p-4">
            <ShieldCheck className="size-5 shrink-0 text-primary" />
            <div className="text-sm">
              <p className="font-semibold text-accent-foreground">
                Achat protégé par le séquestre Djassa
              </p>
              <p className="mt-0.5 text-muted-foreground">
                Ton paiement reste bloqué jusqu'à ta confirmation de réception.
                Le vendeur a 72h pour expédier, sinon tu es remboursé.
              </p>
            </div>
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" /> Paiement sécurisé via GeniusPay
          </p>
        </div>
      </div>

      {/* Reviews */}
      <section className="border-t border-border pt-10">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">Avis sur ce vendeur</h2>
          {avgRating !== null && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <Star className="size-4 fill-[#f5a623] text-[#f5a623]" />
              {avgRating.toFixed(1)}/5 · {reviews.length} avis
            </span>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="mt-4 text-muted-foreground">
            Ce vendeur n'a pas encore d'avis.
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-xs)]"
              >
                <div className="flex items-center justify-between">
                  <Stars value={r.rating} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-foreground/85">
                  {r.comment}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

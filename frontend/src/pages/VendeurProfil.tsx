import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Star, Package, Sparkles } from "lucide-react";
import { vendorsApi, type PublicVendor } from "@/api/vendors";
import { publicProductsApi, type Product } from "@/api/products";
import { reviewsApi, type Review, type TrustScore } from "@/api/reviews";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-xs)]">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tabular">{value}</p>
    </div>
  );
}

function useVendorJsonLd(vendor: PublicVendor | null, avgRating: number | null, reviewCount: number) {
  useEffect(() => {
    if (!vendor) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Vendeur vérifié Djassa",
      url: window.location.href,
      ...(avgRating !== null
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: avgRating.toFixed(1),
              reviewCount,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [vendor, avgRating, reviewCount]);
}

export function VendeurProfil() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<PublicVendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [trust, setTrust] = useState<TrustScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const avgRating =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  usePageTitle(
    vendor ? `Vendeur vérifié${avgRating ? ` · ${avgRating.toFixed(1)}/5` : ""}` : "Vendeur",
    {
      description: vendor
        ? `Vendeur vérifié par pièce d'identité sur Djassa · ${products.length} article${products.length > 1 ? "s" : ""} en vente${avgRating ? ` · noté ${avgRating.toFixed(1)}/5 sur ${reviews.length} avis` : ""}. Paiement séquestré jusqu'à ta confirmation de réception.`
        : "Retrouve les produits, avis et score de confiance de ce vendeur vérifié sur Djassa.",
    },
  );
  useVendorJsonLd(vendor, avgRating, reviews.length);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setNotFound(false);
    vendorsApi
      .get(id)
      .then((res) => {
        setVendor(res.vendor);
        publicProductsApi.list({ vendorId: id, limit: 50 }).then((r) => setProducts(r.products));
        reviewsApi.listForVendor(id).then((r) => setReviews(r.reviews));
        reviewsApi.trustScore(id).then(setTrust);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !vendor) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">
          Ce vendeur n'existe pas ou n'est pas encore vérifié.
        </p>
        <Button asChild variant="secondary">
          <Link to="/marche">
            <ArrowLeft className="size-4" /> Retour au marché
          </Link>
        </Button>
      </div>
    );
  }

  const memberSince = new Date(vendor.createdAt).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
  });

  const isPro = vendor.planTier === "pro";
  const hasBoutique = isPro && vendor.storeName;

  return (
    <div className="flex flex-col gap-8">
      {/* Bannière boutique (réservée aux Pro) */}
      {isPro && vendor.storeBannerUrl && (
        <div className="relative -mx-4 -mt-6 h-40 overflow-hidden sm:-mx-6 sm:h-56 md:-mt-8 md:h-64">
          <img
            src={vendor.storeBannerUrl}
            alt=""
            className="size-full object-cover"
          />
        </div>
      )}

      <div className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center",
        isPro && vendor.storeBannerUrl && "-mt-10 relative z-10",
      )}>
        {isPro && vendor.storeLogoUrl ? (
          <div className="size-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white">
            <img
              src={vendor.storeLogoUrl}
              alt={vendor.storeName ?? "Boutique"}
              className="size-full object-cover"
            />
          </div>
        ) : (
          <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-ink font-display text-2xl font-semibold text-brand-300">
            {(vendor.storeName ?? "J").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold">
            {hasBoutique ? vendor.storeName : "Vendeur vérifié"}
          </h1>
          {hasBoutique && vendor.storeDescription && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {vendor.storeDescription}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="success">
              <ShieldCheck className="size-3" /> Identité vérifiée
            </Badge>
            {isPro && (
              <Badge variant="ink">
                <Sparkles className="size-3" /> Vendeur Pro
              </Badge>
            )}
            <Badge variant="secondary">Membre depuis {memberSince}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={ShieldCheck}
          label="Score de confiance"
          value={trust ? `${trust.score}/100` : "…"}
        />
        <StatCard icon={Package} label="Articles en vente" value={String(products.length)} />
        <StatCard
          icon={Star}
          label="Avis reçus"
          value={
            reviews.length > 0 ? `${avgRating?.toFixed(1)}/5 · ${reviews.length}` : "Aucun"
          }
        />
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Articles de ce vendeur</h2>
        {products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card py-12 text-center text-muted-foreground">
            Ce vendeur n'a aucun article en vente pour l'instant.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

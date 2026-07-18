import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, PackageSearch } from "lucide-react";
import { publicProductsApi, type Product } from "@/api/products";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "", label: "Tout" },
  { value: "mode_beaute", label: "Mode & Beauté" },
  { value: "electronique", label: "Électronique" },
  { value: "maison", label: "Maison" },
  { value: "telephones", label: "Téléphones" },
  { value: "alimentation", label: "Alimentation" },
  { value: "autre", label: "Autre" },
];

function useProductListJsonLd(products: Product[]) {
  useEffect(() => {
    if (products.length === 0) return;
    const origin = window.location.origin;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: products.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${origin}/produit/${p.id}`,
        name: p.title,
      })),
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [products]);
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Skeleton className="aspect-[4/5] rounded-none" />
      <div className="space-y-2 p-3.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export function Marche() {
  usePageTitle("Marché : mode, électronique, maison et plus", {
    description:
      "Achète en toute confiance sur le marché en ligne ivoirien : vendeurs vérifiés, paiement séquestré jusqu'à ta confirmation de réception, livraison suivie.",
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [isLoading, setIsLoading] = useState(true);
  useProductListJsonLd(products);

  // Keep the input in sync when the global search bar changes the ?q= param.
  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    setIsLoading(true);
    const handle = setTimeout(() => {
      publicProductsApi
        .list({ category: category || undefined, search: search || undefined })
        .then((res) => setProducts(res.products))
        .catch(() => setProducts([]))
        .finally(() => setIsLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [category, search]);

  function updateSearch(value: string) {
    setSearch(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set("q", value);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="flex flex-col gap-6">

      <div className="sticky z-20 -mx-4 border-y border-border bg-background/90 px-4 py-3 backdrop-blur-lg md:top-[4.5rem]">
        <div className="flex items-center gap-3 rounded-full border border-border bg-white px-4 shadow-[var(--shadow-xs)] focus-within:border-brand-400 focus-within:ring-[3.5px] focus-within:ring-accent">
          <Search className="size-[18px] shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            placeholder="Rechercher un article, une marque…"
            aria-label="Rechercher sur le marché"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                category === c.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-brand-300 hover:bg-secondary",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-secondary text-muted-foreground">
            <PackageSearch className="size-7" />
          </span>
          <p className="max-w-sm text-muted-foreground">
            {search
              ? `Aucun résultat pour « ${search} ». Essaie un autre mot-clé ou une autre catégorie.`
              : "Aucun produit ici pour l'instant. Reviens bientôt ou essaie une autre catégorie."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
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

export function VendeurRecherche() {
  usePageTitle("Recherche produits", { description: "Explore les produits déjà en vente sur Djassa pour ta veille concurrentielle." });
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const handle = setTimeout(() => {
      publicProductsApi
        .list({ category: category || undefined, search: search || undefined, limit: 40 })
        .then((res) => setProducts(res.products))
        .catch(() => setProducts([]))
        .finally(() => setIsLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [category, search]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">Recherche produits</h1>
        <p className="mt-1 text-muted-foreground">
          Explore ce qui se vend déjà sur Djassa pour affiner ton offre — vue lecture seule, sans achat.
        </p>
      </header>

      <div className="flex items-center gap-3 rounded-full border border-border bg-white px-4 shadow-[var(--shadow-xs)] focus-within:border-brand-400 focus-within:ring-[3.5px] focus-within:ring-accent">
        <Search className="size-[18px] shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un article, une marque…"
          aria-label="Rechercher un produit"
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-secondary text-muted-foreground">
            <PackageSearch className="size-7" />
          </span>
          <p className="max-w-sm text-muted-foreground">Aucun résultat pour cette recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} readOnly />
          ))}
        </div>
      )}
    </div>
  );
}

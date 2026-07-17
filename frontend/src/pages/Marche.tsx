import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiClient } from "../api/client";
import type { Product } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { usePageTitle } from "../hooks/usePageTitle";
import "./Marche.css";

const CATEGORIES = [
  { value: "", label: "Tout" },
  { value: "mode_beaute", label: "Mode & Beauté" },
  { value: "electronique", label: "Électronique" },
  { value: "maison", label: "Maison" },
  { value: "telephones", label: "Téléphones" },
  { value: "alimentation", label: "Alimentation" },
  { value: "autre", label: "Autre" },
];

export function Marche() {
  usePageTitle("Marché");
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const query = category ? `?category=${category}` : "";
    apiClient
      .get<{ products: Product[] }>(`/api/public/products${query}`)
      .then((res) => setProducts(res.products))
      .finally(() => setIsLoading(false));
  }, [category]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => p.title.toLowerCase().includes(term));
  }, [products, search]);

  return (
    <div>
      <div className="page-header">
        <h1>Marché Jassa</h1>
        <p>Achète en toute confiance — les fonds restent bloqués jusqu'à ta confirmation de réception.</p>
      </div>

      <div className="marche-trust">
        <span className="marche-trust-item">Paiement protégé</span>
        <span className="marche-trust-item">Vendeurs vérifiés</span>
        <span className="marche-trust-item">Livraison suivie</span>
      </div>

      <input
        className="input marche-search"
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un produit..."
      />

      <div className="marche-chips">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            className={`marche-chip ${category === c.value ? "is-active" : ""}`}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="empty-state">Chargement...</div>
      ) : visibleProducts.length === 0 ? (
        <div className="empty-state">Aucun produit ici pour l'instant. Reviens bientôt ou essaie une autre catégorie.</div>
      ) : (
        <div className="marche-grid">
          {visibleProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

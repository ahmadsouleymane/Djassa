import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import type { Product } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { usePageTitle } from "../hooks/usePageTitle";
import "./Marche.css";

const CATEGORIES = [
  { value: "", label: "Toutes catégories" },
  { value: "mode_beaute", label: "Mode & Beauté" },
  { value: "electronique", label: "Électronique" },
  { value: "maison", label: "Maison & Vie quotidienne" },
  { value: "telephones", label: "Téléphones & Accessoires" },
  { value: "alimentation", label: "Alimentation" },
  { value: "autre", label: "Autre" },
];

export function Marche() {
  usePageTitle("Marché");
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const query = category ? `?category=${category}` : "";
    apiClient
      .get<{ products: Product[] }>(`/api/public/products${query}`)
      .then((res) => setProducts(res.products))
      .finally(() => setIsLoading(false));
  }, [category]);

  return (
    <div>
      <div className="page-header">
        <h1>Marché Jassa</h1>
        <p>Achète en toute confiance — les fonds restent bloqués jusqu'à ta confirmation de réception.</p>
      </div>
      <select className="input marche-filter" value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      {isLoading ? (
        <div className="empty-state">Chargement...</div>
      ) : products.length === 0 ? (
        <div className="empty-state">Aucun produit ici pour l'instant. Reviens bientôt ou essaie une autre catégorie.</div>
      ) : (
        <div className="marche-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import type { Product } from "../api/products";
import { ProductCard } from "../components/ProductCard";

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
      <h1>Marché DJASSA</h1>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <div>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

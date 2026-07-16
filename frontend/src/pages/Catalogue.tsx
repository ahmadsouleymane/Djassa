import { useEffect, useState } from "react";
import { productsApi, type Product } from "../api/products";
import { ProductForm } from "../components/ProductForm";

export function Catalogue() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    productsApi
      .listMine()
      .then((res) => setProducts(res.products))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Mon catalogue</h1>
        <p>Gère les produits que tu vends sur Jassa.</p>
      </div>
      <ProductForm onCreated={(product) => setProducts((prev) => [product, ...prev])} />
      {isLoading ? (
        <div className="empty-state">Chargement...</div>
      ) : products.length === 0 ? (
        <div className="empty-state">Aucun produit publié pour l'instant.</div>
      ) : (
        <ul className="card-list">
          {products.map((p) => (
            <li key={p.id} className="card">
              <strong>{p.title}</strong> <span className="price">{p.price.toLocaleString("fr-FR")} FCFA</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

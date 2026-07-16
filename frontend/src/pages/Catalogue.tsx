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
      <h1>Mon catalogue</h1>
      <ProductForm onCreated={(product) => setProducts((prev) => [product, ...prev])} />
      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <ul>
          {products.map((p) => (
            <li key={p.id}>
              {p.title} — {p.price} FCFA
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

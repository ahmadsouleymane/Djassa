import type { Product } from "../api/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article>
      {product.photos[0] && <img src={product.photos[0]} alt={product.title} width={200} />}
      <h3>{product.title}</h3>
      <p>{product.price.toLocaleString("fr-FR")} FCFA</p>
    </article>
  );
}

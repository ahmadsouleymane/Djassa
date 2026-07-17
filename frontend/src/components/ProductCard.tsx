import { Link } from "react-router-dom";
import type { Product } from "../api/products";
import { TrustBadge } from "./TrustBadge";
import "./ProductCard.css";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  return (
    <Link
      to={`/produit/${product.id}`}
      className="card product-card animate-in"
      style={{ ["--i" as string]: Math.min(index, 10) }}
    >
      <div className="product-card-image">
        {product.photos[0] ? <img src={product.photos[0]} alt={product.title} loading="lazy" /> : <span className="product-card-placeholder">Jassa</span>}
      </div>
      <div className="product-card-body">
        <h3>{product.title}</h3>
        <div className="product-card-meta">
          <span className="price">{product.price.toLocaleString("fr-FR")} FCFA</span>
          <TrustBadge vendorId={product.vendorId} />
        </div>
      </div>
    </Link>
  );
}

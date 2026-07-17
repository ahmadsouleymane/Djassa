import { useNavigate } from "react-router-dom";
import type { Product } from "../api/products";
import { conversationsApi } from "../api/conversations";
import { TrustBadge } from "./TrustBadge";
import "./ProductCard.css";

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();

  async function handleContact() {
    await conversationsApi.start(product.id);
    navigate("/messagerie");
  }

  return (
    <article className="card product-card">
      <div className="product-card-image">
        {product.photos[0] ? <img src={product.photos[0]} alt={product.title} /> : <span className="product-card-placeholder">Jassa</span>}
      </div>
      <div className="product-card-body">
        <h3>{product.title}</h3>
        <div className="product-card-meta">
          <span className="price">{product.price.toLocaleString("fr-FR")} FCFA</span>
          <TrustBadge vendorId={product.vendorId} />
        </div>
        <button className="btn btn-primary btn-sm product-card-cta" onClick={handleContact}>
          Contacter le vendeur
        </button>
      </div>
    </article>
  );
}

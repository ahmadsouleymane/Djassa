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
      {product.photos[0] && <img src={product.photos[0]} alt={product.title} />}
      <div className="product-card-body">
        <h3>{product.title}</h3>
        <span className="price">{product.price.toLocaleString("fr-FR")} FCFA</span>
        <TrustBadge vendorId={product.vendorId} />
        <button className="btn btn-secondary btn-sm" onClick={handleContact}>
          Contacter le vendeur
        </button>
      </div>
    </article>
  );
}

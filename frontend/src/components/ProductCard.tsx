import { useNavigate } from "react-router-dom";
import type { Product } from "../api/products";
import { conversationsApi } from "../api/conversations";

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();

  async function handleContact() {
    await conversationsApi.start(product.id);
    navigate("/messagerie");
  }

  return (
    <article>
      {product.photos[0] && <img src={product.photos[0]} alt={product.title} width={200} />}
      <h3>{product.title}</h3>
      <p>{product.price.toLocaleString("fr-FR")} FCFA</p>
      <button onClick={handleContact}>Contacter le vendeur</button>
    </article>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { publicProductsApi, type Product } from "../api/products";
import { conversationsApi } from "../api/conversations";
import { ApiError } from "../api/client";
import { reviewsApi, type Review } from "../api/reviews";
import { useAuth } from "../context/AuthContext";
import { TrustBadge } from "../components/TrustBadge";
import { usePageTitle } from "../hooks/usePageTitle";
import "./ProductDetail.css";

const CATEGORY_LABELS: Record<string, string> = {
  mode_beaute: "Mode & Beauté",
  electronique: "Électronique",
  maison: "Maison",
  telephones: "Téléphones",
  alimentation: "Alimentation",
  autre: "Autre",
};

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState<"message" | "order" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  usePageTitle(product?.title ?? "Produit");

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setNotFound(false);
    publicProductsApi
      .get(id)
      .then((res) => {
        setProduct(res.product);
        setActivePhoto(0);
        reviewsApi.listForVendor(res.product.vendorId).then((r) => setReviews(r.reviews));
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleMessage() {
    if (!product) return;
    if (!user) {
      navigate("/connexion");
      return;
    }
    setIsActing("message");
    setActionError(null);
    try {
      const { conversation } = await conversationsApi.start(product.id);
      navigate(`/messagerie/${conversation.id}`);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Impossible de démarrer la conversation.");
    } finally {
      setIsActing(null);
    }
  }

  async function handleOrderNow() {
    if (!product) return;
    if (!user) {
      navigate("/connexion");
      return;
    }
    setIsActing("order");
    setActionError(null);
    try {
      const { conversation } = await conversationsApi.start(product.id);
      await conversationsApi.sendMessage(
        conversation.id,
        `Je souhaite commander « ${product.title} » au prix affiché.`,
        product.price,
      );
      navigate(`/messagerie/${conversation.id}`);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Impossible de démarrer la commande.");
    } finally {
      setIsActing(null);
    }
  }

  if (isLoading) return <div className="empty-state">Chargement...</div>;
  if (notFound || !product) {
    return (
      <div className="empty-state">
        Ce produit n'existe plus ou n'est pas encore disponible.
        <div style={{ marginTop: "1rem" }}>
          <Link to="/marche" className="btn btn-secondary btn-sm">
            Retour au marché
          </Link>
        </div>
      </div>
    );
  }

  const photos = product.photos.length > 0 ? product.photos : [];
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return (
    <div className="pdp animate-in">
      <Link to="/marche" className="pdp-back">
        ← Retour au marché
      </Link>

      <div className="pdp-layout">
        <div className="pdp-gallery">
          <div className="pdp-gallery-main">
            {photos[activePhoto] ? (
              <img src={photos[activePhoto]} alt={product.title} />
            ) : (
              <span className="product-card-placeholder">Jassa</span>
            )}
          </div>
          {photos.length > 1 && (
            <div className="pdp-gallery-thumbs">
              {photos.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  className={`pdp-thumb ${i === activePhoto ? "is-active" : ""}`}
                  onClick={() => setActivePhoto(i)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdp-info">
          <span className="pill pill-neutral">{CATEGORY_LABELS[product.category] ?? product.category}</span>
          <h1>{product.title}</h1>
          <div className="pdp-price-row">
            <span className="price pdp-price">{product.price.toLocaleString("fr-FR")} FCFA</span>
            <TrustBadge vendorId={product.vendorId} />
          </div>

          <p className="pdp-description">{product.description}</p>

          {actionError && <p className="error-text" role="alert">{actionError}</p>}
          <div className="pdp-cta-row">
            <button className="btn btn-primary" onClick={handleOrderNow} disabled={isActing !== null}>
              {isActing === "order" ? "Un instant..." : "Commander directement"}
            </button>
            <button className="btn btn-secondary" onClick={handleMessage} disabled={isActing !== null}>
              {isActing === "message" ? "Un instant..." : "Envoyer un message"}
            </button>
          </div>
          <p className="pdp-cta-note">Le paiement reste bloqué jusqu'à ta confirmation de réception.</p>
        </div>
      </div>

      <div className="pdp-reviews">
        <h2>
          Avis sur ce vendeur
          {avgRating !== null && <span className="pdp-reviews-avg"> · {avgRating.toFixed(1)}/5</span>}
        </h2>
        {reviews.length === 0 ? (
          <p className="pdp-reviews-empty">Ce vendeur n'a pas encore d'avis.</p>
        ) : (
          <ul className="pdp-review-list">
            {reviews.map((r) => (
              <li key={r.id} className="card pdp-review">
                <div className="pdp-review-top">
                  <span className="pdp-review-stars" aria-label={`${r.rating} sur 5`}>
                    {"★".repeat(r.rating)}
                    <span className="pdp-review-stars-empty">{"★".repeat(5 - r.rating)}</span>
                  </span>
                  <span className="pdp-review-date">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
                <p>{r.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

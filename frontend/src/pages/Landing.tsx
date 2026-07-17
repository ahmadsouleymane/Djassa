import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import type { Product } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { usePageTitle } from "../hooks/usePageTitle";
import "./Landing.css";

export function Landing() {
  usePageTitle("Achète et vends en toute confiance");
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    apiClient.get<{ products: Product[] }>("/api/public/products?limit=6").then((res) => setFeatured(res.products));
  }, []);

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <span className="landing-kicker">Le marché en ligne ivoirien</span>
          <h1 className="landing-title">
            Achète et vends,
            <br />
            l'argent reste protégé.
          </h1>
          <p className="landing-subtitle">
            Sur Jassa, chaque commande passe par un séquestre : le paiement de l'acheteur reste bloqué jusqu'à sa
            confirmation de réception. Zéro arnaque, zéro mauvaise surprise.
          </p>
          <div className="landing-hero-cta">
            <Link to="/marche" className="btn btn-primary">
              Explorer le marché
            </Link>
            <Link to="/inscription" className="btn btn-secondary landing-cta-ghost">
              Créer un compte gratuitement
            </Link>
          </div>
          <div className="landing-hero-trust">
            <span>Paiement séquestré</span>
            <span>Vendeurs vérifiés</span>
            <span>Messagerie intégrée</span>
          </div>
        </div>
      </section>

      <section className="landing-section" id="comment-ca-marche">
        <div className="landing-section-head">
          <span className="landing-eyebrow">Comment ça marche</span>
          <h2>Trois étapes, zéro risque</h2>
        </div>
        <div className="landing-steps">
          <div className="landing-step animate-in" style={{ ["--i" as string]: 0 }}>
            <span className="landing-step-num">01</span>
            <h3>Parcours le marché</h3>
            <p>Trouve le produit qu'il te faut parmi des vendeurs vérifiés, dans toutes les catégories.</p>
          </div>
          <div className="landing-step animate-in" style={{ ["--i" as string]: 1 }}>
            <span className="landing-step-num">02</span>
            <h3>Discute et paie</h3>
            <p>Négocie directement avec le vendeur dans la messagerie, puis passe commande en toute transparence.</p>
          </div>
          <div className="landing-step animate-in" style={{ ["--i" as string]: 2 }}>
            <span className="landing-step-num">03</span>
            <h3>Reçois, confirme, c'est réglé</h3>
            <p>L'argent n'est versé au vendeur qu'après ta confirmation de réception. Un souci ? Tu peux ouvrir un litige.</p>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="landing-section">
          <div className="landing-section-head">
            <span className="landing-eyebrow">Fraîchement arrivé</span>
            <h2>Ça bouge sur le marché</h2>
          </div>
          <div className="landing-featured-grid">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
          <div className="landing-featured-more">
            <Link to="/marche" className="btn btn-secondary">
              Voir tout le marché →
            </Link>
          </div>
        </section>
      )}

      <section className="landing-section landing-features">
        <div className="landing-feature-card animate-in" style={{ ["--i" as string]: 0 }}>
          <h3>Séquestre automatique</h3>
          <p>Chaque commande bloque le paiement jusqu'à confirmation. Le vendeur n'est payé qu'une fois la livraison validée.</p>
        </div>
        <div className="landing-feature-card animate-in" style={{ ["--i" as string]: 1 }}>
          <h3>Vendeurs vérifiés</h3>
          <p>Chaque vendeur passe par une vérification d'identité avant d'apparaître sur le marché.</p>
        </div>
        <div className="landing-feature-card animate-in" style={{ ["--i" as string]: 2 }}>
          <h3>Négociation intégrée</h3>
          <p>Discute, envoie une offre, mets-toi d'accord — tout se passe dans la messagerie Jassa.</p>
        </div>
      </section>

      <section className="landing-cta-band">
        <h2>Prêt à essayer Jassa ?</h2>
        <p>Rejoins le marché où acheteurs et vendeurs se font confiance, commande après commande.</p>
        <Link to="/inscription" className="btn btn-primary landing-cta-band-btn">
          Créer mon compte
        </Link>
      </section>
    </div>
  );
}

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Footer.css";

export function Footer() {
  const { user } = useAuth();

  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="site-footer-brand">
          <span className="site-footer-word">
            Jassa<span className="nav-logo-dot" aria-hidden="true" />
          </span>
          <p>
            Le marché en ligne ivoirien où l'argent de l'acheteur reste bloqué jusqu'à sa confirmation de réception.
          </p>
        </div>

        <div className="site-footer-col">
          <h3>Acheter</h3>
          <Link to="/marche">Le marché</Link>
          <Link to="/#comment-ca-marche">Comment ça marche</Link>
          {user ? <Link to="/commandes">Mes commandes</Link> : <Link to="/inscription">Créer un compte</Link>}
        </div>

        <div className="site-footer-col">
          <h3>Vendre</h3>
          {user?.accountType === "vendeur" ? (
            <>
              <Link to="/catalogue">Mon catalogue</Link>
              <Link to="/abonnement">Abonnement</Link>
              <Link to="/verification">Vérification</Link>
            </>
          ) : (
            <Link to="/inscription">Devenir vendeur</Link>
          )}
        </div>

        <div className="site-footer-col">
          <h3>Confiance</h3>
          <Link to="/#comment-ca-marche">Le séquestre Jassa</Link>
          <Link to="/marche">Vendeurs vérifiés</Link>
        </div>
      </div>
      <div className="container site-footer-bottom">
        <span>© {new Date().getFullYear()} Jassa. Fait avec confiance en Côte d'Ivoire.</span>
      </div>
    </footer>
  );
}

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import "./Dashboard.css";

export function Dashboard() {
  usePageTitle("Tableau de bord");
  const { user } = useAuth();
  const isVendeur = user?.accountType === "vendeur";

  return (
    <div>
      <div className="page-header">
        <h1>Bonjour</h1>
        <p>
          {isVendeur
            ? "Ta boutique est prête. Ajoute un produit, réponds vite aux acheteurs — la confiance se construit commande après commande."
            : "Explore le Marché et achète en toute confiance : ton argent reste protégé jusqu'à ta confirmation de réception."}
        </p>
      </div>

      <div className="dash-grid">
        <Link to="/marche" className="card dash-card is-primary animate-in" style={{ ["--i" as string]: 0 }}>
          <span className="dash-card-kicker">Découvrir</span>
          <h3>Marché</h3>
          <p>Parcours les nouveautés et trouve ta prochaine trouvaille.</p>
          <span className="dash-card-go">Explorer →</span>
        </Link>

        {isVendeur ? (
          <>
            <Link to="/catalogue" className="card dash-card animate-in" style={{ ["--i" as string]: 1 }}>
              <span className="dash-card-kicker">Vendre</span>
              <h3>Mon catalogue</h3>
              <p>Publie un nouveau produit ou gère ton offre actuelle.</p>
              <span className="dash-card-go">Gérer →</span>
            </Link>
            <Link to="/verification" className="card dash-card animate-in" style={{ ["--i" as string]: 2 }}>
              <span className="dash-card-kicker">Confiance</span>
              <h3>Vérification</h3>
              <p>Fais vérifier ton identité pour être visible sur le Marché.</p>
              <span className="dash-card-go">Vérifier →</span>
            </Link>
            <Link to="/abonnement" className="card dash-card animate-in" style={{ ["--i" as string]: 3 }}>
              <span className="dash-card-kicker">Croissance</span>
              <h3>Abonnement</h3>
              <p>Passe Pro pour une commission réduite et plus de visibilité.</p>
              <span className="dash-card-go">Voir les paliers →</span>
            </Link>
          </>
        ) : (
          <Link to="/commandes" className="card dash-card animate-in" style={{ ["--i" as string]: 1 }}>
            <span className="dash-card-kicker">Suivi</span>
            <h3>Mes commandes</h3>
            <p>Suis le statut de tes achats jusqu'à la livraison.</p>
            <span className="dash-card-go">Voir mes commandes →</span>
          </Link>
        )}

        <Link to="/messagerie" className="card dash-card animate-in" style={{ ["--i" as string]: isVendeur ? 4 : 2 }}>
          <span className="dash-card-kicker">Échanger</span>
          <h3>Messagerie</h3>
          <p>Discute avec {isVendeur ? "tes acheteurs" : "les vendeurs"} et négocie un prix.</p>
          <span className="dash-card-go">Ouvrir →</span>
        </Link>
      </div>
    </div>
  );
}

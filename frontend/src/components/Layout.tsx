import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Layout.css";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/connexion");
  }

  return (
    <>
      <header className="nav">
        <div className="container nav-inner">
          <Link to={user ? "/tableau-de-bord" : "/marche"} className="nav-logo">
            Jassa
          </Link>
          <nav className="nav-links">
            <Link to="/marche">Marché</Link>
            {user && <Link to="/messagerie">Messagerie</Link>}
            {user && <Link to="/commandes">Commandes</Link>}
            {user?.accountType === "vendeur" && <Link to="/catalogue">Catalogue</Link>}
            {user?.accountType === "vendeur" && <Link to="/abonnement">Abonnement</Link>}
            {user?.accountType === "vendeur" && <Link to="/verification">Vérification</Link>}
          </nav>
          <div className="nav-actions">
            {user ? (
              <>
                <span className="nav-user">{user.email}</span>
                <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/connexion" className="btn btn-secondary btn-sm">
                  Connexion
                </Link>
                <Link to="/inscription" className="btn btn-primary btn-sm">
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="page">
        <div className="container">{children}</div>
      </main>
    </>
  );
}

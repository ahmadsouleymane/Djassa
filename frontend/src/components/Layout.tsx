import { type ReactNode, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Footer } from "./Footer";
import "./Layout.css";

function IconMarket() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h16l-1.2 11.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L4 8Z" />
      <path d="M8 8V6a4 4 0 0 1 8 0v2" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  function handleLogout() {
    setIsSheetOpen(false);
    logout();
    navigate("/connexion");
  }

  function isActive(path: string) {
    return location.pathname === path;
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    navigate(q ? `/marche?q=${encodeURIComponent(q)}` : "/marche");
  }

  return (
    <>
      <header className="nav">
        <div className="container nav-inner">
          <Link to="/marche" className="nav-logo">
            Jassa<span className="nav-logo-dot" aria-hidden="true" />
          </Link>
          <nav className="nav-links">
            <Link to="/marche">Marché</Link>
            {user && <Link to="/messagerie">Messagerie</Link>}
            {user && <Link to="/commandes">Commandes</Link>}
            {user?.accountType === "vendeur" && <Link to="/catalogue">Catalogue</Link>}
            {user?.accountType === "vendeur" && <Link to="/abonnement">Abonnement</Link>}
            {user?.accountType === "vendeur" && <Link to="/verification">Vérification</Link>}
          </nav>
          <form className="nav-search" onSubmit={handleSearchSubmit}>
            <IconSearch />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Rechercher sur Jassa..."
              aria-label="Rechercher un produit"
            />
          </form>
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

      <Footer />

      <nav className="bottom-nav">
        <Link to="/marche" className={`bottom-nav-item ${isActive("/marche") ? "is-active" : ""}`}>
          <IconMarket />
          <span>Marché</span>
        </Link>
        {user && (
          <Link to="/messagerie" className={`bottom-nav-item ${location.pathname.startsWith("/messagerie") ? "is-active" : ""}`}>
            <IconChat />
            <span>Messages</span>
          </Link>
        )}
        {user && (
          <Link to="/commandes" className={`bottom-nav-item ${isActive("/commandes") ? "is-active" : ""}`}>
            <IconBox />
            <span>Commandes</span>
          </Link>
        )}
        <button
          type="button"
          className={`bottom-nav-item ${isSheetOpen ? "is-active" : ""}`}
          onClick={() => setIsSheetOpen(true)}
        >
          <IconUser />
          <span>Compte</span>
        </button>
      </nav>

      {isSheetOpen && (
        <div className="sheet-backdrop" onClick={() => setIsSheetOpen(false)}>
          <div className="account-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="account-sheet-handle" />
            {user ? (
              <>
                <p className="account-sheet-email">{user.email}</p>
                {user.accountType === "vendeur" && (
                  <div className="account-sheet-links">
                    <Link to="/catalogue" onClick={() => setIsSheetOpen(false)}>
                      Catalogue
                    </Link>
                    <Link to="/abonnement" onClick={() => setIsSheetOpen(false)}>
                      Abonnement
                    </Link>
                    <Link to="/verification" onClick={() => setIsSheetOpen(false)}>
                      Vérification
                    </Link>
                  </div>
                )}
                <button className="btn btn-secondary" onClick={handleLogout}>
                  Déconnexion
                </button>
              </>
            ) : (
              <div className="account-sheet-auth">
                <Link to="/connexion" className="btn btn-secondary" onClick={() => setIsSheetOpen(false)}>
                  Connexion
                </Link>
                <Link to="/inscription" className="btn btn-primary" onClick={() => setIsSheetOpen(false)}>
                  Inscription
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { usePageTitle } from "../hooks/usePageTitle";

export function Login() {
  usePageTitle("Connexion");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/marche");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de connexion");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div>
          <div className="auth-brand-word">Jassa</div>
          <p className="auth-brand-tag">Le marché en ligne ivoirien où l'argent reste bloqué jusqu'à ta confirmation de réception.</p>
        </div>
        <ul className="auth-brand-list">
          <li>Séquestre automatique sur chaque commande</li>
          <li>Vendeurs vérifiés par pièce d'identité</li>
          <li>Messagerie et négociation intégrées</li>
        </ul>
      </div>
      <div className="auth-form-side">
        <form className="auth-card animate-in" onSubmit={handleSubmit}>
          <span className="auth-kicker">Connexion</span>
          <h1>Content de te revoir</h1>
          <p style={{ color: "var(--ink-2)", marginBottom: "1.5rem" }}>Connecte-toi à ton compte</p>
          {error && <p className="error-text" role="alert">{error}</p>}
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@exemple.com"
              required
            />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </button>
          <p className="auth-switch">
            Pas de compte ? <Link to="/inscription">Créer un compte</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

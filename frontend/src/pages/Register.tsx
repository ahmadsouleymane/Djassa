import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { usePageTitle } from "../hooks/usePageTitle";

export function Register() {
  usePageTitle("Créer un compte");
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"vendeur" | "client">("client");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register(email, password, accountType);
      navigate("/marche");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur d'inscription");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div>
          <div className="auth-brand-word">Jassa</div>
          <p className="auth-brand-tag">Rejoins le marché où acheteurs et vendeurs se font confiance, commande après commande.</p>
        </div>
        <ul className="auth-brand-list">
          <li>Publie tes produits en quelques minutes</li>
          <li>Reçois les paiements en toute sécurité</li>
          <li>Construis ta réputation avec des avis vérifiés</li>
        </ul>
      </div>
      <div className="auth-form-side">
        <form className="auth-card animate-in" onSubmit={handleSubmit}>
          <span className="auth-kicker">Inscription</span>
          <h1>Rejoins Jassa</h1>
          <p style={{ color: "var(--ink-2)", marginBottom: "1.5rem" }}>Crée ton compte en une minute</p>
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
              placeholder="8 caractères min."
              required
            />
          </div>
          <div className="field">
            <label>Je suis</label>
            <select
              className="input"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as "vendeur" | "client")}
            >
              <option value="client">Acheteur</option>
              <option value="vendeur">Vendeur</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Création..." : "S'inscrire"}
          </button>
          <p className="auth-switch">
            Déjà un compte ? <Link to="/connexion">Se connecter</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

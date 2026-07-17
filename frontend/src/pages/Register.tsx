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
      navigate("/tableau-de-bord");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur d'inscription");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Jassa</h1>
        <p style={{ color: "var(--text2)", marginBottom: "1.5rem" }}>Crée ton compte</p>
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
  );
}

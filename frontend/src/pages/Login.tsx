import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/tableau-de-bord");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de connexion");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Connexion</h1>
      {error && <p role="alert">{error}</p>}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
        required
      />
      <button type="submit">Se connecter</button>
      <p>
        Pas de compte ? <Link to="/inscription">Créer un compte</Link>
      </p>
    </form>
  );
}

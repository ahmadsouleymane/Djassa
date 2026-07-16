import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"vendeur" | "client">("client");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register(email, password, accountType);
      navigate("/tableau-de-bord");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur d'inscription");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Créer un compte</h1>
      {error && <p role="alert">{error}</p>}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe (8 caractères min.)"
        required
      />
      <select value={accountType} onChange={(e) => setAccountType(e.target.value as "vendeur" | "client")}>
        <option value="client">Acheteur</option>
        <option value="vendeur">Vendeur</option>
      </select>
      <button type="submit">S'inscrire</button>
    </form>
  );
}

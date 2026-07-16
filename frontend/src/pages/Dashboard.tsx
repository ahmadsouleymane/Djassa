import { useAuth } from "../context/AuthContext";

export function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div>
      <h1>Tableau de bord</h1>
      <p>
        Connecté en tant que {user?.email} ({user?.accountType})
      </p>
      <button onClick={logout}>Se déconnecter</button>
    </div>
  );
}

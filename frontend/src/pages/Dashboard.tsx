import { useAuth } from "../context/AuthContext";

export function Dashboard() {
  const { user } = useAuth();
  const isVendeur = user?.accountType === "vendeur";

  return (
    <div className="page-header">
      <h1>Bonjour</h1>
      <p>
        {isVendeur
          ? "Ta boutique est prête. Ajoute un produit, réponds vite aux acheteurs — la confiance se construit commande après commande."
          : "Explore le Marché et achète en toute confiance : ton argent reste protégé jusqu'à ta confirmation de réception."}
      </p>
    </div>
  );
}

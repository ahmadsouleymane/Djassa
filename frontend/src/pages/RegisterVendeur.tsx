import { RegisterForm } from "../components/RegisterForm";
import { usePageTitle } from "../hooks/usePageTitle";

export function RegisterVendeur() {
  usePageTitle("Créer un compte vendeur", {
    description: "Vends sur Djassa et reçois tes paiements en toute sécurité, sans risque d'impayé grâce au séquestre.",
  });

  return (
    <RegisterForm
      accountType="vendeur"
      kicker="Inscription vendeur"
      title="Vends sur Djassa"
      lead="Crée ton compte vendeur en une minute"
      brandTag="Publie tes produits, discute avec tes acheteurs et sois payé sans risque : le séquestre Djassa garantit ton paiement."
      brandBullets={[
        "Paiement garanti dès la commande passée",
        "5% de commission identique pour tous les paliers",
        "Vérification d'identité en 24 à 72h",
      ]}
      redirectTo="/vendeur/dashboard"
      switchPrompt="Tu viens plutôt acheter ?"
      switchLinkTo="/inscription"
      switchLinkLabel="Crée un compte acheteur"
    />
  );
}

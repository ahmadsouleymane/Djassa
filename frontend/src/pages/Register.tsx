import { RegisterForm } from "../components/RegisterForm";
import { usePageTitle } from "../hooks/usePageTitle";

export function Register() {
  usePageTitle("Créer un compte acheteur", {
    description: "Crée ton compte Djassa gratuitement et achète en toute confiance : ton argent reste protégé jusqu'à réception.",
  });

  return (
    <RegisterForm
      accountType="client"
      kicker="Inscription acheteur"
      title="Rejoins Djassa"
      lead="Crée ton compte en une minute"
      brandTag="Achète en toute confiance sur le marché où l'argent reste protégé jusqu'à ta confirmation de réception."
      brandBullets={[
        "Ton paiement reste bloqué jusqu'à la réception",
        "Vendeurs vérifiés par pièce d'identité",
        "Négocie ou achète directement, au choix",
      ]}
      redirectTo="/marche"
      switchPrompt="Tu veux vendre sur Djassa ?"
      switchLinkTo="/inscription-vendeur"
      switchLinkLabel="Crée un compte vendeur"
    />
  );
}

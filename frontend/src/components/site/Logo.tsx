// components/site/Logo.tsx
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  variant?: "default" | "light"; // "default" = noir, "light" = blanc
  to?: string;
};

export function Logo({ className, variant = "default", to = "/" }: LogoProps) {
  // On choisit le fichier SVG en fonction de la variante
  const logoSrc =
    variant === "light"
      ? "/logo-light.svg"   // blanc sur fond sombre
      : "/logo-dark.svg";   // noir sur fond clair

  return (
    <Link
      to={to}
      aria-label="Djassa, accueil"
      className={cn("inline-flex items-center gap-2.5 no-underline", className)}
    >
      <img
        src={logoSrc}
        alt="Djassa"
        className="h-9 w-auto" // ajuste la hauteur selon ton design
      />
    </Link>
  );
}
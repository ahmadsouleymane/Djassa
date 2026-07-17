import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";

export function NotFound() {
  usePageTitle("Page introuvable");

  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="font-display text-7xl font-semibold text-primary">404</p>
      <h1 className="text-2xl font-semibold">Cette page n'existe pas</h1>
      <p className="max-w-sm text-muted-foreground">
        Le lien est peut-être cassé ou la page a été déplacée.
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link to="/marche">Aller au marché</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/contact">Signaler un lien cassé</Link>
        </Button>
      </div>
    </div>
  );
}

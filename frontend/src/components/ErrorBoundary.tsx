import { Component, type ReactNode } from "react";
import { trackError } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    trackError(error.message, { stack: error.stack?.slice(0, 1000), componentStack: info.componentStack.slice(0, 1000) });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-[100dvh] place-items-center px-6 text-center">
          <div>
            <h1 className="font-display text-2xl font-semibold">Un imprévu est survenu</h1>
            <p className="mt-2 text-muted-foreground">
              Cette page a rencontré une erreur. Réessaie, l'incident a été enregistré.
            </p>
            <Button className="mt-5" onClick={() => window.location.assign("/")}>
              Retour à l'accueil
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

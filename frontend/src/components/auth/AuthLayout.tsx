import { Link } from "react-router-dom";
import { Check, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { AmbientBackground } from "@/components/visual/AmbientBackground";

type AuthLayoutProps = {
  children: React.ReactNode;
  tagline: string;
  bullets: string[];
};

export function AuthLayout({ children, tagline, bullets }: AuthLayoutProps) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* Brand side */}
      <aside className="grain relative hidden overflow-hidden bg-surface-1 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <AmbientBackground />
        <div className="relative">
          <Logo variant="light" />
        </div>
        <div className="relative">
          <p className="max-w-md font-display text-3xl leading-tight font-semibold">
            {tagline}
          </p>
          <ul className="mt-8 space-y-4">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-white/80">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-500/25 text-brand-300">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span className="text-[0.95rem]">{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-sm text-white/45">
          © {new Date().getFullYear()} Djassa. Confiance en Côte d'Ivoire.
        </div>
      </aside>

      {/* Form side */}
      <main className="flex flex-col bg-background">
        <div className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Logo />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground no-underline"
          >
            <ArrowLeft className="size-4" /> Accueil
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="w-full max-w-[24rem]">{children}</div>
        </div>
      </main>
    </div>
  );
}

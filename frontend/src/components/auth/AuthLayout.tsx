import { Link } from "react-router-dom";
import { Check, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/site/Logo";

type AuthLayoutProps = {
  children: React.ReactNode;
  tagline: string;
  bullets: string[];
};

export function AuthLayout({ children, tagline, bullets }: AuthLayoutProps) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* Brand side */}
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(45rem 30rem at 10% 10%, rgba(0,178,93,0.32), transparent 55%), radial-gradient(40rem 30rem at 100% 100%, rgba(23,195,119,0.18), transparent 50%)",
          }}
        />
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
          © {new Date().getFullYear()} Jassa. Confiance en Côte d'Ivoire.
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

import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/admin", label: "Vue d'ensemble" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/verifications", label: "Vendeurs" },
  { to: "/admin/litiges", label: "Litiges" },
  { to: "/admin/signalements", label: "Signalements" },
  { to: "/admin/emails", label: "Emails" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">Administration</p>
        <h1 className="mt-1 text-3xl font-semibold md:text-4xl">Tableau de bord Djassa</h1>
      </header>

      <nav className="flex gap-1 overflow-x-auto rounded-full bg-secondary p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const active = location.pathname === tab.to;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold no-underline transition-colors",
                active ? "bg-white text-foreground shadow-[var(--shadow-xs)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}

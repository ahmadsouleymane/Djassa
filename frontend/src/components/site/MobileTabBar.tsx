import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, MessageCircle, Package, User, LayoutDashboard, PackageSearch } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const { user } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const isVendorAccount = user?.accountType === "vendeur";

  const items = [
    isVendorAccount
      ? { to: "/vendeur/dashboard", label: "Dashboard", icon: LayoutDashboard, match: (p: string) => p === "/vendeur/dashboard" }
      : { to: "/marche", label: "Marché", icon: Home, match: (p: string) => p === "/marche" },
    isVendorAccount
      ? { to: "/vendeur/recherche", label: "Recherche", icon: PackageSearch, match: (p: string) => p === "/vendeur/recherche" }
      : {
          to: "/panier",
          label: "Panier",
          icon: ShoppingBag,
          badge: count,
          match: (p: string) => p === "/panier",
        },
    user && {
      to: "/messagerie",
      label: "Messages",
      icon: MessageCircle,
      match: (p: string) => p.startsWith("/messagerie"),
    },
    user && {
      to: "/commandes",
      label: "Commandes",
      icon: Package,
      match: (p: string) => p === "/commandes",
    },
    {
      to: user ? "/verification" : "/connexion",
      label: "Compte",
      icon: User,
      match: (p: string) => ["/verification", "/connexion", "/abonnement"].includes(p),
    },
  ].filter(Boolean) as {
    to: string;
    label: string;
    icon: typeof Home;
    badge?: number;
    match: (p: string) => boolean;
  }[];

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
    >
      <div className="flex items-stretch justify-around">
        {items.map((item) => {
          const active = item.match(location.pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium no-underline transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span className="relative">
                <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 1.9} />
                {item.badge ? (
                  <span className="absolute -top-1.5 -right-2 grid min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[0.6rem] font-bold leading-4 text-primary-foreground tabular">
                    {item.badge}
                  </span>
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

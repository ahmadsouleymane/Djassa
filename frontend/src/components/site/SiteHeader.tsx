import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Menu,
  ShieldCheck,
  Store,
  LogOut,
  Package,
  MessageCircle,
  BadgeCheck,
  CreditCard,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV_LINKS = [
  { to: "/marche", label: "Marché" },
  { to: "/comment-ca-marche", label: "Comment ça marche" },
];

function SearchField({
  onSubmit,
  className,
  autoFocus,
}: {
  onSubmit: (q: string) => void;
  className?: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      role="search"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmit(value.trim());
      }}
      className={cn(
        "group flex h-11 items-center gap-2.5 rounded-full border border-border bg-secondary/70 px-4 transition-colors focus-within:border-brand-400 focus-within:bg-white focus-within:ring-[3.5px] focus-within:ring-accent",
        className,
      )}
    >
      <Search className="size-[18px] shrink-0 text-muted-foreground" />
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Rechercher un article, une marque…"
        aria-label="Rechercher sur Jassa"
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/80"
      />
    </form>
  );
}

export function SiteHeader() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  function runSearch(q: string) {
    setMobileSearchOpen(false);
    setMenuOpen(false);
    navigate(q ? `/marche?q=${encodeURIComponent(q)}` : "/marche");
  }

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/connexion");
  }

  const isActive = (path: string) =>
    path === "/marche"
      ? location.pathname === path
      : location.pathname.startsWith(path);

  const emailInitial = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 md:h-[4.5rem] md:gap-5">
        {/* Mobile: menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
          className="grid size-10 shrink-0 place-items-center rounded-full text-foreground hover:bg-secondary md:hidden"
        >
          <Menu className="size-6" />
        </button>

        <Logo to={user ? "/marche" : "/"} className="shrink-0" />

        {/* Desktop nav links */}
        <nav className="ml-1 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium no-underline transition-colors",
                isActive(link.to)
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop search */}
        <SearchField
          onSubmit={runSearch}
          className="mx-auto hidden w-full max-w-md md:flex"
        />

        <div className="ml-auto flex items-center gap-1.5 md:gap-2.5">
          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label="Rechercher"
            aria-expanded={mobileSearchOpen}
            className="grid size-10 place-items-center rounded-full text-foreground hover:bg-secondary md:hidden"
          >
            <Search className="size-[22px]" />
          </button>

          {/* Sell CTA (desktop) */}
          {user?.accountType === "vendeur" ? (
            <Button
              asChild
              variant="soft"
              size="sm"
              className="hidden md:inline-flex"
            >
              <Link to="/catalogue">
                <LayoutGrid className="size-4" />
                Catalogue
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="soft"
              size="sm"
              className="hidden md:inline-flex"
            >
              <Link to="/vendre">
                <Store className="size-4" />
                Vendre
              </Link>
            </Button>
          )}

          {/* Cart */}
          <Link
            to="/panier"
            aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}
            className="relative grid size-10 place-items-center rounded-full text-foreground hover:bg-secondary"
          >
            <ShoppingBag className="size-[22px]" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.7rem] font-bold leading-5 text-primary-foreground tabular">
                {count}
              </span>
            )}
          </Link>

          {/* Account */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Mon compte"
                  className="hidden rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35 md:block"
                >
                  <Avatar className="size-10 border border-border">
                    <AvatarFallback>{emailInitial}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="normal-case">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {user.email}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {user.accountType === "vendeur" ? "Compte vendeur" : "Compte acheteur"}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/commandes">
                    <Package /> Mes commandes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/messagerie">
                    <MessageCircle /> Messagerie
                  </Link>
                </DropdownMenuItem>
                {user.accountType === "vendeur" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/catalogue">
                        <LayoutGrid /> Mon catalogue
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/verification">
                        <BadgeCheck /> Vérification
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/abonnement">
                        <CreditCard /> Abonnement
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                {user.isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/verifications">
                        <ShieldCheck /> Admin vérifications
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
                  <LogOut /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost" size="sm">
                <Link to="/connexion">Connexion</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/inscription">Inscription</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile expanding search */}
      {mobileSearchOpen && (
        <div className="border-t border-border px-4 py-3 md:hidden">
          <SearchField onSubmit={runSearch} autoFocus />
        </div>
      )}

      {/* Mobile menu sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[20rem] p-0">
          <SheetHeader className="border-b border-border">
            <SheetTitle className="flex items-center">
              <Logo to={user ? "/marche" : "/"} />
            </SheetTitle>
            <SheetDescription className="sr-only">
              Menu principal Jassa
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-1 overflow-y-auto p-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-[0.95rem] font-medium text-foreground no-underline hover:bg-secondary"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to={user?.accountType === "vendeur" ? "/catalogue" : "/vendre"}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-3 text-[0.95rem] font-medium text-foreground no-underline hover:bg-secondary"
            >
              <Store className="size-5 text-primary" />
              {user?.accountType === "vendeur" ? "Mon catalogue" : "Vendre sur Jassa"}
            </Link>

            {user ? (
              <>
                <div className="my-2 h-px bg-border" />
                <p className="truncate px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {user.email}
                </p>
                <Link
                  to="/commandes"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-[0.95rem] font-medium text-foreground no-underline hover:bg-secondary"
                >
                  Mes commandes
                </Link>
                <Link
                  to="/messagerie"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-[0.95rem] font-medium text-foreground no-underline hover:bg-secondary"
                >
                  Messagerie
                </Link>
                {user.isAdmin && (
                  <Link
                    to="/admin/verifications"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-3 text-[0.95rem] font-medium text-foreground no-underline hover:bg-secondary"
                  >
                    Admin vérifications
                  </Link>
                )}
                <Button variant="secondary" className="mt-3" onClick={handleLogout}>
                  <LogOut className="size-4" /> Déconnexion
                </Button>
              </>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                <Button asChild variant="secondary">
                  <Link to="/connexion" onClick={() => setMenuOpen(false)}>
                    Connexion
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/inscription" onClick={() => setMenuOpen(false)}>
                    Créer un compte
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

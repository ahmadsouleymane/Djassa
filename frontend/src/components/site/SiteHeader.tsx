import { useState, useEffect, type FormEvent } from "react";
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

const NAV_LINKS = [{ to: "/marche", label: "Marché" }];

function SearchField({
  onSubmit,
  className,
  autoFocus,
  onDark,
}: {
  onSubmit: (q: string) => void;
  className?: string;
  autoFocus?: boolean;
  onDark?: boolean;
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
        "group flex h-11 items-center gap-2.5 rounded-full border px-4 transition-colors",
        onDark
          ? "border-white/15 bg-white/10 focus-within:border-white/40 focus-within:bg-white/15 focus-within:ring-[3.5px] focus-within:ring-white/10"
          : "border-border bg-secondary/70 focus-within:border-brand-400 focus-within:bg-white focus-within:ring-[3.5px] focus-within:ring-accent",
        className,
      )}
    >
      <Search className={cn("size-[18px] shrink-0", onDark ? "text-white/60" : "text-muted-foreground")} />
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Rechercher un article, une marque…"
        aria-label="Rechercher sur Djassa"
        className={cn(
          "w-full bg-transparent text-sm outline-none",
          onDark ? "text-white placeholder:text-white/50" : "placeholder:text-muted-foreground/80",
        )}
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Pages with a dark immersive hero: header stays transparent (light text) at
  // the top, then turns into a frosted light bar once the user scrolls past it.
  const darkHeroPage = location.pathname === "/" || location.pathname === "/vendre";
  const dark = darkHeroPage && !scrolled;

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
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-300",
        dark
          ? "border-transparent bg-transparent"
          : "border-border/70 bg-background/80 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 md:h-[4.5rem] md:gap-5">
        {/* Mobile: menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full md:hidden",
            dark ? "text-white hover:bg-white/10" : "text-foreground hover:bg-secondary",
          )}
        >
          <Menu className="size-6" />
        </button>

        <Logo to={user ? "/marche" : "/"} variant={dark ? "light" : "default"} className="shrink-0" />

        {/* Desktop nav links */}
        <nav className="ml-1 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium no-underline transition-colors",
                isActive(link.to)
                  ? dark
                    ? "bg-white/10 text-white"
                    : "bg-secondary text-foreground"
                  : dark
                    ? "text-white/75 hover:bg-white/10 hover:text-white"
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
          onDark={dark}
          className="mx-auto hidden w-full max-w-md md:flex"
        />

        <div className="ml-auto flex items-center gap-1.5 md:gap-2.5">
          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label="Rechercher"
            aria-expanded={mobileSearchOpen}
            className={cn(
              "grid size-10 place-items-center rounded-full md:hidden",
              dark ? "text-white hover:bg-white/10" : "text-foreground hover:bg-secondary",
            )}
          >
            <Search className="size-[22px]" />
          </button>

          {/* Sell CTA (desktop) */}
          {user?.accountType === "vendeur" ? (
            <Button
              asChild
              variant={dark ? "outline" : "soft"}
              size="sm"
              className={cn(
                "hidden md:inline-flex",
                dark && "border-white/25 bg-white/5 text-white hover:border-white/40 hover:bg-white/10",
              )}
            >
              <Link to="/catalogue">
                <LayoutGrid className="size-4" />
                Catalogue
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              variant={dark ? "outline" : "soft"}
              size="sm"
              className={cn(
                "hidden md:inline-flex",
                dark && "border-white/25 bg-white/5 text-white hover:border-white/40 hover:bg-white/10",
              )}
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
            className={cn(
              "relative grid size-10 place-items-center rounded-full",
              dark ? "text-white hover:bg-white/10" : "text-foreground hover:bg-secondary",
            )}
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
                  <Avatar className={cn("size-10 border", dark ? "border-white/30" : "border-border")}>
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
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(dark && "text-white hover:bg-white/10 hover:text-white")}
              >
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
              Menu principal Djassa
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
              {user?.accountType === "vendeur" ? "Mon catalogue" : "Vendre sur Djassa"}
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

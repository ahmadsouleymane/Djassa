import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, BadgeCheck, Headset } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";

const TRUST = [
  { icon: ShieldCheck, label: "Paiement séquestre" },
  { icon: BadgeCheck, label: "Vendeurs vérifiés" },
  { icon: Headset, label: "Support Côte d'Ivoire" },
];

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-sm font-semibold tracking-wide text-white/95 uppercase">
        {title}
      </h3>
      <nav className="flex flex-col gap-2.5 text-[0.9rem] text-white/65">{children}</nav>
    </div>
  );
}

const linkCls =
  "w-fit text-white/65 no-underline transition-colors hover:text-white";

export function SiteFooter() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");

  function handleNewsletter(e: FormEvent) {
    e.preventDefault();
    const mailto = `mailto:support@djassa.ci?subject=${encodeURIComponent(
      "Inscription newsletter Djassa",
    )}&body=${encodeURIComponent(
      `Merci de m'ajouter à la newsletter Djassa.\n\nMon email : ${email}`,
    )}`;
    window.location.href = mailto;
  }

  return (
    <footer className="mt-auto bg-ink text-white">
      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-6 md:justify-between">
          {TRUST.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-2.5 text-sm font-semibold text-white/85"
            >
              <span className="grid size-9 place-items-center rounded-full bg-white/10 text-brand-300">
                <Icon className="size-[18px]" />
              </span>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-8">
        <div className="flex flex-col gap-4">
          <Logo variant="light" to={user ? "/marche" : "/"} />
          <p className="max-w-xs text-[0.9rem] leading-relaxed text-white/60">
            Le marché en ligne ivoirien où l'argent de l'acheteur reste bloqué
            jusqu'à sa confirmation de réception.
          </p>
          <form onSubmit={handleNewsletter} className="mt-2 flex flex-col gap-2">
            <label
              htmlFor="footer-newsletter"
              className="text-sm font-medium text-white/80"
            >
              Reste informé des nouveautés
            </label>
            <div className="flex gap-2">
              <input
                id="footer-newsletter"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@exemple.com"
                className="h-11 w-full min-w-0 rounded-lg border border-white/15 bg-white/5 px-3.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-brand-300 focus:ring-[3px] focus:ring-brand-500/25"
              />
              <Button type="submit" className="shrink-0">
                S'inscrire
              </Button>
            </div>
          </form>
        </div>

        <FooterCol title="Acheter">
          <Link className={linkCls} to="/marche">Le marché</Link>
          <Link className={linkCls} to="/panier">Mon panier</Link>
          <Link className={linkCls} to="/comment-ca-marche">Comment ça marche</Link>
          {user ? (
            <Link className={linkCls} to="/commandes">Mes commandes</Link>
          ) : (
            <Link className={linkCls} to="/inscription">Créer un compte</Link>
          )}
        </FooterCol>

        <FooterCol title="Vendre">
          {user?.accountType === "vendeur" ? (
            <>
              <Link className={linkCls} to="/catalogue">Mon catalogue</Link>
              <Link className={linkCls} to="/abonnement">Abonnement</Link>
              <Link className={linkCls} to="/verification">Vérification</Link>
            </>
          ) : (
            <>
              <Link className={linkCls} to="/vendre">Devenir vendeur</Link>
              <Link className={linkCls} to="/abonnement">Nos formules</Link>
            </>
          )}
        </FooterCol>

        <FooterCol title="Aide & légal">
          <Link className={linkCls} to="/faq">Questions fréquentes</Link>
          <Link className={linkCls} to="/a-propos">À propos</Link>
          <Link className={linkCls} to="/contact">Contact</Link>
          <Link className={linkCls} to="/cgu">Conditions d'utilisation</Link>
          <Link className={linkCls} to="/politique-de-confidentialite">Confidentialité</Link>
          <Link className={linkCls} to="/mentions-legales">Mentions légales</Link>
        </FooterCol>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-4 py-6 text-sm text-white/50">
          © {new Date().getFullYear()} Djassa. Fait avec confiance en Côte d'Ivoire.
        </div>
      </div>
    </footer>
  );
}

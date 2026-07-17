import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, ShieldCheck, Store, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatFcfa } from "@/lib/utils";

export function Panier() {
  usePageTitle("Mon panier", {
    description:
      "Passe commande directement au prix affiché, sans négocier avec le vendeur.",
  });
  const { items, total, removeItem } = useCart();
  const navigate = useNavigate();

  const byVendor = items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.vendorId] ??= []).push(item);
    return acc;
  }, {});
  const vendorCount = Object.keys(byVendor).length;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-20 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-secondary text-muted-foreground">
          <ShoppingBag className="size-8" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">Ton panier est vide</h1>
          <p className="mt-1 text-muted-foreground">
            Parcours le marché et ajoute les articles qui te plaisent.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/marche">
            Parcourir le marché <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">Mon panier</h1>
        <p className="mt-1 text-muted-foreground">
          Ces articles sont achetés au prix affiché, directement, sans passer par
          le chat.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        {/* Items */}
        <div className="flex flex-col gap-4">
          {Object.entries(byVendor).map(([vendorId, vendorItems]) => (
            <div
              key={vendorId}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-xs)]"
            >
              <Link
                to={`/vendeur/${vendorId}`}
                className="flex items-center gap-2 border-b border-border px-5 py-3 text-sm font-semibold text-foreground no-underline transition-colors hover:text-primary"
              >
                <Store className="size-4 text-muted-foreground" />
                Vendeur {vendorId.slice(0, 8)}
              </Link>
              <ul className="divide-y divide-border">
                {vendorItems.map((item) => (
                  <li key={item.productId} className="flex items-center gap-4 p-4">
                    <div className="size-18 shrink-0 overflow-hidden rounded-xl bg-secondary">
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.title}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="grid size-full place-items-center bg-[radial-gradient(circle_at_30%_20%,var(--brand-100),var(--secondary))] text-xs font-semibold text-brand-600/50">
                          Djassa
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/produit/${item.productId}`}
                        className="line-clamp-2 font-medium text-foreground no-underline hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-1 font-display text-lg font-semibold tabular">
                        {formatFcfa(item.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      aria-label={`Retirer ${item.title}`}
                      className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Récapitulatif</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Sous-total ({items.length} article{items.length > 1 ? "s" : ""})
              </dt>
              <dd className="font-medium tabular">{formatFcfa(total)}</dd>
            </div>
            {vendorCount > 1 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Commandes</dt>
                <dd className="font-medium">{vendorCount} vendeurs</dd>
              </div>
            )}
          </dl>
          <div className="my-4 h-px bg-border" />
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-display text-2xl font-semibold tabular">
              {formatFcfa(total)}
            </span>
          </div>

          {vendorCount > 1 && (
            <p className="mt-3 rounded-lg bg-secondary/70 p-3 text-xs text-muted-foreground">
              Ton panier sera réparti en {vendorCount} commandes distinctes, avec
              un seul paiement.
            </p>
          )}

          <Button
            size="lg"
            className="mt-5 w-full"
            onClick={() => navigate("/checkout")}
          >
            Passer au paiement <ArrowRight className="size-4" />
          </Button>

          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            L'argent reste séquestré par Djassa jusqu'à ta confirmation de
            réception.
          </p>
        </aside>
      </div>
    </div>
  );
}

import { type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, Check } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "../api/products";
import { useCart } from "@/context/CartContext";
import { TrustBadge } from "./TrustBadge";
import { formatFcfa, cn } from "@/lib/utils";
import { productUnitPrice, hasDiscount } from "@/lib/pricing";
import { trackClick } from "@/lib/analytics";

const CATEGORY_LABELS: Record<string, string> = {
  mode_beaute: "Mode & Beauté",
  electronique: "Électronique",
  maison: "Maison",
  telephones: "Téléphones",
  alimentation: "Alimentation",
  autre: "Autre",
};

export function ProductCard({
  product,
  className,
  readOnly = false,
}: {
  product: Product;
  index?: number;
  className?: string;
  /** Masque l'action "ajouter au panier" (ex: vue recherche vendeur). */
  readOnly?: boolean;
}) {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(product.id);
  const photo = product.photos[0];
  const discounted = hasDiscount(product);
  const unitPrice = productUnitPrice(product);

  function handleAdd(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) return;
    addItem({
      productId: product.id,
      vendorId: product.vendorId,
      title: product.title,
      price: unitPrice,
      shippingFee: product.shippingFee ?? 0,
      photo: photo ?? null,
    });
    toast.success("Ajouté au panier", { description: product.title });
  }

  return (
    <Link
      to={`/produit/${product.id}`}
      onClick={() => trackClick(product.id, { title: product.title })}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-card no-underline shadow-[var(--shadow-xs)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-brand-200 hover:shadow-[var(--shadow-md)]",
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
        {discounted && (
          <span className="absolute top-2.5 left-2.5 z-10 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-[var(--shadow-sm)]">
            -{product.discountPercent}%
          </span>
        )}
        {photo ? (
          <img
            src={photo}
            alt={product.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid size-full place-items-center bg-[radial-gradient(circle_at_30%_20%,var(--brand-100),var(--secondary))]">
            <span className="font-display text-lg font-semibold text-brand-600/60">
              Djassa
            </span>
          </div>
        )}

        {!readOnly && (
          <button
            type="button"
            onClick={handleAdd}
            aria-label={inCart ? "Déjà dans le panier" : "Ajouter au panier"}
            className={cn(
              "absolute right-2.5 bottom-2.5 grid size-10 place-items-center rounded-full shadow-[var(--shadow-md)] transition-all active:scale-90",
              inCart
                ? "bg-white text-primary"
                : "bg-primary text-primary-foreground hover:bg-brand-600",
            )}
          >
            {inCart ? <Check className="size-5" /> : <Plus className="size-5" />}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
            {CATEGORY_LABELS[product.category] ?? product.category}
          </span>
          <TrustBadge vendorId={product.vendorId} />
        </div>
        <h3 className="line-clamp-2 text-[0.95rem] leading-snug font-semibold text-foreground">
          {product.title}
        </h3>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <p className="font-display text-lg font-semibold text-foreground tabular">
            {formatFcfa(unitPrice)}
          </p>
          {discounted && (
            <p className="text-sm font-medium text-muted-foreground line-through tabular">
              {formatFcfa(product.price)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

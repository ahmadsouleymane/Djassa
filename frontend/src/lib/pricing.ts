import type { Product } from "@/api/products";

/** Prix unitaire après application de la promo automatique du vendeur (sans code). */
export function effectiveUnitPrice(price: number, discountPercent?: number | null): number {
  if (!discountPercent || discountPercent <= 0) return price;
  const capped = Math.min(90, discountPercent);
  return Math.max(1, Math.round(price * (1 - capped / 100)));
}

export function hasDiscount(product: Pick<Product, "discountPercent">): boolean {
  return !!product.discountPercent && product.discountPercent > 0;
}

/** Prix unitaire remisé du produit. */
export function productUnitPrice(product: Pick<Product, "price" | "discountPercent">): number {
  return effectiveUnitPrice(product.price, product.discountPercent);
}

/** Prix total affiché sur la fiche produit : unité remisée + frais de livraison. */
export function productTotalPrice(
  product: Pick<Product, "price" | "discountPercent" | "shippingFee">,
): number {
  return productUnitPrice(product) + (product.shippingFee ?? 0);
}

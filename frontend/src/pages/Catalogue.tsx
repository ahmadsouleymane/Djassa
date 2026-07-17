import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { productsApi, type Product } from "@/api/products";
import { ProductForm } from "@/components/ProductForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatFcfa } from "@/lib/utils";

export function Catalogue() {
  usePageTitle("Mon catalogue");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    productsApi
      .listMine()
      .then((res) => setProducts(res.products))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  async function handleDelete(product: Product) {
    if (
      !window.confirm(
        `Retirer « ${product.title} » de la vente ? Cette action est définitive.`,
      )
    )
      return;
    setDeletingId(product.id);
    try {
      await productsApi.remove(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success("Annonce retirée");
    } catch {
      toast.error("Impossible de retirer cette annonce.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">Mon catalogue</h1>
        <p className="mt-1 text-muted-foreground">
          Gère les articles que tu vends sur Djassa.
        </p>
      </header>

      <ProductForm
        key={editingProduct?.id ?? "create"}
        onCreated={(product) => {
          setProducts((prev) => [product, ...prev]);
          toast.success("Annonce publiée");
        }}
        editingProduct={editingProduct}
        onSaved={(product) => {
          setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
          setEditingProduct(null);
          toast.success("Annonce mise à jour");
        }}
        onCancelEdit={() => setEditingProduct(null)}
      />

      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Mes annonces{" "}
          {!isLoading && (
            <span className="text-muted-foreground">({products.length})</span>
          )}
        </h2>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-14 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-secondary text-muted-foreground">
              <PackagePlus className="size-7" />
            </span>
            <p className="max-w-sm text-muted-foreground">
              Aucune annonce pour l'instant. Utilise le formulaire ci-dessus pour
              créer ta première.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {products.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-xs)]"
              >
                <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
                  {p.photos[0] ? (
                    <img src={p.photos[0]} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center bg-[radial-gradient(circle_at_30%_20%,var(--brand-100),var(--secondary))] text-xs font-semibold text-brand-600/50">
                      Djassa
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/produit/${p.id}`}
                    className="line-clamp-1 font-medium text-foreground no-underline hover:underline"
                  >
                    {p.title}
                  </Link>
                  <p className="mt-0.5 font-display text-base font-semibold tabular">
                    {formatFcfa(p.price)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="icon-sm" variant="secondary" onClick={() => setEditingProduct(p)} aria-label="Modifier">
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(p)}
                    disabled={deletingId === p.id}
                    aria-label="Retirer"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

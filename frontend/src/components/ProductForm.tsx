import { useState, type FormEvent } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { productsApi, uploadPhoto, type Product, type ProductCategory } from "@/api/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn, formatFcfa } from "@/lib/utils";
import { effectiveUnitPrice } from "@/lib/pricing";

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "mode_beaute", label: "Mode & Beauté" },
  { value: "electronique", label: "Électronique" },
  { value: "maison", label: "Maison & Vie quotidienne" },
  { value: "telephones", label: "Téléphones & Accessoires" },
  { value: "alimentation", label: "Alimentation" },
  { value: "autre", label: "Autre" },
];

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 8;

type ProductFormProps = {
  onCreated: (product: Product) => void;
  editingProduct?: Product | null;
  onSaved?: (product: Product) => void;
  onCancelEdit?: () => void;
};

type NewPhoto = { file: File; url: string };

export function ProductForm({
  onCreated,
  editingProduct,
  onSaved,
  onCancelEdit,
}: ProductFormProps) {
  const isEditing = Boolean(editingProduct);
  const [title, setTitle] = useState(editingProduct?.title ?? "");
  const [description, setDescription] = useState(editingProduct?.description ?? "");
  const [deliveryInfo, setDeliveryInfo] = useState(editingProduct?.deliveryInfo ?? "");
  const [price, setPrice] = useState(editingProduct ? String(editingProduct.price) : "");
  const [shippingFee, setShippingFee] = useState(
    editingProduct ? String(editingProduct.shippingFee ?? 0) : "",
  );
  const [discount, setDiscount] = useState(
    editingProduct?.discountPercent ? String(editingProduct.discountPercent) : "",
  );
  const [category, setCategory] = useState<ProductCategory>(editingProduct?.category ?? CATEGORIES[0].value);
  const [existingPhotos, setExistingPhotos] = useState<string[]>(editingProduct?.photos ?? []);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPhotos = existingPhotos.length + newPhotos.length;
  const priceNum = Number(price) || 0;
  const shippingNum = Number(shippingFee) || 0;
  const discountNum = Number(discount) > 0 ? Math.min(90, Math.max(1, Number(discount))) : 0;
  const discountedUnit = effectiveUnitPrice(priceNum, discountNum);
  const totalPreview = discountedUnit + shippingNum;

  function addFiles(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - totalPhotos;
    const picked = Array.from(files)
      .slice(0, Math.max(0, room))
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    setNewPhotos((prev) => [...prev, ...picked]);
  }

  function removeExisting(url: string) {
    setExistingPhotos((prev) => prev.filter((p) => p !== url));
  }

  function removeNew(url: string) {
    setNewPhotos((prev) => {
      const target = prev.find((p) => p.url === url);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.url !== url);
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (totalPhotos < MIN_PHOTOS) {
      setError(`Ajoute au moins ${MIN_PHOTOS} photos du produit.`);
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const uploaded = await Promise.all(newPhotos.map((p) => uploadPhoto(p.file)));
      const photos = [...existingPhotos, ...uploaded];

      const payload = {
        title,
        description,
        deliveryInfo: deliveryInfo.trim() || undefined,
        price: priceNum,
        shippingFee: shippingNum,
        discountPercent: discountNum > 0 ? discountNum : null,
        category,
        photos,
      };

      if (isEditing && editingProduct) {
        const { product } = await productsApi.update(editingProduct.id, payload);
        onSaved?.(product);
      } else {
        const { product } = await productsApi.create(payload);
        onCreated(product);
        setTitle("");
        setDescription("");
        setDeliveryInfo("");
        setPrice("");
        setShippingFee("");
        setDiscount("");
        newPhotos.forEach((p) => URL.revokeObjectURL(p.url));
        setNewPhotos([]);
        setExistingPhotos([]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Le produit n'a pas pu être publié. Réessaie dans un instant.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-xs)] sm:p-6"
    >
      <h2 className="text-xl font-semibold">
        {isEditing ? "Modifier le produit" : "Ajouter un produit"}
      </h2>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive"
        >
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-5">
        {/* Photos */}
        <div className="flex flex-col gap-2">
          <Label>
            Photos du produit{" "}
            <span className="font-normal text-muted-foreground">
              ({MIN_PHOTOS} minimum · {totalPhotos}/{MAX_PHOTOS})
            </span>
          </Label>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {existingPhotos.map((url) => (
              <PhotoThumb key={url} src={url} onRemove={() => removeExisting(url)} />
            ))}
            {newPhotos.map((p) => (
              <PhotoThumb key={p.url} src={p.url} onRemove={() => removeNew(p.url)} />
            ))}
            {totalPhotos < MAX_PHOTOS && (
              <label
                className={cn(
                  "press flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-center transition-colors",
                  totalPhotos < MIN_PHOTOS
                    ? "border-primary/40 bg-accent/40 text-primary"
                    : "border-border text-muted-foreground hover:border-brand-300",
                )}
              >
                <ImagePlus className="size-6" />
                <span className="px-1 text-[0.7rem] font-medium">Ajouter</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Montre le produit sous plusieurs angles. La 1ʳᵉ photo sert de couverture.
          </p>
        </div>

        {/* Titre */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="pf-title">Titre</Label>
          <Input
            id="pf-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Robe wax imprimée"
            required
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="pf-desc">Fiche descriptive</Label>
          <Textarea
            id="pf-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décris l'article : état, taille, matière, particularités…"
            className="min-h-24"
            required
          />
        </div>

        {/* Ce que le client reçoit */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="pf-delivery">Ce que le client recevra</Label>
          <Textarea
            id="pf-delivery"
            value={deliveryInfo}
            onChange={(e) => setDeliveryInfo(e.target.value)}
            placeholder="Ex : 1 robe + 1 ceinture assortie, emballée dans une pochette Djassa"
            className="min-h-20"
          />
        </div>

        {/* Prix & livraison */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pf-price">Prix de l'article (FCFA)</Label>
            <Input
              id="pf-price"
              type="number"
              inputMode="numeric"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="15000"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pf-shipping">Frais de livraison (FCFA)</Label>
            <Input
              id="pf-shipping"
              type="number"
              inputMode="numeric"
              min="0"
              value={shippingFee}
              onChange={(e) => setShippingFee(e.target.value)}
              placeholder="0 = livraison offerte"
            />
          </div>
        </div>

        {/* Catégorie & promo */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pf-discount">
              Promo auto (%) <span className="font-normal text-muted-foreground">optionnel</span>
            </Label>
            <Input
              id="pf-discount"
              type="number"
              inputMode="numeric"
              min="1"
              max="90"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="Ex : 20"
            />
          </div>
        </div>

        {/* Aperçu prix total */}
        {priceNum > 0 && (
          <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Prix total pour le client</span>
              <span className="flex items-baseline gap-2">
                {discountNum > 0 && (
                  <span className="text-muted-foreground line-through tabular">
                    {formatFcfa(priceNum + shippingNum)}
                  </span>
                )}
                <span className="font-display text-lg font-semibold tabular">
                  {formatFcfa(totalPreview)}
                </span>
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {discountNum > 0 && `Promo -${discountNum}% appliquée automatiquement. `}
              {shippingNum > 0 ? `Dont ${formatFcfa(shippingNum)} de livraison.` : "Livraison offerte."}
            </p>
          </div>
        )}

        <div className="flex gap-2.5">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Enregistrement…
              </>
            ) : isEditing ? (
              "Enregistrer"
            ) : (
              "Publier l'annonce"
            )}
          </Button>
          {isEditing && (
            <Button type="button" variant="secondary" onClick={onCancelEdit}>
              Annuler
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

function PhotoThumb({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary">
      <img src={src} alt="" className="size-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Retirer la photo"
        className="press absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-destructive"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

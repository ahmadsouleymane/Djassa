import { useState, type FormEvent } from "react";
import { productsApi, uploadPhoto, type Product } from "@/api/products";
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

const CATEGORIES = [
  { value: "mode_beaute", label: "Mode & Beauté" },
  { value: "electronique", label: "Électronique" },
  { value: "maison", label: "Maison & Vie quotidienne" },
  { value: "telephones", label: "Téléphones & Accessoires" },
  { value: "alimentation", label: "Alimentation" },
  { value: "autre", label: "Autre" },
];

type ProductFormProps = {
  onCreated: (product: Product) => void;
  editingProduct?: Product | null;
  onSaved?: (product: Product) => void;
  onCancelEdit?: () => void;
};

export function ProductForm({
  onCreated,
  editingProduct,
  onSaved,
  onCancelEdit,
}: ProductFormProps) {
  const isEditing = Boolean(editingProduct);
  const [title, setTitle] = useState(editingProduct?.title ?? "");
  const [description, setDescription] = useState(editingProduct?.description ?? "");
  const [price, setPrice] = useState(editingProduct ? String(editingProduct.price) : "");
  const [category, setCategory] = useState(editingProduct?.category ?? CATEGORIES[0].value);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isEditing && !photoFile) {
      setError("Ajoute au moins une photo");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const photos = photoFile ? [await uploadPhoto(photoFile)] : editingProduct?.photos;
      if (isEditing && editingProduct) {
        const { product } = await productsApi.update(editingProduct.id, {
          title,
          description,
          price: Number(price),
          category,
          ...(photos ? { photos } : {}),
        });
        onSaved?.(product);
      } else {
        const { product } = await productsApi.create({
          title,
          description,
          price: Number(price),
          category,
          photos: photos ?? [],
        });
        onCreated(product);
        setTitle("");
        setDescription("");
        setPrice("");
        setPhotoFile(null);
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
      className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-xs)]"
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

      <div className="mt-5 flex flex-col gap-4">
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="pf-desc">Description</Label>
          <Textarea
            id="pf-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décris l'article : état, taille, matière, particularités…"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pf-price">Prix (FCFA)</Label>
            <Input
              id="pf-price"
              type="number"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="15000"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={setCategory}>
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
            <Label htmlFor="pf-photo">
              Photo{isEditing ? " (optionnel)" : ""}
            </Label>
            <Input
              id="pf-photo"
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              required={!isEditing}
              className="file:mr-3 file:rounded-md file:bg-secondary file:px-2 file:py-1 file:text-xs file:font-medium"
            />
          </div>
        </div>

        <div className="flex gap-2.5">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Enregistrement…"
              : isEditing
                ? "Enregistrer"
                : "Publier l'annonce"}
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

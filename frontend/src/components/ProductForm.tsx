import { useState, type FormEvent } from "react";
import { productsApi, uploadPhoto, type Product } from "../api/products";

const CATEGORIES = [
  { value: "mode_beaute", label: "Mode & Beauté" },
  { value: "electronique", label: "Électronique" },
  { value: "maison", label: "Maison & Vie quotidienne" },
  { value: "telephones", label: "Téléphones & Accessoires" },
  { value: "alimentation", label: "Alimentation" },
  { value: "autre", label: "Autre" },
];

export function ProductForm({ onCreated }: { onCreated: (product: Product) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!photoFile) {
      setError("Ajoute au moins une photo");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const photoUrl = await uploadPhoto(photoFile);
      const { product } = await productsApi.create({
        title,
        description,
        price: Number(price),
        category,
        photos: [photoUrl],
      });
      onCreated(product);
      setTitle("");
      setDescription("");
      setPrice("");
      setPhotoFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création du produit");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Ajouter un produit</h2>
      {error && <p role="alert">{error}</p>}
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" required />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        required
      />
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Prix (FCFA)"
        required
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} required />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Publication..." : "Publier"}
      </button>
    </form>
  );
}

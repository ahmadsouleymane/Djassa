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
      setError(err instanceof Error ? err.message : "Le produit n'a pas pu être publié. Réessaie dans un instant.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card section" onSubmit={handleSubmit}>
      <h2>Ajouter un produit</h2>
      {error && <p className="error-text" role="alert">{error}</p>}
      <div className="field">
        <label>Titre</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <div className="field">
          <label>Prix (FCFA)</label>
          <input
            className="input"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Catégorie</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Photo</label>
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            required
          />
        </div>
      </div>
      <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Publication..." : "Publier"}
      </button>
    </form>
  );
}

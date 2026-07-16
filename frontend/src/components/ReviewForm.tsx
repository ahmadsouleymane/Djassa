import { useState } from "react";
import { reviewsApi } from "../api/reviews";

export function ReviewForm({ orderId, onSubmitted }: { orderId: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!comment.trim()) return;
    setIsSubmitting(true);
    try {
      await reviewsApi.create(orderId, rating, comment);
      onSubmitted();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="form-row">
      <div className="field" style={{ maxWidth: "9rem" }}>
        <select className="input" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} étoile{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <input className="input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ton avis sur cette commande" />
      </div>
      <button className="btn btn-secondary btn-sm" onClick={handleSubmit} disabled={isSubmitting}>
        Laisser un avis
      </button>
    </div>
  );
}

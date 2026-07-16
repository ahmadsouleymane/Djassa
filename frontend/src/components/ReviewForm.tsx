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
    <span>
      <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} étoile{n > 1 ? "s" : ""}
          </option>
        ))}
      </select>
      <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Votre avis" />
      <button onClick={handleSubmit} disabled={isSubmitting}>
        Laisser un avis
      </button>
    </span>
  );
}

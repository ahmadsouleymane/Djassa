import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { reviewsApi } from "@/api/reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ReviewForm({
  orderId,
  onSubmitted,
}: {
  orderId: string;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!comment.trim()) {
      toast.error("Ajoute un court commentaire à ton avis.");
      return;
    }
    setIsSubmitting(true);
    try {
      await reviewsApi.create(orderId, rating, comment);
      onSubmitted();
    } catch {
      toast.error("Ton avis n'a pas pu être envoyé.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">Laisse un avis sur ce vendeur</p>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5"
          >
            <Star
              className={cn(
                "size-6 transition-colors",
                n <= (hover || rating)
                  ? "fill-[#f5a623] text-[#f5a623]"
                  : "fill-secondary text-border",
              )}
            />
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ton avis sur cette commande…"
        />
        <Button
          variant="secondary"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="shrink-0"
        >
          Envoyer l'avis
        </Button>
      </div>
    </div>
  );
}

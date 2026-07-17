import { useState, type FormEvent } from "react";
import { Send, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export function MessageComposer({
  onSend,
}: {
  onSend: (text: string, offerPrice?: number) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [showOffer, setShowOffer] = useState(false);
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSending(true);
    try {
      await onSend(text, offerPrice ? Number(offerPrice) : undefined);
      setText("");
      setOfferPrice("");
      setShowOffer(false);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border-t border-border bg-card p-3"
    >
      {showOffer && (
        <input
          type="number"
          inputMode="numeric"
          value={offerPrice}
          onChange={(e) => setOfferPrice(e.target.value)}
          placeholder="Ton offre en FCFA"
          className="h-10 rounded-lg border border-input bg-white px-3.5 text-sm outline-none focus-visible:border-brand-400 focus-visible:ring-[3.5px] focus-visible:ring-accent"
        />
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowOffer((v) => !v)}
          aria-label="Proposer un prix"
          aria-pressed={showOffer}
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full border transition-colors",
            showOffer
              ? "border-primary bg-accent text-primary"
              : "border-border text-muted-foreground hover:bg-secondary",
          )}
        >
          <Tag className="size-[18px]" />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écris ton message…"
          required
          className="h-10 w-full rounded-full border border-input bg-white px-4 text-sm outline-none focus-visible:border-brand-400 focus-visible:ring-[3.5px] focus-visible:ring-accent"
        />
        <button
          type="submit"
          disabled={isSending}
          aria-label="Envoyer"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          <Send className="size-[18px]" />
        </button>
      </div>
    </form>
  );
}

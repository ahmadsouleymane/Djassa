import { useState, type FormEvent } from "react";

export function MessageComposer({ onSend }: { onSend: (text: string, offerPrice?: number) => Promise<void> }) {
  const [text, setText] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSending(true);
    try {
      await onSend(text, offerPrice ? Number(offerPrice) : undefined);
      setText("");
      setOfferPrice("");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message" required />
      <input
        type="number"
        value={offerPrice}
        onChange={(e) => setOfferPrice(e.target.value)}
        placeholder="Offre de prix (FCFA, optionnel)"
      />
      <button type="submit" disabled={isSending}>
        Envoyer
      </button>
    </form>
  );
}

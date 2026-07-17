import { useState, type FormEvent } from "react";
import "./MessageComposer.css";

function IconSend() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 20 18-8L3 4l2 7-2 9Z" />
      <path d="M5 11h6" />
    </svg>
  );
}

export function MessageComposer({ onSend }: { onSend: (text: string, offerPrice?: number) => Promise<void> }) {
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
    <form className="composer" onSubmit={handleSubmit}>
      {showOffer && (
        <input
          className="composer-offer"
          type="number"
          value={offerPrice}
          onChange={(e) => setOfferPrice(e.target.value)}
          placeholder="Prix FCFA"
        />
      )}
      <button
        type="button"
        className={`composer-offer-toggle ${showOffer ? "is-active" : ""}`}
        onClick={() => setShowOffer((v) => !v)}
        aria-label="Ajouter une offre de prix"
        title="Ajouter une offre de prix"
      >
        FCFA
      </button>
      <input
        className="composer-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Écris ton message..."
        required
      />
      <button className="composer-send" type="submit" disabled={isSending} aria-label="Envoyer">
        <IconSend />
      </button>
    </form>
  );
}

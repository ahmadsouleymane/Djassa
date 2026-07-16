import type { ChatMessage } from "../api/conversations";

export function ConversationThread({ messages, currentUserId }: { messages: ChatMessage[]; currentUserId: string }) {
  return (
    <div>
      {messages.map((m) => (
        <p key={m.id} style={{ textAlign: m.senderId === currentUserId ? "right" : "left" }}>
          {m.text}
          {m.offerPrice !== null && <strong> — Offre : {m.offerPrice.toLocaleString("fr-FR")} FCFA</strong>}
        </p>
      ))}
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import type { ChatMessage } from "../api/conversations";
import { ordersApi } from "../api/orders";

export function ConversationThread({ messages, currentUserId }: { messages: ChatMessage[]; currentUserId: string }) {
  const navigate = useNavigate();

  async function handleAccept(chatMessageId: string) {
    await ordersApi.create(chatMessageId);
    navigate("/commandes");
  }

  return (
    <div>
      {messages.map((m) => (
        <p key={m.id} style={{ textAlign: m.senderId === currentUserId ? "right" : "left" }}>
          {m.text}
          {m.offerPrice !== null && <strong> — Offre : {m.offerPrice.toLocaleString("fr-FR")} FCFA</strong>}
          {m.offerPrice !== null && m.senderId !== currentUserId && (
            <button onClick={() => handleAccept(m.id)}>Accepter cette offre</button>
          )}
        </p>
      ))}
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import type { ChatMessage } from "../api/conversations";
import { ordersApi } from "../api/orders";
import "./ConversationThread.css";

export function ConversationThread({ messages, currentUserId }: { messages: ChatMessage[]; currentUserId: string }) {
  const navigate = useNavigate();

  async function handleAccept(chatMessageId: string) {
    await ordersApi.create(chatMessageId);
    navigate("/commandes");
  }

  return (
    <div className="thread">
      {messages.map((m) => {
        const isMine = m.senderId === currentUserId;
        return (
          <div key={m.id} className={`thread-bubble ${isMine ? "is-mine" : ""}`}>
            {m.text}
            {m.offerPrice !== null && (
              <span className="offer">Offre : {m.offerPrice.toLocaleString("fr-FR")} FCFA</span>
            )}
            {m.offerPrice !== null && !isMine && (
              <button className="btn btn-primary btn-sm" onClick={() => handleAccept(m.id)}>
                Accepter cette offre
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

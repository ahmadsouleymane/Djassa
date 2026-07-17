import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { ChatMessage } from "../api/conversations";
import { ordersApi } from "../api/orders";
import "./ConversationThread.css";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function ConversationThread({ messages, currentUserId }: { messages: ChatMessage[]; currentUserId: string }) {
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

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
            <p>{m.text}</p>
            {m.offerPrice !== null && (
              <span className="offer">Offre : {m.offerPrice.toLocaleString("fr-FR")} FCFA</span>
            )}
            {m.offerPrice !== null && !isMine && (
              <button className="btn btn-primary btn-sm" onClick={() => handleAccept(m.id)}>
                Accepter cette offre
              </button>
            )}
            <span className="thread-bubble-time">{formatTime(m.createdAt)}</span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { connectSocket, disconnectSocket } from "../realtime/socket";
import { conversationsApi, type Conversation, type ChatMessage } from "../api/conversations";
import { ConversationThread } from "../components/ConversationThread";
import { MessageComposer } from "../components/MessageComposer";
import "./Messagerie.css";

export function Messagerie() {
  const { user, accessToken } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  useEffect(() => {
    conversationsApi.listMine().then((res) => {
      setConversations(res.conversations);
      if (res.conversations.length > 0) setActiveId(res.conversations[0].id);
    });
  }, []);

  useEffect(() => {
    if (!activeId) return;
    conversationsApi.listMessages(activeId).then((res) => setMessages(res.messages));
  }, [activeId]);

  useEffect(() => {
    if (!accessToken) return;
    const socket = connectSocket(accessToken);
    socket.on("message:new", (payload: { conversationId: string; message: ChatMessage }) => {
      if (payload.conversationId === activeIdRef.current) {
        setMessages((prev) => [...prev, payload.message]);
      }
    });
    return () => disconnectSocket();
  }, [accessToken]);

  const handleSend = useCallback(
    async (text: string, offerPrice?: number) => {
      if (!activeId) return;
      const { message } = await conversationsApi.sendMessage(activeId, text, offerPrice);
      setMessages((prev) => [...prev, message]);
    },
    [activeId],
  );

  return (
    <div>
      <div className="page-header">
        <h1>Messagerie</h1>
      </div>
      {conversations.length === 0 ? (
        <div className="empty-state">Aucune conversation pour l'instant. Contacte un vendeur depuis une fiche produit pour démarrer.</div>
      ) : (
        <div className="messagerie-layout">
          <ul className="conversation-list">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  className={`conversation-item ${c.id === activeId ? "is-active" : ""}`}
                  onClick={() => setActiveId(c.id)}
                >
                  {c.product.title}
                </button>
              </li>
            ))}
          </ul>
          {activeId && user && (
            <div className="thread-panel">
              <ConversationThread messages={messages} currentUserId={user.id} />
              <MessageComposer onSend={handleSend} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

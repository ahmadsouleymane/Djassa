import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { connectSocket, disconnectSocket } from "../realtime/socket";
import { conversationsApi, type Conversation, type ChatMessage } from "../api/conversations";
import { ConversationThread } from "../components/ConversationThread";
import { MessageComposer } from "../components/MessageComposer";
import { usePageTitle } from "../hooks/usePageTitle";
import "./Messagerie.css";

function formatPreviewTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function bumpConversation(list: Conversation[], conversationId: string, message: ChatMessage): Conversation[] {
  const idx = list.findIndex((c) => c.id === conversationId);
  if (idx === -1) return list;
  const updated = { ...list[idx], messages: [message] };
  const next = [...list];
  next.splice(idx, 1);
  return [updated, ...next];
}

export function Messagerie() {
  usePageTitle("Messagerie");
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const activeIdRef = useRef<string | undefined>(conversationId);
  activeIdRef.current = conversationId;

  useEffect(() => {
    conversationsApi.listMine().then((res) => {
      setConversations(res.conversations);
      setIsLoadingList(false);
    });
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    conversationsApi.listMessages(conversationId).then((res) => setMessages(res.messages));
  }, [conversationId]);

  useEffect(() => {
    if (!accessToken) return;
    const socket = connectSocket(accessToken);
    socket.on("message:new", (payload: { conversationId: string; message: ChatMessage }) => {
      if (payload.conversationId === activeIdRef.current) {
        setMessages((prev) => [...prev, payload.message]);
      }
      setConversations((prev) => bumpConversation(prev, payload.conversationId, payload.message));
    });
    return () => disconnectSocket();
  }, [accessToken]);

  const handleSend = useCallback(
    async (text: string, offerPrice?: number) => {
      if (!conversationId) return;
      const { message } = await conversationsApi.sendMessage(conversationId, text, offerPrice);
      setMessages((prev) => [...prev, message]);
      setConversations((prev) => bumpConversation(prev, conversationId, message));
    },
    [conversationId],
  );

  const activeConversation = conversations.find((c) => c.id === conversationId);

  if (isLoadingList) return <div className="empty-state">Chargement...</div>;

  if (conversations.length === 0) {
    return (
      <div className="empty-state">Aucune conversation pour l'instant. Contacte un vendeur depuis une fiche produit pour démarrer.</div>
    );
  }

  return (
    <div className={`chat-shell ${conversationId ? "has-active" : ""}`}>
      <aside className="chat-list">
        <div className="chat-list-head">
          <h1>Messagerie</h1>
        </div>
        <ul className="chat-list-items">
          {conversations.map((c) => {
            const last = c.messages[0];
            return (
              <li key={c.id}>
                <Link to={`/messagerie/${c.id}`} className={`chat-list-item ${c.id === conversationId ? "is-active" : ""}`}>
                  <span className="chat-avatar">
                    {c.product.photos[0] ? <img src={c.product.photos[0]} alt="" /> : <span>{c.product.title[0]}</span>}
                  </span>
                  <span className="chat-list-item-body">
                    <span className="chat-list-item-title">{c.product.title}</span>
                    <span className="chat-list-item-preview">{last ? last.text : "Démarre la conversation"}</span>
                  </span>
                  {last && <span className="chat-list-item-time">{formatPreviewTime(last.createdAt)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="chat-thread">
        {activeConversation ? (
          <>
            <div className="chat-thread-head">
              <button className="chat-back" onClick={() => navigate("/messagerie")} aria-label="Retour à la liste">
                ←
              </button>
              <span className="chat-avatar chat-avatar-sm">
                {activeConversation.product.photos[0] ? (
                  <img src={activeConversation.product.photos[0]} alt="" />
                ) : (
                  <span>{activeConversation.product.title[0]}</span>
                )}
              </span>
              <div className="chat-thread-head-info">
                <span className="chat-thread-head-title">{activeConversation.product.title}</span>
                <Link to={`/produit/${activeConversation.productId}`} className="chat-thread-head-link">
                  Voir le produit
                </Link>
              </div>
            </div>
            <ConversationThread messages={messages} currentUserId={user!.id} />
            <MessageComposer onSend={handleSend} />
          </>
        ) : (
          <div className="chat-thread-empty">
            <p>Sélectionne une conversation pour l'ouvrir.</p>
          </div>
        )}
      </section>
    </div>
  );
}

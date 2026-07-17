import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { connectSocket, disconnectSocket } from "@/realtime/socket";
import { conversationsApi, type Conversation, type ChatMessage } from "@/api/conversations";
import { ConversationThread } from "@/components/ConversationThread";
import { MessageComposer } from "@/components/MessageComposer";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";

function formatPreviewTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function bumpConversation(
  list: Conversation[],
  conversationId: string,
  message: ChatMessage,
): Conversation[] {
  const idx = list.findIndex((c) => c.id === conversationId);
  if (idx === -1) return list;
  const updated = { ...list[idx], messages: [message] };
  const next = [...list];
  next.splice(idx, 1);
  return [updated, ...next];
}

function ProductAvatar({
  product,
  size = "md",
}: {
  product: { title: string; photos: string[] };
  size?: "md" | "sm";
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-xl bg-accent font-semibold text-brand-600",
        size === "md" ? "size-12" : "size-10",
      )}
    >
      {product.photos[0] ? (
        <img src={product.photos[0]} alt="" className="size-full object-cover" />
      ) : (
        <span>{product.title[0]?.toUpperCase()}</span>
      )}
    </span>
  );
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
    conversationsApi
      .listMine()
      .then((res) => setConversations(res.conversations))
      .catch(() => {})
      .finally(() => setIsLoadingList(false));
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

  if (isLoadingList) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-[60dvh] rounded-2xl" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-secondary text-muted-foreground">
          <MessageCircle className="size-7" />
        </span>
        <p className="max-w-sm text-muted-foreground">
          Aucune conversation pour l'instant. Contacte un vendeur depuis une
          fiche produit pour démarrer.
        </p>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100dvh-9rem)] min-h-[30rem] overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)] md:h-[calc(100dvh-13rem)] md:grid-cols-[20rem_1fr]">
      {/* List */}
      <aside
        className={cn(
          "flex-col border-r border-border",
          conversationId ? "hidden md:flex" : "flex",
        )}
      >
        <div className="border-b border-border px-4 py-4">
          <h1 className="text-lg font-semibold">Messagerie</h1>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {conversations.map((c) => {
            const last = c.messages[0];
            const active = c.id === conversationId;
            return (
              <li key={c.id}>
                <Link
                  to={`/messagerie/${c.id}`}
                  className={cn(
                    "flex items-center gap-3 border-b border-border/60 px-4 py-3 no-underline transition-colors",
                    active ? "bg-accent/60" : "hover:bg-secondary/60",
                  )}
                >
                  <ProductAvatar product={c.product} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {c.product.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {last ? last.text : "Démarre la conversation"}
                    </span>
                  </span>
                  {last && (
                    <span className="shrink-0 text-[0.65rem] text-muted-foreground tabular">
                      {formatPreviewTime(last.createdAt)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Thread */}
      <section
        className={cn(
          "flex-col bg-secondary/20",
          conversationId ? "flex" : "hidden md:flex",
        )}
      >
        {activeConversation ? (
          <>
            <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
              <button
                onClick={() => navigate("/messagerie")}
                aria-label="Retour à la liste"
                className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary md:hidden"
              >
                <ArrowLeft className="size-5" />
              </button>
              <ProductAvatar product={activeConversation.product} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {activeConversation.product.title}
                </p>
                <Link
                  to={`/produit/${activeConversation.productId}`}
                  className="text-xs font-medium text-primary no-underline hover:underline"
                >
                  Voir le produit
                </Link>
              </div>
            </div>
            <ConversationThread messages={messages} currentUserId={user!.id} />
            <MessageComposer onSend={handleSend} />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <MessageCircle className="size-8" />
            <p className="text-sm">Sélectionne une conversation pour l'ouvrir.</p>
          </div>
        )}
      </section>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { toast } from "sonner";
import type { ChatMessage } from "@/api/conversations";
import { ordersApi } from "@/api/orders";
import { Button } from "@/components/ui/button";
import { formatFcfa, cn } from "@/lib/utils";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function ConversationThread({
  messages,
  currentUserId,
}: {
  messages: ChatMessage[];
  currentUserId: string;
}) {
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function handleAccept(chatMessageId: string) {
    try {
      await ordersApi.create(chatMessageId);
      toast.success("Offre acceptée, commande créée");
      navigate("/commandes");
    } catch {
      toast.error("L'offre n'a pas pu être acceptée.");
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
      {messages.map((m) => {
        const isMine = m.senderId === currentUserId;
        const hasOffer = m.offerPrice !== null;
        return (
          <div
            key={m.id}
            className={cn("flex flex-col", isMine ? "items-end" : "items-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[0.95rem] shadow-[var(--shadow-xs)]",
                isMine
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md border border-border bg-card text-foreground",
              )}
            >
              <p className="whitespace-pre-line">{m.text}</p>
              {hasOffer && (
                <div
                  className={cn(
                    "mt-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold tabular",
                    isMine ? "bg-white/15 text-white" : "bg-accent text-accent-foreground",
                  )}
                >
                  Offre : {formatFcfa(m.offerPrice!)}
                </div>
              )}
              {hasOffer && !isMine && (
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => handleAccept(m.id)}
                >
                  <Check className="size-4" /> Accepter cette offre
                </Button>
              )}
            </div>
            <span className="mt-1 px-1 text-[0.65rem] text-muted-foreground tabular">
              {formatTime(m.createdAt)}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

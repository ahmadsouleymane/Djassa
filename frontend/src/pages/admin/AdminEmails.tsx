import { useEffect, useState, type FormEvent } from "react";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type SentEmail } from "@/api/admin";
import { ApiError } from "@/api/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePageTitle } from "@/hooks/usePageTitle";

const RECIPIENT_LABELS: Record<string, string> = {
  all: "Tous les comptes",
  vendeurs: "Vendeurs uniquement",
  clients: "Acheteurs uniquement",
  custom: "Adresse spécifique",
};

export function AdminEmails() {
  usePageTitle("Emails");
  const [recipientFilter, setRecipientFilter] = useState<"all" | "vendeurs" | "clients" | "custom">("vendeurs");
  const [customEmail, setCustomEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<SentEmail[]>([]);

  function reloadHistory() {
    adminApi.emailHistory().then((res) => setHistory(res.emails)).catch(() => {});
  }

  useEffect(() => {
    reloadHistory();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSending(true);
    try {
      const res = await adminApi.sendEmail({
        recipientFilter,
        customEmail: recipientFilter === "custom" ? customEmail : undefined,
        subject,
        body,
      });
      toast.success(`Email envoyé à ${res.recipientCount} destinataire(s)`);
      setSubject("");
      setBody("");
      reloadHistory();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Envoi impossible.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <AdminShell>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-xs)]">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Mail className="size-5 text-primary" /> Envoyer un email
          </h2>
          <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label>Destinataires</Label>
              <Select value={recipientFilter} onValueChange={(v) => setRecipientFilter(v as typeof recipientFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RECIPIENT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {recipientFilter === "custom" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="custom-email">Adresse email</Label>
                <Input
                  id="custom-email"
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email-subject">Sujet</Label>
              <Input id="email-subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email-body">Message (HTML autorisé)</Label>
              <Textarea id="email-body" rows={8} value={body} onChange={(e) => setBody(e.target.value)} required />
            </div>
            <Button type="submit" disabled={isSending}>
              <Send className="size-4" /> {isSending ? "Envoi…" : "Envoyer"}
            </Button>
          </form>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Historique</h2>
          {history.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Aucun email envoyé pour l'instant.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {history.map((h) => (
                <li key={h.id} className="rounded-xl border border-border bg-card p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{h.subject}</span>
                    <span className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString("fr-FR")}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {RECIPIENT_LABELS[h.recipientFilter] ?? h.recipientFilter} · {h.recipientCount} destinataire(s)
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

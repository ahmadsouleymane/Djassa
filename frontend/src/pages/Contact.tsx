import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { usePageTitle } from "@/hooks/usePageTitle";

const SUBJECT_LABELS: Record<string, string> = {
  commande: "Une commande",
  vendeur: "Mon compte vendeur",
  litige: "Un litige",
  autre: "Autre",
};

export function Contact() {
  usePageTitle("Contact", {
    description:
      "Contacte l'équipe Djassa pour une question sur une commande, un litige, un compte vendeur ou un partenariat.",
  });

  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("commande");
  const [message, setMessage] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body = `${message}\n\nRépondre à : ${email}`;
    const mailto = `mailto:contact@djassa.shop?subject=${encodeURIComponent(
      `[Djassa] ${SUBJECT_LABELS[subject]}`,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">Contact</h1>
        <p className="mt-1 text-muted-foreground">
          Une question sur une commande, un litige en cours ou ton compte
          vendeur ? Écris-nous.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-xs)]">
          <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
            <Mail className="size-5" />
          </span>
          <h3 className="mt-3 font-semibold">Support</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Commande, remboursement ou litige.
          </p>
          <p className="mt-2 font-mono text-sm">
            contact@djassa.shop
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-xs)]">
          <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
            <Phone className="size-5" />
          </span>
          <h3 className="mt-3 font-semibold">Téléphone / WhatsApp</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Lundi au samedi, 9h – 18h (Abidjan).
          </p>
          <div className="mt-2 space-y-1 font-mono text-sm">
            <p>
              <span className="text-muted-foreground">Appel :</span>{" "}
              <a href="tel:+2250160726314" className="hover:underline">+225 01 60 72 63 14</a>
            </p>
            <p>
              <span className="text-muted-foreground">WhatsApp :</span>{" "}
              <a
                href="https://wa.me/2250566110723"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                +225 05 66 11 07 23
              </a>
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-xs)]">
          <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
            <BadgeCheck className="size-5" />
          </span>
          <h3 className="mt-3 font-semibold">Vérification vendeur</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Pour le suivi d'un dossier d'identité, utilise directement la page{" "}
            <Link to="/verification" className="font-semibold text-primary">
              Vérification
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] md:p-8">
        <h2 className="text-xl font-semibold">Envoyer un message</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ce formulaire ouvre ton application email vers notre support, avec ton
          message pré-rempli.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex max-w-lg flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-email">Ton email</Label>
            <Input
              id="contact-email"
              type="email"
              autoComplete="email"
              required
              placeholder="toi@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Sujet</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUBJECT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              required
              rows={5}
              placeholder="Décris ta demande le plus précisément possible."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-fit">
            Envoyer par email
          </Button>
        </form>
      </div>
    </div>
  );
}

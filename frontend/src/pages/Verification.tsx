import { useEffect, useState } from "react";
import { ShieldCheck, FileCheck2, Clock, UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadPhoto } from "@/api/products";
import { verificationApi, type VerificationStatus } from "@/api/verification";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { usePageTitle } from "@/hooks/usePageTitle";

const STATUS_LABELS: Record<VerificationStatus["status"], string> = {
  non_soumise: "Non soumise",
  en_attente: "En attente de revue",
  approuvee: "Approuvée",
  rejetee: "Rejetée",
};

const STATUS_VARIANT: Record<
  VerificationStatus["status"],
  React.ComponentProps<typeof Badge>["variant"]
> = {
  non_soumise: "secondary",
  en_attente: "warning",
  approuvee: "success",
  rejetee: "destructive",
};

const INFO = [
  {
    icon: ShieldCheck,
    title: "Pourquoi c'est obligatoire",
    body: "C'est ce qui permet aux acheteurs de commander sans te connaître : chaque vendeur visible sur Djassa a été identifié au préalable.",
  },
  {
    icon: FileCheck2,
    title: "Documents acceptés",
    body: "Carte nationale d'identité, passeport ou permis de conduire en cours de validité. Photo nette et lisible.",
  },
  {
    icon: Clock,
    title: "Délai de revue",
    body: "Une équipe examine chaque dossier manuellement, généralement sous 24 à 72h ouvrées.",
  },
];

export function Verification() {
  usePageTitle("Vérification vendeur");
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    verificationApi.status().then(setStatus).catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!file) return;
    setIsSubmitting(true);
    try {
      const documentUrl = await uploadPhoto(file);
      await verificationApi.submit(documentUrl);
      setStatus(await verificationApi.status());
      setFile(null);
      toast.success("Document envoyé", { description: "Ton dossier est en cours d'examen." });
    } catch {
      toast.error("L'envoi a échoué. Réessaie dans un instant.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    !status || status.status === "non_soumise" || status.status === "rejetee";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">Vérification vendeur</h1>
        <p className="mt-1 text-muted-foreground">
          Tes articles ne sont visibles sur le marché qu'une fois ton identité
          vérifiée.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {INFO.map((i) => (
          <div
            key={i.title}
            className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-xs)]"
          >
            <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
              <i.icon className="size-5" />
            </span>
            <h3 className="mt-3 font-semibold">{i.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{i.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
        {status && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Statut :</span>
            <Badge variant={STATUS_VARIANT[status.status]}>
              {STATUS_LABELS[status.status]}
            </Badge>
            {status.reason && (
              <span className="text-sm text-muted-foreground">
                motif : {status.reason}
              </span>
            )}
          </div>
        )}

        {status?.status === "en_attente" && (
          <p className="mt-3 text-sm text-muted-foreground">
            Ton dossier est en cours d'examen. Reviens sur cette page pour suivre
            l'avancement, aucune action supplémentaire n'est nécessaire.
          </p>
        )}

        {status?.status === "approuvee" && (
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">
            <ShieldCheck className="size-4" /> Ton identité est vérifiée. Tes
            annonces sont visibles sur le marché.
          </p>
        )}

        {canSubmit && (
          <div className="mt-5 flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="kyc-file">Pièce d'identité</Label>
              <label
                htmlFor="kyc-file"
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-4 text-sm transition-colors hover:border-brand-300 hover:bg-accent/40"
              >
                <UploadCloud className="size-5 text-primary" />
                <span className="text-muted-foreground">
                  {file ? file.name : "Choisir une photo de ta pièce d'identité"}
                </span>
                <input
                  id="kyc-file"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <Button onClick={handleSubmit} disabled={!file || isSubmitting} className="w-fit">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Envoi…
                </>
              ) : status?.status === "rejetee" ? (
                "Soumettre un nouveau document"
              ) : (
                "Soumettre ma pièce d'identité"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

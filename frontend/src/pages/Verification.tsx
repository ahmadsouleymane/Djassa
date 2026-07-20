import { useEffect, useState } from "react";
import { ShieldCheck, FileCheck2, Clock, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { uploadPhoto } from "@/api/products";
import { verificationApi, type VerificationStatus } from "@/api/verification";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/CameraCapture";
import { usePageTitle } from "@/hooks/usePageTitle";

const STATUS_LABELS: Record<VerificationStatus["status"], string> = {
  non_soumise: "Non soumise",
  en_attente: "En attente de revue",
  approuvee: "Approuvée",
  rejetee: "Rejetée",
};

const STATUS_VARIANT: Record<VerificationStatus["status"], React.ComponentProps<typeof Badge>["variant"]> = {
  non_soumise: "secondary",
  en_attente: "warning",
  approuvee: "success",
  rejetee: "destructive",
};

export function Verification() {
  usePageTitle("Vérification vendeur");
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [rectoFile, setRectoFile] = useState<File | null>(null);
  const [versoFile, setVersoFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rectoPreview, setRectoPreview] = useState<string | null>(null);
  const [versoPreview, setVersoPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  useEffect(() => {
    verificationApi.status().then((s) => {
      setStatus(s);
      if (s.rectoUrl) setRectoPreview(s.rectoUrl);
      if (s.versoUrl) setVersoPreview(s.versoUrl);
      if (s.selfieUrl) setSelfiePreview(s.selfieUrl);
    }).catch(() => {});
  }, []);

  function handleRecto(file: File) {
    if (!file) { setRectoFile(null); setRectoPreview(null); return; }
    setRectoFile(file);
    setRectoPreview(URL.createObjectURL(file));
  }

  function handleVerso(file: File) {
    if (!file) { setVersoFile(null); setVersoPreview(null); return; }
    setVersoFile(file);
    setVersoPreview(URL.createObjectURL(file));
  }

  function handleSelfie(file: File) {
    if (!file) { setSelfieFile(null); setSelfiePreview(null); return; }
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!rectoFile || !versoFile || !selfieFile) return;
    setIsSubmitting(true);
    try {
      const [rectoUrl, versoUrl, selfieUrl] = await Promise.all([
        uploadPhoto(rectoFile),
        uploadPhoto(versoFile),
        uploadPhoto(selfieFile),
      ]);
      await verificationApi.submit(rectoUrl, versoUrl, selfieUrl);
      const s = await verificationApi.status();
      setStatus(s);
      setRectoFile(null); setVersoFile(null); setSelfieFile(null);
      toast.success("Dossier envoyé", { description: "Tes 3 photos sont en cours d'examen (24 à 72h)." });
    } catch {
      toast.error("L'envoi a échoué. Réessaie.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    (!status || status.status === "non_soumise" || status.status === "rejetee");
  const allCaptured = rectoFile && versoFile && selfieFile;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">Vérification vendeur</h1>
        <p className="mt-1 text-muted-foreground">
          Prends 3 photos en direct depuis ta caméra pour vérifier ton identité.
          Pas d'upload de fichiers : tout doit être capturé en temps réel.
        </p>
      </header>

      {/* Status */}
      {status && status.status !== "non_soumise" && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-4">
          <span className="text-sm font-medium">Statut :</span>
          <Badge variant={STATUS_VARIANT[status.status]}>
            {STATUS_LABELS[status.status]}
          </Badge>
          {status.reason && (
            <span className="text-sm text-muted-foreground">Motif : {status.reason}</span>
          )}
          {status.status === "en_attente" && (
            <p className="w-full mt-2 text-sm text-muted-foreground">
              Ton dossier est en cours d'examen (24 à 72h). Reviens ici pour suivre l'avancement.
            </p>
          )}
          {status.status === "approuvee" && (
            <p className="w-full mt-2 flex items-center gap-2 text-sm font-medium text-primary">
              <ShieldCheck className="size-4" /> Ton identité est vérifiée. Tes annonces sont visibles.
            </p>
          )}
        </div>
      )}

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "Pourquoi 3 photos", body: "Le recto et le verso de ta pièce d'identité prouvent son authenticité. Le selfie confirme que c'est bien toi." },
          { icon: FileCheck2, title: "Pièces acceptées", body: "CNI, passeport ou permis de conduire ivoirien en cours de validité. Photos nettes et lisibles." },
          { icon: Clock, title: "Délai de revue", body: "Une équipe examine chaque dossier manuellement, généralement sous 24 à 72h ouvrées." },
        ].map((i) => (
          <div key={i.title} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-xs)]">
            <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
              <i.icon className="size-5" />
            </span>
            <h3 className="mt-3 font-semibold">{i.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{i.body}</p>
          </div>
        ))}
      </div>

      {/* Camera captures */}
      {canSubmit && (
        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
          <div>
            <h2 className="font-semibold text-lg">Prends tes 3 photos</h2>
            <p className="text-sm text-muted-foreground">
              Chaque photo doit être prise en direct avec ta caméra. Les fichiers importés ne sont pas acceptés.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <CameraCapture
                label="Recto de la pièce"
                hint="Face avant de ta CNI ou passeport"
                onCapture={handleRecto}
                capturedPreview={rectoPreview}
              />
            </div>
            <div>
              <CameraCapture
                label="Verso de la pièce"
                hint="Face arrière de ta CNI ou passeport"
                onCapture={handleVerso}
                capturedPreview={versoPreview}
              />
            </div>
            <div>
              <CameraCapture
                label="Selfie"
                hint="Photo de ton visage en direct"
                onCapture={handleSelfie}
                capturedPreview={selfiePreview}
              />
            </div>
          </div>

          {!allCaptured && (
            <p className="flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="size-4" />
              Les 3 photos sont obligatoires avant de pouvoir soumettre.
            </p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!allCaptured || isSubmitting}
            className="w-fit"
            size="lg"
          >
            {isSubmitting ? (
              <><Loader2 className="size-4 animate-spin" /> Envoi en cours…</>
            ) : status?.status === "rejetee" ? (
              "Soumettre un nouveau dossier"
            ) : (
              "Soumettre mon dossier de vérification"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { uploadPhoto } from "../api/products";
import { verificationApi, type VerificationStatus } from "../api/verification";

const STATUS_LABELS: Record<VerificationStatus["status"], string> = {
  non_soumise: "Non soumise",
  en_attente: "En attente de revue",
  approuvee: "Approuvée",
  rejetee: "Rejetée",
};

export function Verification() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    verificationApi.status().then(setStatus);
  }, []);

  async function handleSubmit() {
    if (!file) return;
    setIsSubmitting(true);
    try {
      const documentUrl = await uploadPhoto(file);
      await verificationApi.submit(documentUrl);
      setStatus(await verificationApi.status());
      setFile(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Vérification vendeur</h1>
      {status && (
        <p>
          Statut : {STATUS_LABELS[status.status]}
          {status.reason && ` — Motif : ${status.reason}`}
        </p>
      )}
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <button onClick={handleSubmit} disabled={!file || isSubmitting}>
        {isSubmitting ? "Envoi..." : "Soumettre ma pièce d'identité"}
      </button>
    </div>
  );
}

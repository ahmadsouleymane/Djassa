import { useEffect, useState } from "react";
import { uploadPhoto } from "../api/products";
import { verificationApi, type VerificationStatus } from "../api/verification";
import { usePageTitle } from "../hooks/usePageTitle";

const STATUS_LABELS: Record<VerificationStatus["status"], string> = {
  non_soumise: "Non soumise",
  en_attente: "En attente de revue",
  approuvee: "Approuvée",
  rejetee: "Rejetée",
};

const STATUS_TONE: Record<VerificationStatus["status"], string> = {
  non_soumise: "pill-neutral",
  en_attente: "pill-warning",
  approuvee: "pill-success",
  rejetee: "pill-danger",
};

export function Verification() {
  usePageTitle("Vérification vendeur");
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
      <div className="page-header">
        <h1>Vérification vendeur</h1>
        <p>Tes produits ne sont visibles publiquement qu'une fois ton identité vérifiée.</p>
      </div>
      <div className="card section animate-in">
        {status && (
          <p>
            Statut : <span className={`pill ${STATUS_TONE[status.status]}`}>{STATUS_LABELS[status.status]}</span>
            {status.reason && <span style={{ color: "var(--text2)" }}> — Motif : {status.reason}</span>}
          </p>
        )}
        <div className="field" style={{ marginTop: "1rem" }}>
          <label>Pièce d'identité</label>
          <input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={!file || isSubmitting}>
          {isSubmitting ? "Envoi..." : "Soumettre ma pièce d'identité"}
        </button>
      </div>
    </div>
  );
}

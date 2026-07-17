import { useEffect, useState } from "react";
import { verificationApi, type PendingVendor } from "../../api/verification";
import { usePageTitle } from "../../hooks/usePageTitle";
import "./AdminVerifications.css";

export function AdminVerifications() {
  usePageTitle("Vérifications — Admin");
  const [pending, setPending] = useState<PendingVendor[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  function reload() {
    verificationApi.listPending().then((res) => setPending(res.users));
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleApprove(userId: string) {
    await verificationApi.approve(userId);
    reload();
  }

  async function handleReject(userId: string) {
    const reason = reasons[userId];
    if (!reason?.trim()) return;
    await verificationApi.reject(userId, reason);
    reload();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Vérifications en attente</h1>
      </div>
      {pending.length === 0 ? (
        <div className="empty-state">Aucune vérification en attente.</div>
      ) : (
        <ul className="card-list">
          {pending.map((u) => (
            <li key={u.id} className="card verif-row">
              {u.documentUrl && <img src={u.documentUrl} alt="Pièce d'identité" />}
              <span className="email">{u.email}</span>
              <button className="btn btn-primary btn-sm" onClick={() => handleApprove(u.id)}>
                Approuver
              </button>
              <input
                className="input"
                value={reasons[u.id] ?? ""}
                onChange={(e) => setReasons({ ...reasons, [u.id]: e.target.value })}
                placeholder="Motif de rejet"
              />
              <button className="btn btn-danger btn-sm" onClick={() => handleReject(u.id)}>
                Rejeter
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

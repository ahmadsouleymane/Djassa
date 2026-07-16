import { useEffect, useState } from "react";
import { verificationApi, type PendingVendor } from "../../api/verification";

export function AdminVerifications() {
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
      <h1>Vérifications en attente</h1>
      <ul>
        {pending.map((u) => (
          <li key={u.id}>
            <p>{u.email}</p>
            {u.documentUrl && <img src={u.documentUrl} alt="Pièce d'identité" width={200} />}
            <button onClick={() => handleApprove(u.id)}>Approuver</button>
            <input
              value={reasons[u.id] ?? ""}
              onChange={(e) => setReasons({ ...reasons, [u.id]: e.target.value })}
              placeholder="Motif de rejet"
            />
            <button onClick={() => handleReject(u.id)}>Rejeter</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

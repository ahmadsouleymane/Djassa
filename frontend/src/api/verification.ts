import { apiClient } from "./client";

export type VerificationStatus = {
  status: "non_soumise" | "en_attente" | "approuvee" | "rejetee";
  documentUrl: string | null;
  reason: string | null;
};

export type PendingVendor = { id: string; email: string; documentUrl: string | null };

export const verificationApi = {
  submit: (documentUrl: string) => apiClient.post<{ status: string }>("/api/verification/submit", { documentUrl }),
  status: () => apiClient.get<VerificationStatus>("/api/verification/status"),
  listPending: () => apiClient.get<{ users: PendingVendor[] }>("/api/verification/admin/pending"),
  approve: (userId: string) => apiClient.post<{ status: string }>(`/api/verification/admin/${userId}/approve`, {}),
  reject: (userId: string, reason: string) =>
    apiClient.post<{ status: string }>(`/api/verification/admin/${userId}/reject`, { reason }),
};

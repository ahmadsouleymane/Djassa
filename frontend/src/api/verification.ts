import { apiClient } from "./client";

export type VerificationStatus = {
  status: "non_soumise" | "en_attente" | "approuvee" | "rejetee";
  rectoUrl: string | null;
  versoUrl: string | null;
  selfieUrl: string | null;
  reason: string | null;
};

export type PendingVendor = {
  id: string;
  email: string;
  rectoUrl: string | null;
  versoUrl: string | null;
  selfieUrl: string | null;
};

export const verificationApi = {
  submit: (rectoUrl: string, versoUrl: string, selfieUrl: string) =>
    apiClient.post<{ status: string }>("/api/verification/submit", { rectoUrl, versoUrl, selfieUrl }),

  status: () => apiClient.get<VerificationStatus>("/api/verification/status"),

  listPending: () => apiClient.get<{ users: PendingVendor[] }>("/api/verification/admin/pending"),

  approve: (userId: string) =>
    apiClient.post<{ status: string }>(`/api/verification/admin/${userId}/approve`, {}),

  reject: (userId: string, reason: string) =>
    apiClient.post<{ status: string }>(`/api/verification/admin/${userId}/reject`, { reason }),
};

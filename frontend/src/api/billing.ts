import { apiClient } from "./client";

export type PlanStatus = { planTier: "standard" | "pro"; planPeriodEnd: string | null };

export const billingApi = {
  checkout: () => apiClient.post<{ checkoutUrl: string; reference: string }>("/api/billing/subscribe", {}),
  me: () => apiClient.get<PlanStatus>("/api/billing/me"),
};

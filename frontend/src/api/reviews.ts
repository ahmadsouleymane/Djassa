import { apiClient } from "./client";

export type Review = { id: string; rating: number; comment: string; createdAt: string };
export type TrustScore = { score: number; disputeRate: number; lateShipRate: number; accountAgeDays: number; responseRate: number };

export const reviewsApi = {
  create: (orderId: string, rating: number, comment: string) =>
    apiClient.post<{ review: Review }>("/api/reviews", { orderId, rating, comment }),
  listForVendor: (vendorId: string) => apiClient.get<{ reviews: Review[] }>(`/api/public/vendors/${vendorId}/reviews`),
  trustScore: (vendorId: string) => apiClient.get<TrustScore>(`/api/public/vendors/${vendorId}/trust-score`),
};

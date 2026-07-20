import { apiClient } from "./client";

export type BoutiqueInfo = {
  storeName: string | null;
  storeDescription: string | null;
  storeLogoUrl: string | null;
  storeBannerUrl: string | null;
  canCustomize: boolean;
};

export type BoutiqueUpdate = {
  storeName?: string;
  storeDescription?: string;
  storeLogoUrl?: string | null;
  storeBannerUrl?: string | null;
};

export const boutiqueApi = {
  get: () => apiClient.get<{ boutique: BoutiqueInfo }>("/api/boutique"),
  update: (data: BoutiqueUpdate) => apiClient.put<{ boutique: BoutiqueInfo }>("/api/boutique", data),
};

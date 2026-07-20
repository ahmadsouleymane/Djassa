import { apiClient } from "./client";

export type PublicVendor = {
  id: string;
  createdAt: string;
  sellerVerificationStatus: "non_soumise" | "en_attente" | "approuvee" | "rejetee";
  planTier: "standard" | "pro";
  storeName?: string | null;
  storeDescription?: string | null;
  storeLogoUrl?: string | null;
  storeBannerUrl?: string | null;
};

export const vendorsApi = {
  get: (vendorId: string) =>
    apiClient.get<{ vendor: PublicVendor; productCount: number }>(`/api/public/vendors/${vendorId}`),
};

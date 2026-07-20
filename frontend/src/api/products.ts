import { apiClient } from "./client";

export type ProductCategory = "mode_beaute" | "electronique" | "maison" | "telephones" | "alimentation" | "autre";

export type Product = {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  deliveryInfo?: string | null;
  price: number;
  shippingFee: number;
  discountPercent?: number | null;
  category: ProductCategory;
  photos: string[];
  createdAt: string;
  vendorPlanTier?: "standard" | "pro";
};

type SignedUpload = { cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string };

export const productsApi = {
  listMine: () => apiClient.get<{ products: Product[] }>("/api/products/mine"),
  create: (data: Omit<Product, "id" | "vendorId" | "createdAt">) =>
    apiClient.post<{ product: Product }>("/api/products", data),
  update: (id: string, data: Partial<Omit<Product, "id" | "vendorId" | "createdAt">>) =>
    apiClient.patch<{ product: Product }>(`/api/products/${id}`, data),
  remove: (id: string) => apiClient.delete<void>(`/api/products/${id}`),
  signUpload: () => apiClient.post<SignedUpload>("/api/uploads/sign", {}),
};

export type ProductListParams = { category?: string; search?: string; vendorId?: string; limit?: number };

export const publicProductsApi = {
  get: (id: string) => apiClient.get<{ product: Product }>(`/api/public/products/${id}`),
  list: (params: ProductListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.search) qs.set("search", params.search);
    if (params.vendorId) qs.set("vendorId", params.vendorId);
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return apiClient.get<{ products: Product[] }>(`/api/public/products${query ? `?${query}` : ""}`);
  },
};

export async function uploadPhoto(file: File): Promise<string> {
  const signed = await productsApi.signUpload();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signed.apiKey);
  formData.append("timestamp", String(signed.timestamp));
  formData.append("signature", signed.signature);
  formData.append("folder", signed.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Échec de l'upload de la photo");
  const body = await res.json();
  return body.secure_url as string;
}

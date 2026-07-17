import { apiClient } from "./client";

export type Product = {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  photos: string[];
  createdAt: string;
};

type SignedUpload = { cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string };

export const productsApi = {
  listMine: () => apiClient.get<{ products: Product[] }>("/api/products/mine"),
  create: (data: Omit<Product, "id" | "vendorId" | "createdAt">) =>
    apiClient.post<{ product: Product }>("/api/products", data),
  signUpload: () => apiClient.post<SignedUpload>("/api/uploads/sign", {}),
};

export const publicProductsApi = {
  get: (id: string) => apiClient.get<{ product: Product }>(`/api/public/products/${id}`),
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

import { apiClient } from "./client";

export type OrderStatus = "en_attente_paiement" | "paye" | "expedie" | "confirme" | "en_litige" | "rembourse";

export type Order = {
  id: string;
  buyerId: string;
  vendorId: string;
  productId: string;
  quantity: number;
  price: number;
  commissionAmount: number;
  netAmount: number;
  status: OrderStatus;
  confirmationCode?: string;
  shipBy: string | null;
  confirmBy: string | null;
  createdAt: string;
};

export type CheckoutItem = { productId: string; quantity: number };

export type CheckoutSummary = {
  reference: string;
  total: number;
  items: {
    id: string;
    title: string;
    photo: string | null;
    unitPrice: number;
    quantity: number;
    linePrice: number;
  }[];
};

export const ordersApi = {
  create: (chatMessageId: string) => apiClient.post<{ order: Order }>("/api/orders", { chatMessageId }),
  createDirect: (items: CheckoutItem[]) =>
    apiClient.post<{ orders: Order[]; checkoutUrl: string; reference: string }>("/api/orders/direct", { items }),
  checkoutSummary: (reference: string) =>
    apiClient.get<CheckoutSummary>(`/api/orders/checkout/${reference}`),
  pay: (reference: string) => apiClient.post<{ paid: number }>("/api/orders/pay", { reference }),
  listMine: () => apiClient.get<{ orders: Order[] }>("/api/orders/mine"),
  checkout: (orderId: string) => apiClient.post<{ checkoutUrl: string; reference: string }>(`/api/orders/${orderId}/checkout`, {}),
  ship: (orderId: string) => apiClient.post<{ order: Order }>(`/api/orders/${orderId}/ship`, {}),
  confirm: (orderId: string) => apiClient.post<{ order: Order }>(`/api/orders/${orderId}/confirm`, {}),
  dispute: (orderId: string, reason: string) =>
    apiClient.post<{ order: Order }>(`/api/orders/${orderId}/dispute`, { reason }),
};

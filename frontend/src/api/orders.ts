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
  trackingNumber?: string | null;
  carrier?: string | null;
  disputeReason?: string | null;
  createdAt: string;
};

export type VendorStats = {
  totalOrders: number;
  revenue30d: number;
  averageOrderValue: number;
  byStatus: Record<string, number>;
  revenueSeries: { day: string; revenue: number; orders: number }[];
  topProducts: { productId: string; title: string; photo: string | null; revenue: number; unitsSold: number; orders: number }[];
  pendingShipments: { id: string; productTitle: string; photo: string | null; shipBy: string | null; price: number }[];
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
  ship: (orderId: string, tracking?: { trackingNumber?: string; carrier?: string }) =>
    apiClient.post<{ order: Order }>(`/api/orders/${orderId}/ship`, tracking ?? {}),
  confirm: (orderId: string) => apiClient.post<{ order: Order }>(`/api/orders/${orderId}/confirm`, {}),
  dispute: (orderId: string, reason: string) =>
    apiClient.post<{ order: Order }>(`/api/orders/${orderId}/dispute`, { reason }),
  vendorStats: () => apiClient.get<VendorStats>("/api/orders/stats/vendor"),
};

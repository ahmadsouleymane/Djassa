import { apiClient } from "./client";
import type { Order } from "./orders";

export type AdminOverview = {
  users: {
    byAccountType: Record<string, number>;
    byVerificationStatus: Record<string, number>;
    new30d: number;
  };
  orders: {
    byStatus: Record<string, number>;
    commissionRevenue30d: number;
  };
  pendingVerifications: number;
  openDisputes: number;
  openReports: number;
  visitors7d: {
    totalSessions: number;
    totalVisitors: number;
    returningSessions: number;
    totalPageviews: number;
    totalErrors: number;
    avgSessionDurationSeconds: number;
  };
};

export type DisputeOrder = Order & {
  product: { title: string; photos: string[] };
  buyer: { id: string; email: string };
  vendor: { id: string; email: string };
};

export type Report = {
  id: string;
  reporterId: string;
  reporter: { email: string; accountType: string };
  targetType: "produit" | "utilisateur" | "message";
  targetId: string;
  reason: string;
  status: "en_attente" | "traite" | "rejete";
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type AnalyticsSeriesPoint = { day: string; sessions: number; pageviews: number };
export type TopPage = { path: string | null; views?: number; count?: number };
export type DeviceBreakdown = { deviceType: string; count: number };
export type CountryBreakdown = { country: string | null; count: number };

export type AnalyticsErrorEvent = {
  id: string;
  type: string;
  path: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  session: {
    country: string | null;
    city: string | null;
    deviceType: string | null;
    browser: string | null;
    os: string | null;
    userId: string | null;
    visitorId: string;
  };
};

export type WaitlistSignup = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};

export type SentEmail = {
  id: string;
  subject: string;
  body: string;
  recipientFilter: string;
  recipientCount: number;
  createdAt: string;
};

export const adminApi = {
  overview: () => apiClient.get<AdminOverview>("/api/admin/overview"),
  disputes: () => apiClient.get<{ disputes: DisputeOrder[] }>("/api/admin/disputes"),
  reports: (status?: string) =>
    apiClient.get<{ reports: Report[] }>(`/api/admin/reports${status ? `?status=${status}` : ""}`),
  resolveReport: (id: string, status: "traite" | "rejete", adminNote?: string) =>
    apiClient.post<{ report: Report }>(`/api/admin/reports/${id}/resolve`, { status, adminNote }),
  waitlist: () => apiClient.get<{ signups: WaitlistSignup[] }>("/api/admin/waitlist"),
  analyticsOverview: (range = 7) => apiClient.get<AdminOverview["visitors7d"]>(`/api/admin/analytics/overview?range=${range}`),
  analyticsSeries: (range = 14) => apiClient.get<{ series: AnalyticsSeriesPoint[] }>(`/api/admin/analytics/series?range=${range}`),
  analyticsPages: (range = 7) => apiClient.get<{ pages: TopPage[] }>(`/api/admin/analytics/pages?range=${range}`),
  analyticsExitPages: (range = 7) => apiClient.get<{ pages: TopPage[] }>(`/api/admin/analytics/exit-pages?range=${range}`),
  analyticsDevices: (range = 7) => apiClient.get<{ devices: DeviceBreakdown[] }>(`/api/admin/analytics/devices?range=${range}`),
  analyticsCountries: (range = 7) => apiClient.get<{ countries: CountryBreakdown[] }>(`/api/admin/analytics/countries?range=${range}`),
  analyticsErrors: (page = 1) => apiClient.get<{ items: AnalyticsErrorEvent[]; total: number }>(`/api/admin/analytics/errors?page=${page}`),
  sendEmail: (data: { recipientFilter: string; customEmail?: string; subject: string; body: string }) =>
    apiClient.post<{ recipientCount: number }>("/api/admin/emails/send", data),
  emailHistory: (page = 1) => apiClient.get<{ emails: SentEmail[] }>(`/api/admin/emails/history?page=${page}`),
};

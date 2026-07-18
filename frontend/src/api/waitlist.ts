import { apiClient } from "./client";

export type WaitlistInput = {
  firstName: string;
  lastName: string;
  email: string;
};

export const waitlistApi = {
  join: (data: WaitlistInput) =>
    apiClient.post<{ signup: { id: string; email: string } }>("/api/waitlist", data),
  count: () => apiClient.get<{ count: number }>("/api/waitlist/count"),
};

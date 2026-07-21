import { apiClient } from "./client";

export type ReferralLevel = "nouvo" | "kpata" | "boss" | "grand_choco";

export type ReferralEntry = {
  id: string;
  email: string;
  status: "pending" | "signed_up" | "purchased";
  rewardStatus: "pending" | "credited";
  rewardAmount: number;
  createdAt: string;
};

export type ReferralStats = {
  code: string | null;
  totalReferrals: number;
  conversions: number;
  rewardedConversions: number;
  totalEarnings: number;
  level: ReferralLevel;
  nextThreshold: { nextLevel: ReferralLevel; needed: number } | null;
  referrals: ReferralEntry[];
};

export type ReferralCode = {
  code: string;
};

export type CodeCheckResult = {
  valid: true;
  referrerName: string;
};

export type LeaderboardEntry = {
  rank: number;
  referrerName: string;
  count: number;
};

export const referralApi = {
  getCode: () => apiClient.get<ReferralCode>("/api/referrals/code"),
  getStats: () => apiClient.get<ReferralStats>("/api/referrals/mine"),
  applyCode: (code: string, email: string) =>
    apiClient.post<{ success: boolean; referrerName: string }>("/api/referrals/apply", { code, email }),
  checkCode: (code: string) =>
    apiClient.get<CodeCheckResult>(`/api/referrals/check/${encodeURIComponent(code)}`),
  getLeaderboard: () =>
    apiClient.get<{ leaderboard: LeaderboardEntry[] }>("/api/referrals/leaderboard"),
};

import { UserRepository } from "../users/user.repository.js";
import { OrderRepository } from "../orders/order.repository.js";
import { OrderService } from "../orders/order.service.js";
import { VerificationService } from "../verification/verification.service.js";
import { ReportService } from "../reports/report.service.js";
import { WaitlistService } from "../waitlist/waitlist.service.js";
import { AnalyticsService } from "../analytics/analytics.service.js";
import { AdminEmailRepository } from "./admin-email.repository.js";
import { sendEmail } from "../../shared/email/index.js";
import { ValidationError } from "../../shared/errors/index.js";
import type { SendAdminEmailInput } from "./admin-email.schema.js";

const userRepo = new UserRepository();
const orderRepo = new OrderRepository();
const adminEmailRepo = new AdminEmailRepository();

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function toCountMap<K extends string>(rows: { _count: { _all: number } }[], key: K) {
  const map: Record<string, number> = {};
  for (const row of rows as unknown as Record<string, unknown>[]) {
    map[String(row[key])] = (row._count as { _all: number })._all;
  }
  return map;
}

export const AdminService = {
  async overview() {
    const since30d = daysAgo(30);
    const [
      usersByType,
      verificationCounts,
      newUsers30d,
      ordersByStatus,
      commission30d,
      pendingVerifications,
      openDisputes,
      openReports,
      analytics,
    ] = await Promise.all([
      userRepo.countByAccountType(),
      userRepo.countByVerificationStatus(),
      userRepo.countSince(since30d),
      orderRepo.countByStatus(),
      orderRepo.sumCommission(since30d),
      VerificationService.listPending(),
      OrderService.adminListDisputes(),
      ReportService.countOpen(),
      AnalyticsService.overview(daysAgo(7)),
    ]);

    return {
      users: {
        byAccountType: toCountMap(usersByType, "accountType"),
        byVerificationStatus: toCountMap(verificationCounts, "sellerVerificationStatus"),
        new30d: newUsers30d,
      },
      orders: {
        byStatus: toCountMap(ordersByStatus, "status"),
        commissionRevenue30d: commission30d,
      },
      pendingVerifications: pendingVerifications.length,
      openDisputes: openDisputes.length,
      openReports,
      visitors7d: analytics,
    };
  },

  listDisputes() {
    return OrderService.adminListDisputes();
  },

  listReports(status?: "en_attente" | "traite" | "rejete") {
    return ReportService.list(status);
  },

  resolveReport(id: string, status: "traite" | "rejete", adminNote?: string) {
    return ReportService.resolve(id, status, adminNote);
  },

  listWaitlist() {
    return WaitlistService.list();
  },

  async analyticsOverview(rangeDays: number) {
    return AnalyticsService.overview(daysAgo(rangeDays));
  },

  async analyticsSeries(rangeDays: number) {
    return AnalyticsService.series(daysAgo(rangeDays));
  },

  async analyticsTopPages(rangeDays: number) {
    return AnalyticsService.topPages(daysAgo(rangeDays));
  },

  async analyticsExitPages(rangeDays: number) {
    return AnalyticsService.topExitPages(daysAgo(rangeDays));
  },

  async analyticsDevices(rangeDays: number) {
    return AnalyticsService.devices(daysAgo(rangeDays));
  },

  async analyticsCountries(rangeDays: number) {
    return AnalyticsService.countries(daysAgo(rangeDays));
  },

  async analyticsErrors(page: number) {
    return AnalyticsService.errors(page);
  },

  async analyticsSessions(page: number) {
    return AnalyticsService.sessions(page);
  },

  async sendBroadcastEmail(adminId: string, input: SendAdminEmailInput) {
    let recipients: string[];
    if (input.recipientFilter === "custom") {
      if (!input.customEmail) throw new ValidationError({ customEmail: "Adresse email requise" });
      recipients = [input.customEmail];
    } else if (input.recipientFilter === "vendeurs") {
      recipients = await userRepo.emailsByAccountType("vendeur");
    } else if (input.recipientFilter === "clients") {
      recipients = await userRepo.emailsByAccountType("client");
    } else {
      recipients = await userRepo.emailsByAccountType();
    }

    if (recipients.length === 0) {
      throw new ValidationError({ recipientFilter: "Aucun destinataire pour ce filtre" });
    }

    for (const batch of chunk(recipients, 40)) {
      await sendEmail(batch, input.subject, input.body);
    }

    await adminEmailRepo.logSend({
      sentByAdminId: adminId,
      subject: input.subject,
      body: input.body,
      recipientFilter: input.recipientFilter,
      recipientCount: recipients.length,
    });

    return { recipientCount: recipients.length };
  },

  emailHistory(page: number) {
    return adminEmailRepo.history(page, 30);
  },
};

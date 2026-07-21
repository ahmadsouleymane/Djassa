import { ReportRepository } from "./report.repository.js";
import { UserRepository } from "../users/user.repository.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { sendEmail, signalementRecuAdminEmailHtml, signalementResoluEmailHtml } from "../../shared/email/index.js";
import { config } from "../../shared/config/index.js";
import type { ReportStatus, ReportTargetType } from "@prisma/client";

const reportRepo = new ReportRepository();
const userRepo = new UserRepository();

export const ReportService = {
  async create(reporterId: string, targetType: ReportTargetType, targetId: string, reason: string) {
    const report = await reportRepo.create({ reporterId, targetType, targetId, reason });

    // Notifier les admins (fire-and-forget)
    const reporter = await userRepo.findById(reporterId);
    if (config.adminEmails.length > 0) {
      sendEmail(
        config.adminEmails,
        `Nouveau signalement (${targetType})`,
        signalementRecuAdminEmailHtml({
          targetType,
          targetId,
          reason,
          reporterEmail: reporter?.email ?? "inconnu",
        }),
      );
    }

    return report;
  },

  list(status?: ReportStatus) {
    return reportRepo.findMany(status);
  },

  countOpen() {
    return reportRepo.countOpen();
  },

  async resolve(id: string, status: "traite" | "rejete", adminNote?: string) {
    const report = await reportRepo.findById(id);
    if (!report) throw new NotFoundError("Signalement");
    if (report.status !== "en_attente") {
      throw new ValidationError({ status: "Ce signalement a déjà été traité" });
    }
    const updated = await reportRepo.update(id, { status, adminNote: adminNote ?? null, resolvedAt: new Date() });

    // Notifier le reporter (fire-and-forget)
    const fullReport = await reportRepo.findByIdWithReporter(id);
    if (fullReport?.reporter?.email) {
      sendEmail(
        fullReport.reporter.email,
        `Signalement ${status === "traite" ? "traité" : "examiné"}`,
        signalementResoluEmailHtml({
          reporterName: fullReport.reporter.email.split("@")[0],
          resolution: status,
          adminNote: adminNote ?? null,
        }),
      );
    }

    return updated;
  },
};

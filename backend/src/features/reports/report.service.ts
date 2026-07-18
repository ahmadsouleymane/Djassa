import { ReportRepository } from "./report.repository.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import type { ReportStatus, ReportTargetType } from "@prisma/client";

const reportRepo = new ReportRepository();

export const ReportService = {
  create(reporterId: string, targetType: ReportTargetType, targetId: string, reason: string) {
    return reportRepo.create({ reporterId, targetType, targetId, reason });
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
    return reportRepo.update(id, { status, adminNote: adminNote ?? null, resolvedAt: new Date() });
  },
};

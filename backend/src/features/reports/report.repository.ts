import { prisma } from "../../shared/db/client.js";
import type { Report, ReportStatus, ReportTargetType, Prisma } from "@prisma/client";

type CreateInput = {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
};

export class ReportRepository {
  create(data: CreateInput): Promise<Report> {
    return prisma.report.create({ data });
  }

  findById(id: string): Promise<Report | null> {
    return prisma.report.findUnique({ where: { id } });
  }

  findMany(status?: ReportStatus) {
    return prisma.report.findMany({
      where: status ? { status } : undefined,
      include: { reporter: { select: { email: true, accountType: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  countOpen(): Promise<number> {
    return prisma.report.count({ where: { status: "en_attente" } });
  }

  update(id: string, data: Prisma.ReportUpdateInput): Promise<Report> {
    return prisma.report.update({ where: { id }, data });
  }
}

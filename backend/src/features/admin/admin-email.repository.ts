import { prisma } from "../../shared/db/client.js";
import type { SentEmail } from "@prisma/client";

export class AdminEmailRepository {
  logSend(data: {
    sentByAdminId: string;
    subject: string;
    body: string;
    recipientFilter: string;
    recipientCount: number;
  }): Promise<SentEmail> {
    return prisma.sentEmail.create({ data });
  }

  history(page: number, pageSize: number) {
    return prisma.sentEmail.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }
}

import { prisma } from "../../shared/db/client.js";
import type { Prisma } from "@prisma/client";

type SessionUpsertData = {
  visitorId: string;
  userId?: string | null;
  deviceType?: string | null;
  browser?: string | null;
  os?: string | null;
  country?: string | null;
  city?: string | null;
  ipHash?: string | null;
  referrer?: string | null;
  entryPath?: string | null;
  isReturning: boolean;
};

type SessionTouchData = {
  userId?: string | null;
  exitPath?: string | null;
  durationSeconds?: number;
};

export class AnalyticsRepository {
  findSessionById(id: string) {
    return prisma.analyticsSession.findUnique({ where: { id } });
  }

  findLatestSessionForVisitor(visitorId: string, before: Date) {
    return prisma.analyticsSession.findFirst({
      where: { visitorId, startedAt: { lt: before } },
      orderBy: { startedAt: "desc" },
    });
  }

  createSession(id: string, data: SessionUpsertData) {
    return prisma.analyticsSession.create({ data: { id, ...data } });
  }

  touchSession(id: string, data: SessionTouchData) {
    return prisma.analyticsSession.update({
      where: { id },
      data: {
        lastSeenAt: new Date(),
        ...(data.userId ? { userId: data.userId } : {}),
        ...(data.exitPath ? { exitPath: data.exitPath } : {}),
        ...(data.durationSeconds !== undefined ? { durationSeconds: data.durationSeconds } : {}),
      },
    });
  }

  createEvents(events: Prisma.AnalyticsEventCreateManyInput[]) {
    return prisma.analyticsEvent.createMany({ data: events });
  }

  async overview(since: Date) {
    const [totalSessions, returningSessions, totalPageviews, totalErrors, avgDuration, distinctVisitors] =
      await Promise.all([
        prisma.analyticsSession.count({ where: { startedAt: { gte: since } } }),
        prisma.analyticsSession.count({ where: { startedAt: { gte: since }, isReturning: true } }),
        prisma.analyticsEvent.count({ where: { type: "pageview", createdAt: { gte: since } } }),
        prisma.analyticsEvent.count({ where: { type: "error", createdAt: { gte: since } } }),
        prisma.analyticsSession.aggregate({ _avg: { durationSeconds: true }, where: { startedAt: { gte: since } } }),
        prisma.analyticsSession.findMany({
          where: { startedAt: { gte: since } },
          distinct: ["visitorId"],
          select: { visitorId: true },
        }),
      ]);

    return {
      totalSessions,
      totalVisitors: distinctVisitors.length,
      returningSessions,
      totalPageviews,
      totalErrors,
      avgSessionDurationSeconds: Math.round(avgDuration._avg.durationSeconds ?? 0),
    };
  }

  async dailySeries(since: Date): Promise<{ day: Date; sessions: bigint; pageviews: bigint }[]> {
    return prisma.$queryRaw`
      SELECT day, COALESCE(s.sessions, 0)::bigint AS sessions, COALESCE(p.pageviews, 0)::bigint AS pageviews
      FROM generate_series(date_trunc('day', ${since}::timestamp), date_trunc('day', now()), interval '1 day') AS day
      LEFT JOIN (
        SELECT date_trunc('day', "startedAt") AS day, COUNT(*) AS sessions
        FROM "AnalyticsSession"
        WHERE "startedAt" >= ${since}
        GROUP BY 1
      ) s USING (day)
      LEFT JOIN (
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS pageviews
        FROM "AnalyticsEvent"
        WHERE type = 'pageview' AND "createdAt" >= ${since}
        GROUP BY 1
      ) p USING (day)
      ORDER BY day ASC
    `;
  }

  topPaths(since: Date, limit: number) {
    return prisma.analyticsEvent.groupBy({
      by: ["path"],
      where: { type: "pageview", createdAt: { gte: since }, path: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: limit,
    });
  }

  topExitPaths(since: Date, limit: number) {
    return prisma.analyticsSession.groupBy({
      by: ["exitPath"],
      where: { startedAt: { gte: since }, exitPath: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { exitPath: "desc" } },
      take: limit,
    });
  }

  deviceBreakdown(since: Date) {
    return prisma.analyticsSession.groupBy({
      by: ["deviceType"],
      where: { startedAt: { gte: since } },
      _count: { _all: true },
    });
  }

  countryBreakdown(since: Date, limit: number) {
    return prisma.analyticsSession.groupBy({
      by: ["country"],
      where: { startedAt: { gte: since }, country: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
      take: limit,
    });
  }

  topClickedTargets(since: Date, limit: number) {
    return prisma.analyticsEvent.groupBy({
      by: ["targetId"],
      where: { type: "click", createdAt: { gte: since }, targetId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { targetId: "desc" } },
      take: limit,
    });
  }

  errorLog(page: number, pageSize: number) {
    return prisma.analyticsEvent.findMany({
      where: { type: "error" },
      include: { session: { select: { country: true, city: true, deviceType: true, browser: true, os: true, userId: true, visitorId: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  countErrors() {
    return prisma.analyticsEvent.count({ where: { type: "error" } });
  }

  recentSessions(page: number, pageSize: number) {
    return prisma.analyticsSession.findMany({
      orderBy: { lastSeenAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { email: true, accountType: true } } },
    });
  }
}

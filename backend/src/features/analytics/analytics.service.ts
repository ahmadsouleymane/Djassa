import { randomUUID, createHash } from "node:crypto";
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";
import type { Prisma } from "@prisma/client";
import { AnalyticsRepository } from "./analytics.repository.js";
import { config } from "../../shared/config/index.js";
import type { IngestPayload } from "./analytics.schema.js";

const repo = new AnalyticsRepository();

function hashIp(ip: string): string {
  return createHash("sha256").update(`${ip}:${config.jwt.accessSecret}`).digest("hex");
}

function parseDevice(userAgent: string | undefined) {
  if (!userAgent) return { deviceType: null, browser: null, os: null };
  const { browser, os, device } = new UAParser(userAgent).getResult();
  return {
    deviceType: device.type ?? "desktop",
    browser: browser.name ?? null,
    os: os.name ?? null,
  };
}

function clientIp(req: { ip?: string; headers: Record<string, unknown> }): string {
  return req.ip ?? "0.0.0.0";
}

export const AnalyticsService = {
  async ingest(
    payload: IngestPayload,
    req: { ip?: string; headers: Record<string, unknown> },
    userId: string | undefined,
  ) {
    const existing = await repo.findSessionById(payload.sessionId);
    const ip = clientIp(req);
    const geo = geoip.lookup(ip === "::1" || ip === "127.0.0.1" ? "" : ip);

    if (!existing) {
      const device = parseDevice(req.headers["user-agent"] as string | undefined);
      const previous = await repo.findLatestSessionForVisitor(payload.visitorId, new Date());
      const isReturning = payload.isReturning ?? Boolean(previous);

      await repo.createSession(payload.sessionId, {
        visitorId: payload.visitorId,
        userId: userId ?? null,
        deviceType: device.deviceType,
        browser: device.browser,
        os: device.os,
        country: geo?.country ?? null,
        city: geo?.city ?? null,
        ipHash: hashIp(ip),
        referrer: payload.referrer ?? null,
        entryPath: payload.entryPath ?? null,
        isReturning,
      });

      if (previous) {
        const gapSeconds = Math.max(0, Math.round((Date.now() - previous.lastSeenAt.getTime()) / 1000));
        await repo.createEvents([
          {
            id: randomUUID(),
            sessionId: payload.sessionId,
            type: "session_start",
            path: payload.entryPath ?? null,
            metadata: { returningAfterSeconds: gapSeconds },
            createdAt: new Date(),
          },
        ]);
      }
    } else {
      await repo.touchSession(payload.sessionId, {
        userId: userId ?? existing.userId ?? null,
        exitPath: payload.exitPath,
        durationSeconds: payload.durationSeconds,
      });
    }

    if (payload.events.length > 0) {
      await repo.createEvents(
        payload.events.map((e) => ({
          id: randomUUID(),
          sessionId: payload.sessionId,
          type: e.type,
          path: e.path ?? null,
          targetId: e.targetId ?? null,
          message: e.message ?? null,
          metadata: e.metadata as Prisma.InputJsonValue | undefined,
          createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
        })),
      );
    }

    return { ok: true };
  },

  async overview(since: Date) {
    return repo.overview(since);
  },

  async series(since: Date) {
    const rows = await repo.dailySeries(since);
    return rows.map((r) => ({
      day: r.day.toISOString().slice(0, 10),
      sessions: Number(r.sessions),
      pageviews: Number(r.pageviews),
    }));
  },

  async topPages(since: Date, limit = 10) {
    const rows = await repo.topPaths(since, limit);
    return rows.map((r) => ({ path: r.path, views: r._count._all }));
  },

  async topExitPages(since: Date, limit = 10) {
    const rows = await repo.topExitPaths(since, limit);
    return rows.map((r) => ({ path: r.exitPath, count: r._count._all }));
  },

  async devices(since: Date) {
    const rows = await repo.deviceBreakdown(since);
    return rows.map((r) => ({ deviceType: r.deviceType ?? "inconnu", count: r._count._all }));
  },

  async countries(since: Date, limit = 15) {
    const rows = await repo.countryBreakdown(since, limit);
    return rows.map((r) => ({ country: r.country, count: r._count._all }));
  },

  async topClicked(since: Date, limit = 10) {
    const rows = await repo.topClickedTargets(since, limit);
    return rows.map((r) => ({ targetId: r.targetId, clicks: r._count._all }));
  },

  async errors(page: number, pageSize = 30) {
    const [items, total] = await Promise.all([repo.errorLog(page, pageSize), repo.countErrors()]);
    return { items, total, page, pageSize };
  },

  async sessions(page: number, pageSize = 30) {
    return repo.recentSessions(page, pageSize);
  },
};

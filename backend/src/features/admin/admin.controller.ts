import type { Request, Response, NextFunction } from "express";
import { AdminService } from "./admin.service.js";
import { resolveReportSchema } from "../reports/report.schema.js";
import { sendAdminEmailSchema } from "./admin-email.schema.js";
import { ValidationError } from "../../shared/errors/index.js";

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) result[key] = messages[0];
  }
  return result;
}

function rangeDays(req: Request): number {
  const raw = Number(req.query.range);
  if (!Number.isFinite(raw)) return 7;
  return Math.min(90, Math.max(1, Math.round(raw)));
}

function page(req: Request): number {
  const raw = Number(req.query.page);
  if (!Number.isFinite(raw)) return 1;
  return Math.max(1, Math.round(raw));
}

export async function overview(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await AdminService.overview());
  } catch (err) {
    next(err);
  }
}

export async function disputes(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ disputes: await AdminService.listDisputes() });
  } catch (err) {
    next(err);
  }
}

export async function reports(req: Request, res: Response, next: NextFunction) {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const valid = status === "en_attente" || status === "traite" || status === "rejete" ? status : undefined;
  try {
    res.json({ reports: await AdminService.listReports(valid) });
  } catch (err) {
    next(err);
  }
}

export async function resolveReport(req: Request, res: Response, next: NextFunction) {
  const parsed = resolveReportSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const report = await AdminService.resolveReport(req.params.id as string, parsed.data.status, parsed.data.adminNote);
    res.json({ report });
  } catch (err) {
    next(err);
  }
}

export async function waitlist(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ signups: await AdminService.listWaitlist() });
  } catch (err) {
    next(err);
  }
}

export async function analyticsOverview(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await AdminService.analyticsOverview(rangeDays(req)));
  } catch (err) {
    next(err);
  }
}

export async function analyticsSeries(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ series: await AdminService.analyticsSeries(rangeDays(req)) });
  } catch (err) {
    next(err);
  }
}

export async function analyticsTopPages(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ pages: await AdminService.analyticsTopPages(rangeDays(req)) });
  } catch (err) {
    next(err);
  }
}

export async function analyticsExitPages(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ pages: await AdminService.analyticsExitPages(rangeDays(req)) });
  } catch (err) {
    next(err);
  }
}

export async function analyticsDevices(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ devices: await AdminService.analyticsDevices(rangeDays(req)) });
  } catch (err) {
    next(err);
  }
}

export async function analyticsCountries(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ countries: await AdminService.analyticsCountries(rangeDays(req)) });
  } catch (err) {
    next(err);
  }
}

export async function analyticsErrors(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await AdminService.analyticsErrors(page(req)));
  } catch (err) {
    next(err);
  }
}

export async function analyticsSessions(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ sessions: await AdminService.analyticsSessions(page(req)) });
  } catch (err) {
    next(err);
  }
}

export async function sendBroadcastEmail(req: Request, res: Response, next: NextFunction) {
  const parsed = sendAdminEmailSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const result = await AdminService.sendBroadcastEmail(req.userId!, parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function emailHistory(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ emails: await AdminService.emailHistory(page(req)) });
  } catch (err) {
    next(err);
  }
}

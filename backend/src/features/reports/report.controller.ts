import type { Request, Response, NextFunction } from "express";
import { ReportService } from "./report.service.js";
import { createReportSchema } from "./report.schema.js";
import { ValidationError } from "../../shared/errors/index.js";

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) result[key] = messages[0];
  }
  return result;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  const parsed = createReportSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const report = await ReportService.create(
      req.userId!,
      parsed.data.targetType,
      parsed.data.targetId,
      parsed.data.reason,
    );
    res.status(201).json({ report });
  } catch (err) {
    next(err);
  }
}

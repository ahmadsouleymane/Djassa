import type { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "./analytics.service.js";
import { ingestSchema } from "./analytics.schema.js";

export async function ingest(req: Request, res: Response, next: NextFunction) {
  const parsed = ingestSchema.safeParse(req.body);
  if (!parsed.success) {
    // Le tracking ne doit jamais casser l'expérience du visiteur : on répond 204
    // même sur un payload malformé plutôt que de propager une 4xx bruyante.
    res.status(204).end();
    return;
  }

  try {
    await AnalyticsService.ingest(parsed.data, req, req.userId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

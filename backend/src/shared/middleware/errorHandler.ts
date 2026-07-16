import type { NextFunction, Request, Response } from "express";
import { AppError, ValidationError } from "../errors/index.js";
import { logger } from "../logger/index.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
      requestId: req.requestId,
    });
  }
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      requestId: req.requestId,
    });
  }
  logger.error({ err, requestId: req.requestId }, "Erreur non gérée");
  res.status(500).json({ error: "Erreur interne", code: "INTERNAL_ERROR", requestId: req.requestId });
}

import type { Request, Response, NextFunction } from "express";
import type { Order } from "@prisma/client";
import { OrderService } from "./order.service.js";
import { createOrderSchema, createDirectOrderSchema, payDirectSchema, shipSchema, disputeSchema, resolveDisputeSchema } from "./order.schema.js";
import { ValidationError } from "../../shared/errors/index.js";

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) result[key] = messages[0];
  }
  return result;
}

function serializeOrder(order: Order, viewerId: string) {
  const { confirmationCode, ...rest } = order;
  return viewerId === order.buyerId ? order : rest;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const order = await OrderService.createFromOffer(req.userId!, parsed.data.chatMessageId);
    res.status(201).json({ order: serializeOrder(order, req.userId!) });
  } catch (err) {
    next(err);
  }
}

export async function createDirect(req: Request, res: Response, next: NextFunction) {
  const parsed = createDirectOrderSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const result = await OrderService.createDirectBatch(req.userId!, parsed.data.items);
    res.status(201).json({
      orders: result.orders.map((o) => serializeOrder(o, req.userId!)),
      checkoutUrl: result.checkoutUrl,
      reference: result.reference,
    });
  } catch (err) {
    next(err);
  }
}

export async function checkoutSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await OrderService.getCheckoutSummary(req.userId!, req.params.reference as string);
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

export async function payDirect(req: Request, res: Response, next: NextFunction) {
  const parsed = payDirectSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const result = await OrderService.payDirect(req.userId!, parsed.data.reference);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await OrderService.listMine(req.userId!);
    res.json({ orders: orders.map((o) => serializeOrder(o, req.userId!)) });
  } catch (err) {
    next(err);
  }
}

export async function checkout(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await OrderService.checkout(req.userId!, req.params.id as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function ship(req: Request, res: Response, next: NextFunction) {
  const parsed = shipSchema.safeParse(req.body ?? {});
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const order = await OrderService.markShipped(req.userId!, req.params.id as string, parsed.data);
    res.json({ order: serializeOrder(order, req.userId!) });
  } catch (err) {
    next(err);
  }
}

export async function vendorStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await OrderService.vendorStats(req.userId!);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function confirm(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await OrderService.confirm(req.userId!, req.params.id as string);
    res.json({ order: serializeOrder(order, req.userId!) });
  } catch (err) {
    next(err);
  }
}

export async function dispute(req: Request, res: Response, next: NextFunction) {
  const parsed = disputeSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const order = await OrderService.openDispute(req.userId!, req.params.id as string, parsed.data.reason);
    res.json({ order: serializeOrder(order, req.userId!) });
  } catch (err) {
    next(err);
  }
}

export async function resolveDispute(req: Request, res: Response, next: NextFunction) {
  const parsed = resolveDisputeSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const order = await OrderService.resolveDispute(req.params.id as string, parsed.data.resolution);
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

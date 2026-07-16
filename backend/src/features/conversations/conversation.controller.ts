import type { Request, Response, NextFunction } from "express";
import { ConversationService } from "./conversation.service.js";
import { startConversationSchema, sendMessageSchema } from "./conversation.schema.js";
import { ValidationError } from "../../shared/errors/index.js";

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) result[key] = messages[0];
  }
  return result;
}

export async function start(req: Request, res: Response, next: NextFunction) {
  const parsed = startConversationSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const conversation = await ConversationService.start(req.userId!, parsed.data.productId);
    res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    const conversations = await ConversationService.listMine(req.userId!);
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
}

export async function listMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const messages = await ConversationService.listMessages(req.userId!, req.params.id as string);
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) return next(new ValidationError(fieldErrors(parsed.error)));

  try {
    const message = await ConversationService.sendMessage(req.userId!, req.params.id as string, parsed.data);
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}

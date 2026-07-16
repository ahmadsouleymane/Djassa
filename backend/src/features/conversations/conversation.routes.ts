import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { start, listMine, listMessages, sendMessage } from "./conversation.controller.js";

export const conversationRouter = Router();

conversationRouter.use(requireAuth);
conversationRouter.post("/", start);
conversationRouter.get("/mine", listMine);
conversationRouter.get("/:id/messages", listMessages);
conversationRouter.post("/:id/messages", sendMessage);

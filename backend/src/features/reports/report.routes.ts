import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { create } from "./report.controller.js";

export const reportRouter = Router();

reportRouter.use(requireAuth);
reportRouter.post("/", create);

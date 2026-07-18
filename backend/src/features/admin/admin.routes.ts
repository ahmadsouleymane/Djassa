import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth/auth.middleware.js";
import {
  overview,
  disputes,
  reports,
  resolveReport,
  analyticsOverview,
  analyticsSeries,
  analyticsTopPages,
  analyticsExitPages,
  analyticsDevices,
  analyticsCountries,
  analyticsErrors,
  analyticsSessions,
  sendBroadcastEmail,
  emailHistory,
} from "./admin.controller.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/overview", overview);
adminRouter.get("/disputes", disputes);
adminRouter.get("/reports", reports);
adminRouter.post("/reports/:id/resolve", resolveReport);
adminRouter.get("/analytics/overview", analyticsOverview);
adminRouter.get("/analytics/series", analyticsSeries);
adminRouter.get("/analytics/pages", analyticsTopPages);
adminRouter.get("/analytics/exit-pages", analyticsExitPages);
adminRouter.get("/analytics/devices", analyticsDevices);
adminRouter.get("/analytics/countries", analyticsCountries);
adminRouter.get("/analytics/errors", analyticsErrors);
adminRouter.get("/analytics/sessions", analyticsSessions);
adminRouter.post("/emails/send", sendBroadcastEmail);
adminRouter.get("/emails/history", emailHistory);

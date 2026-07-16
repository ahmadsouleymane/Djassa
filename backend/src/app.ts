import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { config } from "./shared/config/index.js";
import { logger } from "./shared/logger/index.js";
import { requestId } from "./shared/middleware/requestId.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { authRouter } from "./features/auth/auth.routes.js";

export const app = express();

app.use(requestId);
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);

app.use(errorHandler);

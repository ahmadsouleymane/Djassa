import "dotenv/config";
import { createServer } from "node:http";
import { app } from "./app.js";
import { config } from "./shared/config/index.js";
import { logger } from "./shared/logger/index.js";
import { initRealtime } from "./services/realtime.js";

const httpServer = createServer(app);
initRealtime(httpServer);

httpServer.listen(config.port, () => {
  logger.info({ port: config.port }, "Serveur démarré");
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM reçu, arrêt en cours");
  httpServer.close(() => process.exit(0));
});

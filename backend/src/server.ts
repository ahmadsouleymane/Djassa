import "dotenv/config";
import { app } from "./app.js";
import { config } from "./shared/config/index.js";
import { logger } from "./shared/logger/index.js";

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, "Serveur démarré");
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM reçu, arrêt en cours");
  server.close(() => process.exit(0));
});

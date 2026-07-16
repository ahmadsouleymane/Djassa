import { OrderService } from "../features/orders/order.service.js";
import { logger } from "../shared/logger/index.js";

const SWEEP_INTERVAL_MS = 15 * 60 * 1000;

export function startOrderTimeoutJob() {
  const run = async () => {
    try {
      const result = await OrderService.sweepTimeouts();
      if (result.refunded > 0 || result.released > 0) {
        logger.info(result, "Balayage des délais de commande");
      }
    } catch (err) {
      logger.error({ err }, "Échec du balayage des délais de commande");
    }
  };
  const handle = setInterval(run, SWEEP_INTERVAL_MS);
  handle.unref();
  return handle;
}

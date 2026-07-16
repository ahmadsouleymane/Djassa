import { ReviewRepository } from "./review.repository.js";
import { OrderRepository } from "../orders/order.repository.js";
import { NotFoundError, UnauthorizedError, ValidationError, ConflictError } from "../../shared/errors/index.js";

type ReviewInput = { orderId: string; rating: number; comment: string };

const reviewRepo = new ReviewRepository();
const orderRepo = new OrderRepository();

export const ReviewService = {
  async create(buyerId: string, input: ReviewInput) {
    const order = await orderRepo.findById(input.orderId);
    if (!order) throw new NotFoundError("Commande");
    if (order.buyerId !== buyerId) throw new UnauthorizedError("Cette commande ne vous appartient pas");
    if (order.status !== "confirme") {
      throw new ValidationError({ orderId: "La commande doit être confirmée avant de laisser un avis" });
    }

    try {
      return await reviewRepo.create({
        orderId: order.id,
        buyerId,
        vendorId: order.vendorId,
        rating: input.rating,
        comment: input.comment,
      });
    } catch (err) {
      if (err instanceof Error && "code" in err && err.code === "P2002") {
        throw new ConflictError("Un avis existe déjà pour cette commande");
      }
      throw err;
    }
  },

  listByVendor(vendorId: string) {
    return reviewRepo.findByVendor(vendorId);
  },
};

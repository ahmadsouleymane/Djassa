import { ReviewRepository } from "./review.repository.js";
import { OrderRepository } from "../orders/order.repository.js";
import { UserRepository } from "../users/user.repository.js";
import { ProductRepository } from "../products/product.repository.js";
import { NotFoundError, UnauthorizedError, ValidationError, ConflictError } from "../../shared/errors/index.js";
import { sendEmail, nouvelAvisVendeurEmailHtml } from "../../shared/email/index.js";
import { config } from "../../shared/config/index.js";

type ReviewInput = { orderId: string; rating: number; comment: string };

const reviewRepo = new ReviewRepository();
const orderRepo = new OrderRepository();
const userRepo = new UserRepository();
const productRepo = new ProductRepository();

export const ReviewService = {
  async create(buyerId: string, input: ReviewInput) {
    const order = await orderRepo.findById(input.orderId);
    if (!order) throw new NotFoundError("Commande");
    if (order.buyerId !== buyerId) throw new UnauthorizedError("Cette commande ne vous appartient pas");
    if (order.status !== "confirme") {
      throw new ValidationError({ orderId: "La commande doit être confirmée avant de laisser un avis" });
    }

    try {
      const review = await reviewRepo.create({
        orderId: order.id,
        buyerId,
        vendorId: order.vendorId,
        rating: input.rating,
        comment: input.comment,
      });

      // Notifier le vendeur (fire-and-forget)
      const [vendor, product] = await Promise.all([
        userRepo.findById(order.vendorId),
        productRepo.findById(order.productId),
      ]);
      if (vendor && product) {
        sendEmail(
          vendor.email,
          `Nouvel avis (${input.rating}/5) sur ${product.title}`,
          nouvelAvisVendeurEmailHtml({
            vendorName: vendor.email.split("@")[0],
            productTitle: product.title,
            productPhotoUrl: product.photos?.[0] ?? null,
            rating: input.rating,
            comment: input.comment,
            productUrl: `${config.frontendUrl}/article/${product.id}`,
          }),
        );
      }

      return review;
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

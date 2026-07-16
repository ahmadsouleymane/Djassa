import { prisma } from "../../shared/db/client.js";
import type { Review } from "@prisma/client";

export class ReviewRepository {
  create(data: { orderId: string; buyerId: string; vendorId: string; rating: number; comment: string }): Promise<Review> {
    return prisma.review.create({ data });
  }

  findByVendor(vendorId: string): Promise<Review[]> {
    return prisma.review.findMany({ where: { vendorId }, orderBy: { createdAt: "desc" } });
  }
}

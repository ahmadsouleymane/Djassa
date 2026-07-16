import { prisma } from "../../shared/db/client.js";
import type { Product, ProductCategory, Prisma } from "@prisma/client";

type CreateInput = {
  vendorId: string;
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  photos: string[];
};

type UpdateInput = Partial<Omit<CreateInput, "vendorId">>;

export class ProductRepository {
  create(data: CreateInput): Promise<Product> {
    return prisma.product.create({ data });
  }

  findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id } });
  }

  findByVendor(vendorId: string): Promise<Product[]> {
    return prisma.product.findMany({ where: { vendorId }, orderBy: { createdAt: "desc" } });
  }

  findPublic(options: { category?: ProductCategory; cursor?: string; limit: number }): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {
      vendor: { sellerVerificationStatus: "approuvee" },
      ...(options.category ? { category: options.category } : {}),
    };
    return prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options.limit,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    });
  }

  update(id: string, data: UpdateInput): Promise<Product> {
    return prisma.product.update({ where: { id }, data });
  }

  delete(id: string): Promise<Product> {
    return prisma.product.delete({ where: { id } });
  }
}

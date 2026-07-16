import { ProductRepository } from "./product.repository.js";
import { NotFoundError, UnauthorizedError } from "../../shared/errors/index.js";
import type { CreateProductInput, UpdateProductInput } from "./product.schema.js";

const productRepo = new ProductRepository();

export const ProductService = {
  create(vendorId: string, input: CreateProductInput) {
    return productRepo.create({ vendorId, ...input });
  },

  listMine(vendorId: string) {
    return productRepo.findByVendor(vendorId);
  },

  async update(vendorId: string, productId: string, input: UpdateProductInput) {
    const existing = await productRepo.findById(productId);
    if (!existing) throw new NotFoundError("Produit");
    if (existing.vendorId !== vendorId) throw new UnauthorizedError("Ce produit ne vous appartient pas");
    return productRepo.update(productId, input);
  },

  async remove(vendorId: string, productId: string) {
    const existing = await productRepo.findById(productId);
    if (!existing) throw new NotFoundError("Produit");
    if (existing.vendorId !== vendorId) throw new UnauthorizedError("Ce produit ne vous appartient pas");
    await productRepo.delete(productId);
  },
};

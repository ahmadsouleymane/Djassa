import { Router } from "express";
import { UserRepository } from "./user.repository.js";
import { ProductRepository } from "../products/product.repository.js";

const userRepo = new UserRepository();
const productRepo = new ProductRepository();

export const publicVendorRouter = Router({ mergeParams: true });

publicVendorRouter.get("/", async (req, res, next) => {
  try {
    const vendorId = (req.params as Record<string, string>).vendorId;
    const vendor = await userRepo.findPublicVendor(vendorId);
    if (!vendor) {
      res.status(404).json({ error: "Vendeur introuvable" });
      return;
    }
    const products = await productRepo.findPublic({ vendorId, limit: 50 });
    res.json({ vendor, productCount: products.length });
  } catch (err) {
    next(err);
  }
});

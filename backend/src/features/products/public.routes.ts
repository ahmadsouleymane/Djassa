import { Router } from "express";
import type { ProductCategory } from "@prisma/client";
import { ProductRepository } from "./product.repository.js";

const CATEGORIES: readonly ProductCategory[] = [
  "mode_beaute",
  "electronique",
  "maison",
  "telephones",
  "alimentation",
  "autre",
];

function parseCategory(value: unknown): ProductCategory | undefined {
  return typeof value === "string" && CATEGORIES.includes(value as ProductCategory)
    ? (value as ProductCategory)
    : undefined;
}

const productRepo = new ProductRepository();
export const publicProductRouter = Router();

publicProductRouter.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const category = parseCategory(req.query.category);
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
    const search = typeof req.query.search === "string" && req.query.search.trim() ? req.query.search.trim() : undefined;
    const vendorId = typeof req.query.vendorId === "string" ? req.query.vendorId : undefined;

    const products = await productRepo.findPublic({ category, cursor, limit, search, vendorId });
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

publicProductRouter.get("/:id", async (req, res, next) => {
  try {
    const product = await productRepo.findPublicById(req.params.id);
    if (!product) {
      res.status(404).json({ error: "Produit introuvable" });
      return;
    }
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

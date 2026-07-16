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

    const products = await productRepo.findPublic({ category, cursor, limit });
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

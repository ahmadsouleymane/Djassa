import { Router } from "express";
import { requireAuth, requireVendor, requireVerified } from "../auth/auth.middleware.js";
import { create, listMine, update, remove } from "./product.controller.js";

export const productRouter = Router();

productRouter.use(requireAuth, requireVendor);
productRouter.get("/mine", listMine);
productRouter.post("/", requireVerified, create);
productRouter.patch("/:id", requireVerified, update);
productRouter.delete("/:id", requireVerified, remove);

import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { create, listMine, update, remove } from "./product.controller.js";

export const productRouter = Router();

productRouter.use(requireAuth);
productRouter.post("/", create);
productRouter.get("/mine", listMine);
productRouter.patch("/:id", update);
productRouter.delete("/:id", remove);

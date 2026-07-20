import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireVendor } from "../auth/auth.middleware.js";
import { UserRepository } from "./user.repository.js";
import { NotFoundError, AppError } from "../../shared/errors/index.js";

const userRepo = new UserRepository();

const updateBoutiqueSchema = z.object({
  storeName: z.string().min(1, "Le nom de la boutique est requis").max(100, "100 caractères max").optional(),
  storeDescription: z.string().max(2000, "2000 caractères max").optional(),
  storeLogoUrl: z.string().url("URL invalide").optional().nullable(),
  storeBannerUrl: z.string().url("URL invalide").optional().nullable(),
});

export const boutiqueRouter = Router();

/** Récupère les informations de boutique du vendeur connecté */
boutiqueRouter.get("/", requireAuth, requireVendor, async (req, res, next) => {
  try {
    const user = await userRepo.findById(req.userId!);
    if (!user) throw new NotFoundError("Utilisateur");

    // Seuls les vendeurs Pro peuvent avoir une boutique personnalisée
    res.json({
      boutique: {
        storeName: user.storeName,
        storeDescription: user.storeDescription,
        storeLogoUrl: user.storeLogoUrl,
        storeBannerUrl: user.storeBannerUrl,
        canCustomize: user.planTier === "pro",
      },
    });
  } catch (err) {
    next(err);
  }
});

/** Met à jour les informations de boutique (réservé aux vendeurs Pro) */
boutiqueRouter.put("/", requireAuth, requireVendor, async (req, res, next) => {
  try {
    const user = await userRepo.findById(req.userId!);
    if (!user) throw new NotFoundError("Utilisateur");
    if (user.planTier !== "pro") {
      throw new AppError("La boutique personnalisable est réservée aux vendeurs Pro", "FORBIDDEN", 403);
    }

    const parsed = updateBoutiqueSchema.parse(req.body);

    // On ne met à jour que les champs fournis
    const updateData: Record<string, unknown> = {};
    if (parsed.storeName !== undefined) updateData.storeName = parsed.storeName;
    if (parsed.storeDescription !== undefined) updateData.storeDescription = parsed.storeDescription;
    if (parsed.storeLogoUrl !== undefined) updateData.storeLogoUrl = parsed.storeLogoUrl;
    if (parsed.storeBannerUrl !== undefined) updateData.storeBannerUrl = parsed.storeBannerUrl;

    const updated = await userRepo.update(req.userId!, updateData);
    res.json({
      boutique: {
        storeName: updated.storeName,
        storeDescription: updated.storeDescription,
        storeLogoUrl: updated.storeLogoUrl,
        storeBannerUrl: updated.storeBannerUrl,
        canCustomize: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

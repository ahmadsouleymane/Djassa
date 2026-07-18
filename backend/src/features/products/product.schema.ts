import { z } from "zod";

const CATEGORIES = ["mode_beaute", "electronique", "maison", "telephones", "alimentation", "autre"] as const;

export const createProductSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  deliveryInfo: z.string().max(1000).optional(),
  price: z.number().int().positive(),
  shippingFee: z.number().int().min(0).max(10_000_000).default(0),
  discountPercent: z.number().int().min(1).max(90).nullable().optional(),
  category: z.enum(CATEGORIES),
  photos: z.array(z.string().url()).min(3, "Ajoute au moins 3 photos").max(8),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

import { z } from "zod";

const CATEGORIES = ["mode_beaute", "electronique", "maison", "telephones", "alimentation", "autre"] as const;

export const createProductSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  price: z.number().int().positive(),
  category: z.enum(CATEGORIES),
  photos: z.array(z.string().url()).min(1).max(5),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

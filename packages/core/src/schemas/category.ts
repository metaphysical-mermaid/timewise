import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(64),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #2563eb"),
  sortOrder: z.number().int().min(0).optional(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const categorySchema = categoryInputSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  isDefault: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
});

export type Category = z.infer<typeof categorySchema>;

export const DEFAULT_CATEGORIES = [
  { name: "Work", color: "#2563eb", sortOrder: 0 },
  { name: "Personal", color: "#7c3aed", sortOrder: 1 },
  { name: "Health", color: "#059669", sortOrder: 2 },
  { name: "Sleep", color: "#6366f1", sortOrder: 3 },
  { name: "Learning", color: "#d97706", sortOrder: 4 },
  { name: "Social", color: "#db2777", sortOrder: 5 },
  { name: "Other", color: "#78716c", sortOrder: 6 },
] as const;

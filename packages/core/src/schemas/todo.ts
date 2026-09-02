import { z } from "zod";

export const todoSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1),
  done: z.boolean(),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const todoInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const todoUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  done: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type Todo = z.infer<typeof todoSchema>;
export type TodoInput = z.infer<typeof todoInputSchema>;
export type TodoUpdate = z.infer<typeof todoUpdateSchema>;

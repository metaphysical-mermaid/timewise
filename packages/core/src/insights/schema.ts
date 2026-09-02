import { z } from "zod";

export const insightSuggestionSchema = z.object({
  title: z.string(),
  detail: z.string(),
  tag: z.enum(["efficiency", "balance", "habit"]),
});

export const insightContentSchema = z.object({
  weekdayPatterns: z.array(z.string()),
  weekendPatterns: z.array(z.string()),
  comparisons: z.array(z.string()),
  suggestions: z.array(insightSuggestionSchema),
});

export const insightMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const insightAskInputSchema = z.object({
  insightId: z.string().uuid(),
  question: z.string().trim().min(1).max(2000),
});

export const insightGenerateInputSchema = z.object({
  question: z.string().trim().max(2000).optional(),
});

export type InsightContent = z.infer<typeof insightContentSchema>;
export type InsightSuggestion = z.infer<typeof insightSuggestionSchema>;
export type InsightMessage = z.infer<typeof insightMessageSchema>;

export const insightTypeSchema = z.enum(["weekday_weekend"]);
export type InsightType = z.infer<typeof insightTypeSchema>;

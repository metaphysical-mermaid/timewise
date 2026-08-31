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

export type InsightContent = z.infer<typeof insightContentSchema>;
export type InsightSuggestion = z.infer<typeof insightSuggestionSchema>;

export const insightTypeSchema = z.enum(["weekday_weekend"]);
export type InsightType = z.infer<typeof insightTypeSchema>;

import OpenAI from "openai";
import {
  aggregateWeekdayWeekend,
  insightContentSchema,
  type EntryForAggregation,
  type InsightContent,
  type WeekdayWeekendSummary,
} from "@timewise/core";

const DEFAULT_MODEL = "gpt-4o-mini";

export async function generateWeekdayWeekendInsight(
  entries: EntryForAggregation[],
  timezone: string,
  periodStart: string,
  periodEnd: string,
): Promise<{ summary: WeekdayWeekendSummary; content: InsightContent }> {
  const summary = aggregateWeekdayWeekend(entries, timezone, periodStart, periodEnd);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_INSIGHTS_MODEL ?? DEFAULT_MODEL;

  const response = await client.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You analyze personal time-tracking data. Respond with JSON matching: " +
          "{ weekdayPatterns: string[], weekendPatterns: string[], comparisons: string[], " +
          "suggestions: { title: string, detail: string, tag: 'efficiency'|'balance'|'habit' }[] }. " +
          "Be specific, practical, and encouraging. Reference category names from the data.",
      },
      {
        role: "user",
        content: JSON.stringify({
          timezone,
          aggregated: summary,
          instruction:
            "Summarize weekday vs weekend patterns and suggest 3-5 concrete improvements for time allocation and efficiency.",
        }),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("OpenAI returned an empty insights response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI returned invalid JSON for insights");
  }

  const content = insightContentSchema.parse(parsed);
  return { summary, content };
}

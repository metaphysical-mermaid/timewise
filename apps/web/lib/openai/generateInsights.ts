import OpenAI from "openai";
import {
  aggregateWeekdayWeekend,
  insightContentSchema,
  type EntryForAggregation,
  type InsightContent,
  type InsightMessage,
  type WeekdayWeekendSummary,
} from "@timewise/core";

const DEFAULT_MODEL = "gpt-4o-mini";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return {
    client: new OpenAI({ apiKey }),
    model: process.env.OPENAI_INSIGHTS_MODEL ?? DEFAULT_MODEL,
  };
}

export async function generateWeekdayWeekendInsight(
  entries: EntryForAggregation[],
  timezone: string,
  periodStart: string,
  periodEnd: string,
  question?: string,
): Promise<{ summary: WeekdayWeekendSummary; content: InsightContent }> {
  const summary = aggregateWeekdayWeekend(entries, timezone, periodStart, periodEnd);
  const { client, model } = getClient();

  const focusedQuestion = question?.trim();
  const instruction = focusedQuestion
    ? `Summarize weekday vs weekend patterns and suggest 3-5 concrete improvements. Also specifically answer this question using the time data: ${focusedQuestion}`
    : "Summarize weekday vs weekend patterns and suggest 3-5 concrete improvements for time allocation and efficiency.";

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
          "Be specific, practical, and encouraging. Reference category names from the data. " +
          "If the user asked a question, weave a clear answer into comparisons and suggestions.",
      },
      {
        role: "user",
        content: JSON.stringify({
          timezone,
          aggregated: summary,
          question: focusedQuestion || null,
          instruction,
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

export async function answerInsightFollowUp(params: {
  summary: WeekdayWeekendSummary;
  content: InsightContent;
  timezone: string;
  question: string;
  priorQuestion?: string | null;
  conversation: InsightMessage[];
}): Promise<string> {
  const { client, model } = getClient();
  const history = params.conversation.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const response = await client.chat.completions.create({
    model,
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful time-tracking coach. Answer follow-up questions using the user's " +
          "weekday/weekend summary and prior insights. Be concise, specific, and practical. " +
          "If the data cannot answer the question, say what is missing.",
      },
      {
        role: "user",
        content: JSON.stringify({
          timezone: params.timezone,
          priorQuestion: params.priorQuestion ?? null,
          summary: params.summary,
          insight: params.content,
        }),
      },
      ...history,
      { role: "user" as const, content: params.question },
    ],
  });

  const answer = response.choices[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error("OpenAI returned an empty follow-up answer");
  }
  return answer;
}

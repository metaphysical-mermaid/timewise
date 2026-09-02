import { NextResponse } from "next/server";
import {
  insightAskInputSchema,
  insightContentSchema,
  insightMessageSchema,
  type InsightMessage,
  type WeekdayWeekendSummary,
} from "@timewise/core";
import { getAuthedRequest } from "@/lib/auth/getAuthedRequest";
import { loadProfileTimezone } from "@/lib/db/types";
import { answerInsightFollowUp } from "@/lib/openai/generateInsights";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

type StoredContent = {
  summary: WeekdayWeekendSummary;
  insight: unknown;
  question?: string | null;
  conversation?: InsightMessage[];
};

export async function POST(request: Request) {
  const authed = await getAuthedRequest(request);
  if (!authed) {
    return jsonError("Unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = insightAskInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid request", 400);
  }

  const { insightId, question } = parsed.data;

  const { data: row, error: fetchError } = await authed.supabase
    .from("ai_insights")
    .select("*")
    .eq("id", insightId)
    .eq("user_id", authed.user.id)
    .maybeSingle();

  if (fetchError) {
    return jsonError(fetchError.message, 500);
  }
  if (!row) {
    return jsonError("Insight not found", 404);
  }

  const stored = row.content as StoredContent;
  const content = insightContentSchema.parse(stored.insight);
  const conversation = (stored.conversation ?? [])
    .map((message) => insightMessageSchema.safeParse(message))
    .filter((result): result is { success: true; data: InsightMessage } => result.success)
    .map((result) => result.data);

  const timezone = await loadProfileTimezone(authed.supabase, authed.user.id);

  try {
    const answer = await answerInsightFollowUp({
      summary: stored.summary,
      content,
      timezone,
      question,
      priorQuestion: stored.question,
      conversation,
    });

    const nextConversation: InsightMessage[] = [
      ...conversation,
      { role: "user", content: question },
      { role: "assistant", content: answer },
    ];

    const { error: updateError } = await authed.supabase
      .from("ai_insights")
      .update({
        content: {
          ...stored,
          insight: content,
          conversation: nextConversation,
        },
      })
      .eq("id", insightId)
      .eq("user_id", authed.user.id);

    if (updateError) {
      return jsonError(updateError.message, 500);
    }

    return NextResponse.json({
      answer,
      conversation: nextConversation,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to answer follow-up";
    return jsonError(message, 500);
  }
}

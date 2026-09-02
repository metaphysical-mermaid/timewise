import { NextResponse } from "next/server";
import { addDaysLocalDate, insightGenerateInputSchema, todayLocalDate } from "@timewise/core";
import { getAuthedRequest } from "@/lib/auth/getAuthedRequest";
import { loadProfileTimezone } from "@/lib/db/types";
import { generateWeekdayWeekendInsight } from "@/lib/openai/generateInsights";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const authed = await getAuthedRequest(request);
  if (!authed) {
    return jsonError("Unauthorized", 401);
  }

  let question: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = insightGenerateInputSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid request", 400);
    }
    question = parsed.data.question?.trim() || undefined;
  } catch {
    question = undefined;
  }

  const timezone = await loadProfileTimezone(authed.supabase, authed.user.id);
  const periodEnd = todayLocalDate(timezone);
  const periodStart = addDaysLocalDate(periodEnd, -29);

  const startIso = new Date(`${periodStart}T00:00:00`).toISOString();
  const endIso = new Date(`${periodEnd}T23:59:59.999`).toISOString();

  const { data: rows, error: fetchError } = await authed.supabase
    .from("time_entries")
    .select("started_at, ended_at, categories(name)")
    .eq("user_id", authed.user.id)
    .gte("started_at", startIso)
    .lte("started_at", endIso);

  if (fetchError) {
    return jsonError(fetchError.message, 500);
  }

  type Row = {
    started_at: string;
    ended_at: string;
    categories: { name: string } | { name: string }[] | null;
  };

  const entries = ((rows as Row[]) ?? []).map((row) => {
    const cat = row.categories;
    const categoryName = Array.isArray(cat) ? cat[0]?.name : cat?.name;
    return {
      categoryName: categoryName ?? "Other",
      startedAt: row.started_at,
      endedAt: row.ended_at,
    };
  });

  if (entries.length === 0) {
    return jsonError("Log some time entries before generating insights", 400);
  }

  try {
    const { summary, content } = await generateWeekdayWeekendInsight(
      entries,
      timezone,
      periodStart,
      periodEnd,
      question,
    );

    const storedContent = {
      summary,
      insight: content,
      question: question ?? null,
      conversation: [] as Array<{ role: "user" | "assistant"; content: string }>,
    };

    const { data: inserted, error: insertError } = await authed.supabase
      .from("ai_insights")
      .insert({
        user_id: authed.user.id,
        period_start: periodStart,
        period_end: periodEnd,
        insight_type: "weekday_weekend",
        content: storedContent,
      })
      .select("*")
      .single();

    if (insertError) {
      return jsonError(insertError.message, 500);
    }

    return NextResponse.json({
      id: inserted.id,
      periodStart: inserted.period_start,
      periodEnd: inserted.period_end,
      summary,
      content,
      question: question ?? null,
      conversation: [],
      createdAt: inserted.created_at,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate insights";
    return jsonError(message, 500);
  }
}

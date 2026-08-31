import { NextResponse } from "next/server";
import { getAuthedRequest } from "@/lib/auth/getAuthedRequest";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const authed = await getAuthedRequest(request);
  if (!authed) {
    return jsonError("Unauthorized", 401);
  }

  const { data, error } = await authed.supabase
    .from("ai_insights")
    .select("*")
    .eq("user_id", authed.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("No insights yet", 404);
  }

  return NextResponse.json({
    id: data.id,
    periodStart: data.period_start,
    periodEnd: data.period_end,
    summary: data.content.summary,
    content: data.content.insight,
    createdAt: data.created_at,
  });
}

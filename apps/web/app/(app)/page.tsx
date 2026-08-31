import { todayLocalDate } from "@timewise/core";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listCategories, loadProfileTimezone } from "@/lib/db/types";
import { TodayClient } from "./TodayClient";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    const timezone = await loadProfileTimezone(supabase, user.id);
    const categories = await listCategories(supabase, user.id);
    const initialDate = todayLocalDate(timezone);

    return (
      <main className="app-screen">
        <header className="mb-4">
          <h1 className="app-title">Today</h1>
          <p className="app-subtitle">Log how you spend your time.</p>
        </header>
        <TodayClient timezone={timezone} categories={categories} initialDate={initialDate} />
      </main>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load your data";
    return (
      <main className="app-screen">
        <h1 className="app-title">Today</h1>
        <p className="app-error-box mt-4">{message}</p>
        <p className="app-hint mt-2">
          If this keeps happening, confirm the Supabase SQL migration was applied and try signing
          out and back in.
        </p>
      </main>
    );
  }
}

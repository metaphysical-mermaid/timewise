import { createClient } from "@/lib/supabase/server";
import { loadProfileTimezone } from "@/lib/db/types";
import { WeekClient } from "./WeekClient";

export default async function WeekPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const timezone = await loadProfileTimezone(supabase, user.id);

  return (
    <main className="app-screen">
      <header className="mb-4">
        <h1 className="app-title">Week</h1>
        <p className="app-subtitle">Your last seven days at a glance.</p>
      </header>
      <WeekClient timezone={timezone} />
    </main>
  );
}

import { TodosClient } from "./TodosClient";
import { redirect } from "next/navigation";
import { todayLocalDate } from "@timewise/core";
import { createClient } from "@/lib/supabase/server";
import { loadProfileTimezone } from "@/lib/db/types";

export default async function TodosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const timezone = await loadProfileTimezone(supabase, user.id);
  const initialDate = todayLocalDate(timezone);

  return (
    <main className="app-screen">
      <header className="mb-4">
        <h1 className="app-title">Todos</h1>
        <p className="app-subtitle">Plan the day. Undone items carry over automatically.</p>
      </header>
      <TodosClient timezone={timezone} initialDate={initialDate} />
    </main>
  );
}

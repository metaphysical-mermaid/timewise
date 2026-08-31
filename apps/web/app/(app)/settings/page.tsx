import { createClient } from "@/lib/supabase/server";
import { listCategories, loadProfileTimezone } from "@/lib/db/types";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const timezone = await loadProfileTimezone(supabase, user.id);
  const categories = await listCategories(supabase, user.id);

  return (
    <main className="app-screen">
      <header className="mb-4">
        <h1 className="app-title">Settings</h1>
        <p className="app-subtitle">Timezone, categories, and account.</p>
      </header>
      <SettingsClient initialTimezone={timezone} categories={categories} />
    </main>
  );
}

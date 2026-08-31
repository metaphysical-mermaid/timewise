import { InsightsClient } from "./InsightsClient";

export default function InsightsPage() {
  return (
    <main className="app-screen">
      <header className="mb-4">
        <h1 className="app-title">Insights</h1>
        <p className="app-subtitle">AI summaries of weekday and weekend patterns.</p>
      </header>
      <InsightsClient />
    </main>
  );
}

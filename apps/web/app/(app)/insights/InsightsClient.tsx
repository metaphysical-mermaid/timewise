"use client";

import type { InsightContent } from "@timewise/core";
import { useCallback, useEffect, useState } from "react";

type InsightResponse = {
  id: string;
  periodStart: string;
  periodEnd: string;
  summary: {
    weekday: Record<string, number>;
    weekend: Record<string, number>;
    totals: {
      entries: number;
      weekdayHours: number;
      weekendHours: number;
      avgDailyHours: number;
    };
  };
  content: InsightContent;
  createdAt: string;
};

function CategoryBars({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const max = Math.max(...Object.values(data), 1);
  return (
    <div className="app-card">
      <h3 className="app-section-title mb-2">{title}</h3>
      {Object.keys(data).length === 0 ? (
        <p className="app-hint">No data</p>
      ) : (
        <div className="flex flex-col gap-2">
          {Object.entries(data).map(([name, hours]) => (
            <div key={name}>
              <div className="flex justify-between text-sm">
                <span>{name}</span>
                <span>{hours}h</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-[var(--line)]">
                <div
                  className="h-2 rounded-full bg-[var(--accent)]"
                  style={{ width: `${(hours / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function InsightsClient() {
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLatest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/insights");
      if (res.status === 404) {
        setInsight(null);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to load insights");
      }
      setInsight((await res.json()) as InsightResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLatest();
  }, [loadLatest]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/insights/generate", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to generate insights");
      }
      setInsight((await res.json()) as InsightResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        className="app-btn-primary"
        disabled={generating}
        onClick={() => void handleGenerate()}
      >
        {generating ? "Analyzing…" : insight ? "Regenerate insights" : "Generate insights"}
      </button>

      {error ? <p className="app-error-box">{error}</p> : null}

      {loading ? (
        <p className="app-hint">Loading…</p>
      ) : !insight ? (
        <p className="app-hint">
          Log a few days of time entries, then generate AI-powered weekday vs weekend patterns.
        </p>
      ) : (
        <>
          <p className="app-hint">
            Period {insight.periodStart} → {insight.periodEnd} ·{" "}
            {insight.summary.totals.entries} entries · avg{" "}
            {insight.summary.totals.avgDailyHours}h/day
          </p>

          <CategoryBars title="Weekdays (Mon–Fri)" data={insight.summary.weekday} />
          <CategoryBars title="Weekends (Sat–Sun)" data={insight.summary.weekend} />

          {insight.content.weekdayPatterns.length > 0 ? (
            <div className="app-card">
              <h3 className="app-section-title mb-2">Weekday patterns</h3>
              <ul className="list-disc pl-5 text-sm text-[var(--muted)]">
                {insight.content.weekdayPatterns.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {insight.content.weekendPatterns.length > 0 ? (
            <div className="app-card">
              <h3 className="app-section-title mb-2">Weekend patterns</h3>
              <ul className="list-disc pl-5 text-sm text-[var(--muted)]">
                {insight.content.weekendPatterns.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {insight.content.comparisons.length > 0 ? (
            <div className="app-card">
              <h3 className="app-section-title mb-2">Comparisons</h3>
              <ul className="list-disc pl-5 text-sm text-[var(--muted)]">
                {insight.content.comparisons.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {insight.content.suggestions.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className="app-section-title">Suggestions</h3>
              {insight.content.suggestions.map((suggestion) => (
                <div key={suggestion.title} className="app-card">
                  <p className="font-semibold">{suggestion.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{suggestion.detail}</p>
                  <span className="mt-2 inline-block rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs">
                    {suggestion.tag}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

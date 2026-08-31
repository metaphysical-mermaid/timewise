import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useAuth } from "../../lib/auth";
import { apiFetch, ApiError } from "../../lib/api";
import { colors, styles } from "../../lib/theme";

type InsightResponse = {
  periodStart: string;
  periodEnd: string;
  summary: {
    weekday: Record<string, number>;
    weekend: Record<string, number>;
    totals: { entries: number; avgDailyHours: number };
  };
  content: {
    weekdayPatterns: string[];
    weekendPatterns: string[];
    comparisons: string[];
    suggestions: Array<{ title: string; detail: string; tag: string }>;
  };
};

export default function InsightsTab() {
  const { accessToken } = useAuth();
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<InsightResponse>("/api/v1/insights", {
        accessToken,
      });
      setInsight(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setInsight(null);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate() {
    if (!accessToken) return;
    setGenerating(true);
    setError(null);
    try {
      const data = await apiFetch<InsightResponse>("/api/v1/insights/generate", {
        method: "POST",
        accessToken,
      });
      setInsight(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.primaryBtn} onPress={() => void generate()} disabled={generating}>
        <Text style={styles.primaryBtnText}>
          {generating ? "Analyzing…" : insight ? "Regenerate" : "Generate insights"}
        </Text>
      </Pressable>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 16 }} />
      ) : !insight ? (
        <Text style={[styles.hint, { marginTop: 16 }]}>
          Log entries on web or mobile, then generate AI weekday/weekend patterns.
        </Text>
      ) : (
        <View style={{ marginTop: 16, gap: 10 }}>
          <Text style={styles.hint}>
            {insight.periodStart} → {insight.periodEnd} · {insight.summary.totals.entries} entries
          </Text>

          <View style={styles.card}>
            <Text style={{ fontWeight: "600" }}>Weekday hours by category</Text>
            {Object.entries(insight.summary.weekday).map(([name, hours]) => (
              <Text key={name} style={styles.hint}>{name}: {hours}h</Text>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={{ fontWeight: "600" }}>Weekend hours by category</Text>
            {Object.entries(insight.summary.weekend).map(([name, hours]) => (
              <Text key={name} style={styles.hint}>{name}: {hours}h</Text>
            ))}
          </View>

          {insight.content.suggestions.map((s) => (
            <View key={s.title} style={styles.card}>
              <Text style={{ fontWeight: "600" }}>{s.title}</Text>
              <Text style={styles.hint}>{s.detail}</Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: colors.accent }}>{s.tag}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

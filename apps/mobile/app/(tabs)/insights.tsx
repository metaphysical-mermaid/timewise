import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../lib/auth";
import { apiFetch, ApiError } from "../../lib/api";
import { colors, styles } from "../../lib/theme";

type InsightMessage = { role: "user" | "assistant"; content: string };

type InsightResponse = {
  id: string;
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
  question: string | null;
  conversation: InsightMessage[];
};

export default function InsightsTab() {
  const { accessToken } = useAuth();
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [followUp, setFollowUp] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<InsightResponse>("/api/v1/insights", {
        accessToken,
      });
      setInsight({
        ...data,
        question: data.question ?? null,
        conversation: data.conversation ?? [],
      });
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
      const trimmed = question.trim();
      const data = await apiFetch<InsightResponse>("/api/v1/insights/generate", {
        method: "POST",
        accessToken,
        body: trimmed ? { question: trimmed } : {},
      });
      setInsight({
        ...data,
        question: data.question ?? null,
        conversation: data.conversation ?? [],
      });
      setFollowUp("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  async function askFollowUp() {
    if (!accessToken || !insight) return;
    const trimmed = followUp.trim();
    if (!trimmed) return;

    setAsking(true);
    setError(null);
    try {
      const data = await apiFetch<{ conversation: InsightMessage[] }>("/api/v1/insights/ask", {
        method: "POST",
        accessToken,
        body: { insightId: insight.id, question: trimmed },
      });
      setInsight({ ...insight, conversation: data.conversation });
      setFollowUp("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ask follow-up");
    } finally {
      setAsking(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Optional question to focus the analysis</Text>
      <TextInput
        value={question}
        onChangeText={setQuestion}
        placeholder="e.g. Where did my evenings go?"
        multiline
        style={[styles.input, { minHeight: 72, textAlignVertical: "top" }]}
      />

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

          {insight.question ? (
            <View style={styles.card}>
              <Text style={{ fontWeight: "600" }}>Your question</Text>
              <Text style={styles.hint}>{insight.question}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={{ fontWeight: "600" }}>Weekday hours by category</Text>
            {Object.entries(insight.summary.weekday).map(([name, hours]) => (
              <Text key={name} style={styles.hint}>
                {name}: {hours}h
              </Text>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={{ fontWeight: "600" }}>Weekend hours by category</Text>
            {Object.entries(insight.summary.weekend).map(([name, hours]) => (
              <Text key={name} style={styles.hint}>
                {name}: {hours}h
              </Text>
            ))}
          </View>

          {insight.content.suggestions.map((s) => (
            <View key={s.title} style={styles.card}>
              <Text style={{ fontWeight: "600" }}>{s.title}</Text>
              <Text style={styles.hint}>{s.detail}</Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: colors.accent }}>{s.tag}</Text>
            </View>
          ))}

          <View style={styles.card}>
            <Text style={{ fontWeight: "600", marginBottom: 6 }}>Follow-up questions</Text>
            {insight.conversation.map((message, index) => (
              <View
                key={`${message.role}-${index}`}
                style={{
                  marginBottom: 8,
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: message.role === "user" ? colors.accentSoft : colors.bg,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, marginBottom: 4 }}>
                  {message.role === "user" ? "You" : "Coach"}
                </Text>
                <Text style={styles.hint}>{message.content}</Text>
              </View>
            ))}
            <TextInput
              value={followUp}
              onChangeText={setFollowUp}
              placeholder="Ask a follow-up…"
              multiline
              style={[styles.input, { minHeight: 56, textAlignVertical: "top" }]}
            />
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => void askFollowUp()}
              disabled={asking || !followUp.trim()}
            >
              <Text style={styles.secondaryBtnText}>
                {asking ? "Thinking…" : "Ask follow-up"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

import { durationMinutes, formatDuration, todayLocalDate } from "@timewise/core";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../lib/auth";
import { getSupabaseClient } from "../../lib/supabase";
import { colors, styles } from "../../lib/theme";

type CategoryRow = { id: string; name: string; color: string };
type EntryRow = {
  id: string;
  title: string;
  started_at: string;
  ended_at: string;
  categories: { name: string; color: string } | null;
};

export default function TodayTab() {
  const { user } = useAuth();
  const [timezone, setTimezone] = useState("UTC");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date(Date.now() + 3600000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const localDate = todayLocalDate(timezone);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const supabase = getSupabaseClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("user_id", user.id)
      .single();
    const tz = profile?.timezone ?? "UTC";
    setTimezone(tz);

    const { data: cats } = await supabase
      .from("categories")
      .select("id, name, color")
      .order("sort_order", { ascending: true });
    setCategories((cats as CategoryRow[]) ?? []);
    if (cats?.[0]) setCategoryId(cats[0].id);

    const day = todayLocalDate(tz);
    const dayStart = new Date(`${day}T00:00:00`);
    const dayEnd = new Date(`${day}T23:59:59.999`);

    const { data, error: fetchError } = await supabase
      .from("time_entries")
      .select("id, title, started_at, ended_at, categories(name, color)")
      .gte("started_at", dayStart.toISOString())
      .lte("started_at", dayEnd.toISOString())
      .order("started_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setEntries([]);
    } else {
      setEntries((data as EntryRow[]) ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveEntry() {
    if (!user || !title.trim() || !categoryId) return;
    setError(null);
    const supabase = getSupabaseClient();
    const { error: insertError } = await supabase.from("time_entries").insert({
      user_id: user.id,
      category_id: categoryId,
      title: title.trim(),
      started_at: start.toISOString(),
      ended_at: end.toISOString(),
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setShowForm(false);
    setTitle("");
    await load();
  }

  const totalMins = entries.reduce(
    (sum, e) => sum + durationMinutes(e.started_at, e.ended_at),
    0,
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>{localDate}</Text>

      <View style={styles.card}>
        <Text style={styles.hint}>Logged today</Text>
        <Text style={{ fontSize: 24, fontWeight: "700", color: colors.ink }}>
          {formatDuration(totalMins)}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {!showForm ? (
        <Pressable style={styles.primaryBtn} onPress={() => setShowForm(true)}>
          <Text style={styles.primaryBtnText}>Add time entry</Text>
        </Pressable>
      ) : (
        <View style={styles.card}>
          <Text style={{ fontWeight: "600", marginBottom: 8 }}>New entry</Text>
          <TextInput
            placeholder="What did you do?"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          <Text style={{ marginTop: 8, fontSize: 14 }}>Category</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: categoryId === cat.id ? cat.color : colors.line,
                }}
              >
                <Text style={{ color: categoryId === cat.id ? "#fff" : colors.ink, fontSize: 13 }}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => setShowStartPicker(true)} style={{ marginTop: 12 }}>
            <Text style={styles.hint}>Start: {start.toLocaleString()}</Text>
          </Pressable>
          {showStartPicker ? (
            <DateTimePicker
              value={start}
              mode="datetime"
              onChange={(_e, date) => {
                setShowStartPicker(Platform.OS === "ios");
                if (date) setStart(date);
              }}
            />
          ) : null}

          <Pressable onPress={() => setShowEndPicker(true)} style={{ marginTop: 8 }}>
            <Text style={styles.hint}>End: {end.toLocaleString()}</Text>
          </Pressable>
          {showEndPicker ? (
            <DateTimePicker
              value={end}
              mode="datetime"
              onChange={(_e, date) => {
                setShowEndPicker(Platform.OS === "ios");
                if (date) setEnd(date);
              }}
            />
          ) : null}

          <Pressable style={styles.primaryBtn} onPress={() => void saveEntry()}>
            <Text style={styles.primaryBtnText}>Save</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => setShowForm(false)}>
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      <Text style={{ fontWeight: "600", marginTop: 16, marginBottom: 8 }}>Entries</Text>
      {loading ? (
        <ActivityIndicator color={colors.accent} />
      ) : entries.length === 0 ? (
        <Text style={styles.hint}>No entries yet.</Text>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.card}>
            <Text style={{ fontWeight: "600" }}>{entry.title}</Text>
            <Text style={styles.hint}>
              {formatDuration(durationMinutes(entry.started_at, entry.ended_at))}
            </Text>
            {entry.categories ? (
              <Text style={{ color: entry.categories.color, marginTop: 4 }}>
                {entry.categories.name}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

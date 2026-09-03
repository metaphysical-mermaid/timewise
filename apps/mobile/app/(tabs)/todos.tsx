import { addDaysLocalDate, resolveTimezone, todayLocalDate, todoInputSchema } from "@timewise/core";
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
import { getSupabaseClient } from "../../lib/supabase";
import { colors, styles } from "../../lib/theme";

type TodoRow = {
  id: string;
  title: string;
  done: boolean;
  local_date: string;
  sort_order: number;
};

export default function TodosTab() {
  const { user } = useAuth();
  const [timezone, setTimezone] = useState("UTC");
  const [localDate, setLocalDate] = useState(todayLocalDate("UTC"));
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const tz = resolveTimezone(profile?.timezone ?? "UTC");
    setTimezone(tz);

    const today = todayLocalDate(tz);
    const day = localDate || today;

    // Carry incomplete todos from earlier days onto today so they don't disappear overnight.
    if (day === today) {
      const { error: carryError } = await supabase
        .from("todos")
        .update({ local_date: today })
        .eq("done", false)
        .lt("local_date", today);
      if (carryError) {
        setError(carryError.message);
        setTodos([]);
        setLoading(false);
        return;
      }
    }

    const { data, error: fetchError } = await supabase
      .from("todos")
      .select("id, title, done, local_date, sort_order")
      .eq("local_date", day)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setTodos([]);
    } else {
      setTodos((data as TodoRow[]) ?? []);
    }
    setLoading(false);
  }, [user, localDate]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addTodo() {
    if (!user) return;
    const parsed = todoInputSchema.safeParse({ title, localDate });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid todo");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = getSupabaseClient();
    const maxOrder = todos.reduce((max, todo) => Math.max(max, todo.sort_order), -1);
    const { error: insertError } = await supabase.from("todos").insert({
      user_id: user.id,
      title: parsed.data.title,
      local_date: parsed.data.localDate,
      sort_order: maxOrder + 1,
      done: false,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setTitle("");
    await load();
  }

  async function toggleDone(todo: TodoRow) {
    const supabase = getSupabaseClient();
    const { error: updateError } = await supabase
      .from("todos")
      .update({ done: !todo.done })
      .eq("id", todo.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await load();
  }

  async function deleteTodo(id: string) {
    const supabase = getSupabaseClient();
    const { error: deleteError } = await supabase.from("todos").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await load();
  }

  const today = todayLocalDate(timezone);
  const remaining = todos.filter((todo) => !todo.done).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable
          style={[styles.secondaryBtn, { paddingHorizontal: 16, marginTop: 0 }]}
          onPress={() => setLocalDate(addDaysLocalDate(localDate, -1))}
        >
          <Text style={styles.secondaryBtnText}>←</Text>
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontWeight: "700", color: colors.ink }}>
            {localDate === today ? "Today" : localDate}
          </Text>
          <Text style={styles.hint}>
            {remaining} remaining · {todos.length} total
            {localDate === today ? " · undone items carry over" : ""}
          </Text>
        </View>
        <Pressable
          style={[styles.secondaryBtn, { paddingHorizontal: 16, marginTop: 0, opacity: localDate >= today ? 0.4 : 1 }]}
          onPress={() => setLocalDate(addDaysLocalDate(localDate, 1))}
          disabled={localDate >= today}
        >
          <Text style={styles.secondaryBtnText}>→</Text>
        </Pressable>
      </View>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="What needs doing?"
        style={styles.input}
      />
      <Pressable
        style={styles.primaryBtn}
        onPress={() => void addTodo()}
        disabled={saving || !title.trim()}
      >
        <Text style={styles.primaryBtnText}>{saving ? "Adding…" : "Add to list"}</Text>
      </Pressable>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 16 }} />
      ) : todos.length === 0 ? (
        <Text style={[styles.hint, { marginTop: 16 }]}>No todos for this day yet.</Text>
      ) : (
        <View style={{ marginTop: 16 }}>
          {todos.map((todo) => (
            <View key={todo.id} style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 10 }]}>
              <Pressable onPress={() => void toggleDone(todo)}>
                <Text style={{ fontSize: 18, color: colors.accent }}>{todo.done ? "☑" : "☐"}</Text>
              </Pressable>
              <Text
                style={{
                  flex: 1,
                  color: todo.done ? colors.muted : colors.ink,
                  textDecorationLine: todo.done ? "line-through" : "none",
                }}
              >
                {todo.title}
              </Text>
              <Pressable onPress={() => void deleteTodo(todo.id)}>
                <Text style={{ color: colors.danger, fontSize: 13 }}>Delete</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

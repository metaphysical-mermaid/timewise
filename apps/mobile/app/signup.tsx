import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../lib/auth";
import { styles } from "../lib/theme";

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    setError(null);
    setInfo(null);
    setPending(true);
    try {
      const result = await signUp(email, password);
      if (result.needsEmailConfirmation) {
        setInfo("Check your email to confirm, then sign in.");
        return;
      }
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Start tracking with Timewise.</Text>

        <Text style={{ marginTop: 16, fontSize: 14 }}>Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <Text style={{ marginTop: 12, fontSize: 14 }}>Password</Text>
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {info ? (
          <View style={[styles.errorBox, { backgroundColor: "#dbeafe" }]}>
            <Text style={{ color: "#0f172a" }}>{info}</Text>
          </View>
        ) : null}

        <Pressable style={styles.primaryBtn} onPress={() => void onSubmit()} disabled={pending}>
          <Text style={styles.primaryBtnText}>{pending ? "Please wait…" : "Create account"}</Text>
        </Pressable>

        <Link href="/login" asChild>
          <Pressable style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Back to sign in</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

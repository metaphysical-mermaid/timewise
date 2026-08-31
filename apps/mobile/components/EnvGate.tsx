import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { checkPublicEnv } from "../lib/envCheck";
import { colors, styles } from "../lib/theme";

export function EnvGate({ children }: { children: ReactNode }) {
  const check = checkPublicEnv();

  if (!check.ok) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { flexGrow: 1, justifyContent: "center" }]}
      >
        <Text style={styles.title}>Setup required</Text>
        <Text style={styles.subtitle}>
          Copy `apps/mobile/.env.example` to `apps/mobile/.env` and set your web API URL plus
          Supabase public keys.
        </Text>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Missing:</Text>
          {check.missing.map((name) => (
            <Text key={name} style={[styles.errorText, { marginTop: 4 }]}>• {name}</Text>
          ))}
        </View>
      </ScrollView>
    );
  }

  return <>{children}</>;
}

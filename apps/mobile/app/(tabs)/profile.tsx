import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useAuth } from "../../lib/auth";
import { styles } from "../../lib/theme";

export default function ProfileTab() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.hint}>Signed in as</Text>
        <Text style={{ fontWeight: "600", fontSize: 16 }}>{user?.email ?? "—"}</Text>
      </View>

      <Text style={styles.hint}>
        Manage timezone and categories on the web app for now. Mobile settings coming soon.
      </Text>

      <Pressable style={styles.secondaryBtn} onPress={() => void handleSignOut()}>
        <Text style={styles.secondaryBtnText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

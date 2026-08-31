import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Timewise",
  slug: "timewise",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  scheme: "timewise",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#f4f6f8",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.timewise.app",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#dbeafe",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: ["expo-router", "expo-secure-store", "@react-native-community/datetimepicker"],
  experiments: {
    autolinkingModuleResolution: true,
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default config;

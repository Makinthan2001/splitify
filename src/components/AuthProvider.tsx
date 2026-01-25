import { useRouter, useSegments } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { auth } from "../backend/config/firebase";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const isRootRoute =
      segments.length <= 1 &&
      segments[0] !== "(auth)" &&
      segments[0] !== "(tabs)";

    if (user && !user.emailVerified) {
      // User logged in but email not verified
      if (!inAuthGroup || segments[1] !== "verify-email") {
        router.replace("/(auth)/verify-email");
      }
    } else if (user && user.emailVerified) {
      // User logged in and verified - redirect from auth or root to tabs
      if (inAuthGroup || isRootRoute) {
        router.replace("/(tabs)");
      }
    } else {
      // No user - redirect from protected areas to welcome
      if (
        inTabsGroup ||
        segments[0] === "create-group" ||
        segments[0] === "group"
      ) {
        router.replace("/");
      }
    }
  }, [user, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4c63d2" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});

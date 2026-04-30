import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { styles } from "./styles";

export default function WelcomeScreen() {
  const router = useRouter();
  const [showAuthOptions, setShowAuthOptions] = useState(false);

  const handleGetStarted = () => {
    setShowAuthOptions(true);
  };

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  const handleSignUp = () => {
    router.push("/(auth)/signup");
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Golden Header Section */}
      <LinearGradient
        colors={["#B8860B", "#DAA520", "#FFD700"]}
        style={styles.header}
      >
        <View style={styles.imageContainer}>
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="diamond" size={48} color="#DAA520" />
            </View>
            <Text style={styles.appName}>SPLITIFY</Text>
            <Text style={styles.appTagline}>Premium Expense Sharing</Text>
          </View>
        </View>
      </LinearGradient>

      {/* White Content Sheet */}
      <View style={styles.contentSheet}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Split expenses without the hassle.</Text>
          <Text style={styles.subtitle}>
            Track shared bills, settle debts, and keep your friendships
            stress-free.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          {!showAuthOptions ? (
            <View style={{ width: "100%" }}>
              <TouchableOpacity
                style={styles.getStartedButton}
                onPress={handleGetStarted}
                activeOpacity={0.9}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.authContainer}>
              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSignUp}
                activeOpacity={0.9}
              >
                <Text style={styles.signupText}>Create Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                activeOpacity={0.9}
              >
                <Text style={styles.loginText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useApp } from "../../../store";
import { loginAction } from "../../../store/actions";
import { styles } from "./styles";

export default function LoginScreen() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  // Floating animation for the icon
  const floatValue = useSharedValue(0);

  useEffect(() => {
    floatValue.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 2500 }),
        withTiming(0, { duration: 2500 })
      ),
      -1, // Infinite
      true
    );

    dispatch({ type: "SET_ERROR", payload: null });
    return () => {
      dispatch({ type: "SET_ERROR", payload: null });
    };
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue.value }],
  }));

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = "Enter a valid email";
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const login = async () => {
    if (!validateForm()) return;

    const user = await loginAction(dispatch, email.trim(), password);

    if (user) {
      if (!user.emailVerified) {
        Alert.alert(
          "Email Not Verified",
          "Please verify your email address before continuing.",
          [
            {
              text: "Verify Now",
              onPress: () => router.replace("/(auth)/verify-email"),
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
        return;
      }
      // Small delay to ensure the Root Layout is fully mounted
      setTimeout(() => {
        router.replace("/(tabs)/home");
      }, 100);
    }
  };

  const handleInputChange = (
    setter: (val: string) => void,
    value: string,
    field: string
  ) => {
    setter(value);
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Premium Golden Header */}
          <LinearGradient
            colors={["#B8860B", "#DAA520", "#FFD700"]}
            style={styles.header}
          >
            <Animated.View
              entering={FadeInUp.delay(400).springify()}
              style={styles.imageContainer}
            >
              <Animated.View
                entering={FadeInDown.delay(100).springify()}
                style={styles.logoSection}
              >
                <View style={styles.logoCircle}>
                  <Ionicons name="diamond" size={48} color="#DAA520" />
                </View>
                <Text style={styles.appName}>SPLITIFY</Text>
                <Text style={styles.appTagline}>Premium Expense Sharing</Text>
              </Animated.View>
            </Animated.View>
          </LinearGradient>

          {/* White Content Sheet */}
          <View style={styles.contentSheet}>
            <Animated.View entering={FadeInDown.delay(500).springify()}>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
              <Text style={styles.instructionText}>
                Securely sign in to your accounts
              </Text>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.email ? styles.inputWrapperError : null,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#94a3b8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={(text) =>
                      handleInputChange(setEmail, text, "email")
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.password ? styles.inputWrapperError : null,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#94a3b8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) =>
                      handleInputChange(setPassword, text, "password")
                    }
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : null}
              </View>

              {/* General Error */}
              {state.error ? (
                <Animated.View
                  entering={FadeInDown}
                  style={styles.generalErrorContainer}
                >
                  <Text style={styles.generalErrorText}>{state.error}</Text>
                </Animated.View>
              ) : null}

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  state.isLoading && styles.loginButtonDisabled,
                ]}
                onPress={login}
                disabled={state.isLoading}
                activeOpacity={0.8}
              >
                {state.isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.loginButtonText}>CONTINUE</Text>
                )}
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>New here? </Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
                  <Text style={styles.signupText}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StatusBar,
    Text,
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
import { auth } from "../../../backend/config/firebase";
import { checkEmailVerification, sendVerificationEmail } from "../../../backend/services/UserService";
import { useApp } from "../../../store";
import { logoutAction } from "../../../store/actions";
import { Action } from "../../../store/types";
import { styles } from "./styles";

const sendVerificationEmailAction = async (
  dispatch: React.Dispatch<Action>
) => {
  dispatch({ type: "SET_LOADING", payload: true });
  try {
    await sendVerificationEmail();
    Alert.alert(
      "Success",
      "Verification email sent! Please check your inbox."
    );
    return true;
  } catch (error: any) {
    Alert.alert(
      "Error",
      error.message || "Failed to send verification email. Please try again."
    );
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
  return false;
};

const checkVerificationAction = async (dispatch: React.Dispatch<Action>) => {
  try {
    const isVerified = await checkEmailVerification();
    if (isVerified && auth.currentUser) {
      const updatedUser = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || "",
        name: auth.currentUser.displayName || undefined,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        photoURL: auth.currentUser.photoURL || undefined,
      };
      dispatch({ type: "SET_USER", payload: updatedUser });
      return true;
    }
  } catch (error) {}
  return false;
};

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const { user, isLoading } = state;

  const [resendCooldown, setResendCooldown] = useState(0);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [showInitialMessage, setShowInitialMessage] = useState(true);

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

    if (showInitialMessage) {
      const timer = setTimeout(() => setShowInitialMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showInitialMessage]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue.value }],
  }));

  useEffect(() => {
    if (user?.emailVerified) {
      router.replace("/(tabs)/home");
    }
  }, [user]);

  useEffect(() => {
    let interval: any;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Check verification only while this screen is focused
  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        if (auth.currentUser?.emailVerified) {
          clearInterval(interval);
          return;
        }
        checkVerificationAction(dispatch);
      }, 5000);

      return () => {
        clearInterval(interval);
      };
    }, [dispatch])
  );

  const handleSendVerificationEmail = async () => {
    if (resendCooldown > 0) return;
    const success = await sendVerificationEmailAction(dispatch);
    if (success) {
      setResendCooldown(60);
    }
  };

  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    const success = await checkVerificationAction(dispatch);
    setCheckingVerification(false);

    if (success) {
      router.replace("/(tabs)/home");
    } else {
      Alert.alert(
        "Not Verified",
        "Please verify your email first and try again."
      );
    }
  };

  const handleBackToLogin = async () => {
    await logoutAction(dispatch);
    router.replace("/(auth)/login");
  };

  const userEmail = user?.email || auth.currentUser?.email || "";

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

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
        <Animated.View
          entering={FadeInDown.delay(500).springify()}
          style={{ width: "100%", alignItems: "center" }}
        >
          <Text style={styles.title}>Verify Your Email</Text>

          {showInitialMessage && (
            <Animated.View entering={FadeInDown} style={styles.successMessage}>
              <Ionicons name="checkmark-circle" size={20} color="#166534" />
              <Text style={styles.successText}>Verification link sent!</Text>
            </Animated.View>
          )}

          <Text style={styles.subtitle}>Check your inbox at:</Text>
          <Text style={styles.email}>{userEmail}</Text>

          <Text style={styles.description}>
            We've sent a link to your email. Click it to activate your account
            and start sharing expenses.
          </Text>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              checkingVerification && styles.buttonDisabled,
            ]}
            onPress={handleCheckVerification}
            disabled={checkingVerification}
            activeOpacity={0.8}
          >
            {checkingVerification ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>
                I'VE VERIFIED MY EMAIL
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              (isLoading || resendCooldown > 0) && styles.buttonDisabled,
            ]}
            onPress={handleSendVerificationEmail}
            disabled={isLoading || resendCooldown > 0}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="#DAA520" />
            ) : (
              <Text style={styles.secondaryButtonText}>
                {resendCooldown > 0
                  ? `RESEND IN ${resendCooldown}S`
                  : "RESEND EMAIL"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footerStatus}>
            <TouchableOpacity onPress={handleBackToLogin}>
              <Text style={styles.backToLoginText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

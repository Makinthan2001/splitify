import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { logoutUser } from "../../../backend/services/UserService";
import { useApp } from "../../../store";
import { LogoutModal } from "../home/components/LogoutModal";
import { AboutSplitify } from "./components/AboutSplitify";
import { EditProfile } from "./components/EditProfile";
import { HelpSupport } from "./components/HelpSupport";
import { styles } from "./styles";

export default function ProfileScreen() {
  const router = useRouter();
  const { state } = useApp();
  const { user } = state;

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={["#B8860B", "#DAA520", "#FFD700"]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Animated.View
          entering={FadeInDown.duration(800).springify()}
          style={styles.profileImageContainer}
        >
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={styles.avatarImage as any}
            />
          ) : (
            <Text style={styles.avatarText}>{userInitial}</Text>
          )}
        </Animated.View>
        <Animated.Text
          entering={FadeInDown.delay(200).springify()}
          style={styles.userName}
        >
          {displayName}
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.delay(300).springify()}
          style={styles.userEmail}
        >
          {user?.email}
        </Animated.Text>
      </LinearGradient>

      <View style={styles.contentSheet}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Settings</Text>

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => setActiveModal("edit")}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name="person-outline" size={22} color="#DAA520" />
                </View>
                <Text style={styles.menuText}>Edit Profile</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#cbd5e1"
                  style={styles.chevron}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>More</Text>

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => setActiveModal("help")}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons
                    name="help-circle-outline"
                    size={22}
                    color="#DAA520"
                  />
                </View>
                <Text style={styles.menuText}>Help & Support</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#cbd5e1"
                  style={styles.chevron}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => setActiveModal("about")}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons
                    name="information-circle-outline"
                    size={22}
                    color="#DAA520"
                  />
                </View>
                <Text style={styles.menuText}>About Splitify</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#cbd5e1"
                  style={styles.chevron}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color="#e11d48"
                  style={styles.logoutIcon}
                />
                <Text style={styles.logoutText}>LOGOUT</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.versionText}>
              Splitify Version 1.0.0 (Modern Gold)
            </Text>
          </Animated.View>
        </ScrollView>
      </View>

      {/* Profile Feature Modals */}
      <EditProfile
        visible={activeModal === "edit"}
        onClose={() => setActiveModal(null)}
        user={user}
      />
      <HelpSupport
        visible={activeModal === "help"}
        onClose={() => setActiveModal(null)}
      />
      <AboutSplitify
        visible={activeModal === "about"}
        onClose={() => setActiveModal(null)}
      />
      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          setShowLogoutModal(false);
          try {
            await logoutUser();
            router.replace("/(auth)/login");
          } catch (error) {
            Alert.alert("Error", "Failed to logout");
          }
        }}
      />
    </View>
  );
}

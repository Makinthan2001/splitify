import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useNavigation } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { joinGroupByInviteCode } from "../../../backend/services/GroupService";
import InputModal from "../../../components/InputModal";
import { useApp } from "../../../store";
import { fetchGroupsAction, logoutAction } from "../../../store/actions";
import { Group, User } from "../../../types";
import { LogoutModal } from "./components/LogoutModal";
import { ProfileModal } from "./components/ProfileModal";
import { styles } from "./styles";

// Component for user profile circle with initials
const ProfileCircle = ({
  user,
  onPress,
}: {
  user: User | null;
  onPress: () => void;
}) => {
  const getInitials = (currentUser: User | null) => {
    if (currentUser?.name) {
      return currentUser.name
        .split(" ")
        .map((name: string) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (currentUser?.email) {
      return currentUser.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <TouchableOpacity
      style={styles.profileCircle}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.profileInitials}>{getInitials(user)}</Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { state, dispatch } = useApp();
  const { user, groups, isLoading: isGlobalLoading } = state;

  const [refreshing, setRefreshing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const loadGroups = async (forceRefresh = false) => {
    if (!user) return;
    // Show a small loader on initial load (not pull-to-refresh)
    if (!forceRefresh) {
      dispatch({ type: "SET_LOADING", payload: true });
    }
    try {
      await fetchGroupsAction(dispatch, user.uid, forceRefresh);
    } finally {
      if (!forceRefresh) {
        dispatch({ type: "SET_LOADING", payload: false });
      }
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && groups.length === 0) {
      loadGroups(false);
    }

    const unsubscribe = navigation.addListener("focus", () => {
      if (user) {
        loadGroups(true);
      }
    });

    return unsubscribe;
  }, [user, navigation]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadGroups(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    setShowProfileModal(false);
    await logoutAction(dispatch);
    router.replace("/(auth)/login");
  };

  const handleJoinModalSubmit = async (code: string) => {
    setShowJoinModal(false);
    if (!user) return;

    try {
      await joinGroupByInviteCode(code.trim().toUpperCase(), user.uid);
      Alert.alert("Success", "Joined group successfully!");
      loadGroups(true);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to join group");
    }
  };

  const renderGroupItem = ({ item, index }: { item: Group; index: number }) => {
    if (!item) return null;

    return (
      <Animated.View entering={FadeInDown.delay(100 * index).springify()}>
        <TouchableOpacity
          style={styles.groupCard}
          onPress={() => router.push(`/(group)/group/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.groupIcon}>
            <Ionicons name="people" size={24} color="#DAA520" />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName} numberOfLines={1}>
              {item.name || "Unnamed Group"}
            </Text>
            <Text style={styles.memberCount}>
              {item.members?.length || 0}{" "}
              {item.members?.length === 1 ? "member" : "members"}
            </Text>
          </View>
          <View style={styles.groupArrow}>
            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View entering={FadeInUp.delay(400)} style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="people-outline" size={40} color="#DAA520" />
      </View>
      <Text style={styles.emptyTitle}>No groups yet</Text>
      <Text style={styles.emptyText}>
        Create your first group or join one with an invite code to start
        splitting expenses!
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Golden Header Background */}
      <LinearGradient
        colors={["#B8860B", "#DAA520", "#FFD700"]}
        style={styles.header}
      >
        <Animated.View
          entering={FadeInUp.delay(100).springify()}
          style={styles.headerContent}
        >
          <View style={styles.welcomeSection}>
            <Text style={styles.title}>S P L T I F Y</Text>
            <Text style={styles.subtitle}>
              Hello, {user?.name?.split(" ")[0] || "User"}
            </Text>
          </View>
          <ProfileCircle
            user={user}
            onPress={() => setShowProfileModal(true)}
          />
        </Animated.View>
      </LinearGradient>

      {/* Main Content Sheet */}
      <View style={styles.contentSheet}>
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Groups List</Text>
          {groups.length > 0 && (
            <TouchableOpacity onPress={handleRefresh}>
              <Ionicons name="refresh" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {isGlobalLoading && groups.length === 0 ? (
          <View style={styles.emptyListContainer}>
            <ActivityIndicator size="large" color="#DAA520" />
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id}
            renderItem={renderGroupItem}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#DAA520"
                colors={["#DAA520"]}
              />
            }
            style={styles.groupsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              groups.length === 0
                ? styles.emptyListContainer
                : { paddingBottom: 100 },
            ]}
          />
        )}
      </View>

      {/* Bottom Action Bar */}
      <Animated.View
        entering={FadeInDown.delay(300).springify()}
        style={styles.actionButtons}
      >
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => setShowJoinModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.joinButtonText}>Join</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/(group)/create-group")}
          activeOpacity={0.8}
        >
          <Text style={styles.createButtonText}>Create Group</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Modals */}
      <InputModal
        visible={showJoinModal}
        title="Join Group"
        message="Enter the 6-character invite code"
        placeholder="ABC123"
        onCancel={() => setShowJoinModal(false)}
        onSubmit={handleJoinModalSubmit}
        submitText="Join"
        cancelText="Cancel"
      />

      <ProfileModal
        visible={showProfileModal}
        user={user}
        onClose={() => setShowProfileModal(false)}
        onViewProfile={() => {
          setShowProfileModal(false);
          router.push("/(tabs)/profile");
        }}
        onLogout={() => setShowLogoutModal(true)}
      />

      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </View>
  );
}

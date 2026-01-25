import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../../../backend/config/firebase";
import { getGroupSummary } from "../../../backend/routes/expenseRoutes";
import { getGroup } from "../../../backend/services/GroupService";
import { useApp } from "../../../store";
import { Group, GroupSummary } from "../../../types";
import { Balances } from "./components/Balances";
import { Insights } from "./components/Insights";
import { Settlements } from "./components/Settlements";
import { Trends } from "./components/Trends";
import { styles } from "./styles";

type TabType = "overview" | "balances" | "settlements" | "analytics";

export default function GroupSummaryScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { state } = useApp();
  const { user } = state;

  const [group, setGroup] = useState<Group | null>(null);
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const loadData = async () => {
    if (!groupId || !user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      const groupData = await getGroup(groupId);
      setGroup(groupData);

      const summaryPromise = getGroupSummary(groupId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 15000)
      );

      const summaryData = (await Promise.race([
        summaryPromise,
        timeoutPromise,
      ])) as GroupSummary;
      setSummary(summaryData);
    } catch (error: any) {
      // Fallback summary if loading fails partially
      setSummary({
        id: groupId,
        groupId: groupId,
        totalExpenses: 0,
        totalAmount: 0,
        balances: [],
        settlements: [],
        lastUpdated: new Date(),
        expensesByCategory: {},
        expensesByMonth: {},
        topSpenders: [],
      } as any);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [groupId, user?.uid]);

  // Realtime: auto-update when any settlement document changes
  useEffect(() => {
    if (!groupId) return;
    const coll = collection(
      db,
      "settlements",
      groupId as string,
      "settlements"
    );
    const unsub = onSnapshot(coll, () => {
      // Silent refresh: update summary without toggling the main loader
      getGroupSummary(groupId as string)
        .then((s) => setSummary(s))
        .catch(() => {});
    });
    return () => unsub();
  }, [groupId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DAA520" />
        <Text style={styles.loadingText}>Analyzing group finances...</Text>
      </View>
    );
  }

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
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack?.()) {
                router.back();
              } else {
                router.replace("/(tabs)/home" as any);
              }
            }}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Financial Report
          </Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {group?.name || "Loading group..."}
        </Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: "overview", label: "Insights", icon: "pie-chart-outline" },
          { key: "balances", label: "Balances", icon: "wallet-outline" },
          {
            key: "settlements",
            label: "Settle",
            icon: "swap-horizontal-outline",
          },
          { key: "analytics", label: "Trends", icon: "bar-chart-outline" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(tab.key as TabType)}
          >
            <Ionicons
              name={tab.icon as any}
              size={22}
              color={activeTab === tab.key ? "#DAA520" : "#94a3b8"}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.activeTabLabel,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#DAA520"
            />
          }
        >
          {activeTab === "overview" && <Insights summary={summary} />}
          {activeTab === "balances" && <Balances summary={summary} />}
          {activeTab === "settlements" && (
            <Settlements
              summary={summary}
              user={user}
              groupId={groupId as string}
              onRefresh={handleRefresh}
            />
          )}
          {activeTab === "analytics" && (
            <Trends summary={summary} group={group} />
          )}
        </ScrollView>
      </View>
    </View>
  );
}

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Group, GroupSummary } from "../../../../types";
import { styles } from "../styles";

interface TrendsProps {
  summary: GroupSummary | null;
  group: Group | null;
}

export const Trends = ({ summary, group }: TrendsProps) => {
  return (
    <View style={styles.section}>
      {/* <Text style={styles.sectionTitle}>Trends</Text>
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        {Object.entries(summary?.expensesByMonth || {})
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([month, amount]) => (
            <View key={month} style={styles.listCard}>
              <View style={styles.listIconContainer}>
                <Ionicons name="calendar-outline" size={20} color="#DAA520" />
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{month}</Text>
              </View>
              <Text style={styles.listValue}>Rs {amount.toFixed(0)}</Text>
            </View>
          ))}
      </Animated.View> */}

      <View style={{ marginTop: 24 }}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={[styles.statsGrid, { marginTop: 16 }]}
        >
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Avg Bill</Text>
            <Text style={styles.statValue}>
              Rs{" "}
              {summary?.totalExpenses
                ? (summary.totalAmount / summary.totalExpenses).toFixed(0)
                : 0}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Per Person</Text>
            <Text style={styles.statValue}>
              Rs{" "}
              {group?.members?.length
                ? (summary!.totalAmount / group.members.length).toFixed(0)
                : 0}
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

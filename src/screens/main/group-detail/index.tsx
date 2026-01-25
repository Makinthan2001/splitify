import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
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
import {
  calculateGroupSummary,
  getGroupExpenses,
} from "../../../backend/routes/expenseRoutes";
import { deleteGroup, getGroup } from "../../../backend/services/GroupService";
import { getUser } from "../../../backend/services/UserService";
import ConfirmationModal from "../../../components/ConfirmationModal";
import { useApp } from "../../../store";
import { Balance, Expense, Group, User } from "../../../types";
import { styles } from "./styles";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state } = useApp();
  const { user } = state;

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Helpers to prefer email over UID for display
  const getBalanceDisplay = (b: Balance) => {
    const name = b.name || b.displayName || "";
    const email = b.email || "";
    if (name && name !== email) return name;
    if (email) return email.split("@")[0];
    return b.uid;
  };
  const getBalanceInitial = (b: Balance) =>
    (b.email || b.displayName || b.name || b.uid).charAt(0).toUpperCase();
  const getPaidByLabel = (uidOrEmail: string) => {
    const isEmail = uidOrEmail.includes("@") && uidOrEmail.includes(".");
    if (isEmail) return uidOrEmail;
    const b = balances.find((x) => x.uid === uidOrEmail);
    return b ? b.email || b.displayName || b.name || uidOrEmail : uidOrEmail;
  };
  const getPaidByName = (uidOrEmail: string) => {
    const isEmail = uidOrEmail.includes("@") && uidOrEmail.includes(".");
    const b = balances.find((x) => x.uid === uidOrEmail);
    const name = b?.name || b?.displayName || "";
    const email = b?.email || (isEmail ? uidOrEmail : "");
    if (name && name !== email) return name;
    if (email) return email.split("@")[0];
    return uidOrEmail;
  };

  // Date helpers: safely convert Firestore Timestamp/Date/string/number
  const toJsDate = (value: any): Date | null => {
    try {
      if (!value) return null;
      if (typeof value?.toDate === "function") return value.toDate();
      if (value instanceof Date) return value;
      const d = new Date(value as any);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const getExpenseDate = (e: Expense): Date | null => {
    // Prefer server timestamps; fallback to client-side captured times
    return (
      toJsDate((e as any).createdAt) ||
      toJsDate((e as any).paidAt) ||
      toJsDate((e as any).updatedAt) ||
      toJsDate((e as any).createdAtClient) ||
      toJsDate((e as any).paidAtClient) ||
      toJsDate((e as any).updatedAtClient) ||
      null
    );
  };

  // Floating animation for the header summary balance status
  const summaryFloat = useSharedValue(0);

  useEffect(() => {
    summaryFloat.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2500 }),
        withTiming(0, { duration: 2500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedSummaryStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: summaryFloat.value }],
  }));

  const loadGroupData = async () => {
    if (!id || !user) return;

    try {
      const groupData = await getGroup(id);
      if (!groupData) {
        Alert.alert("Error", "Group not found", [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/home"),
          },
        ]);
        return;
      }

      setGroup(groupData);
      const groupExpenses = await getGroupExpenses(id);
      // Ensure newest-first ordering using robust date fallback
      const sortedExpenses = [...groupExpenses].sort((a, b) => {
        const da = getExpenseDate(a);
        const db = getExpenseDate(b);
        const ta = da ? da.getTime() : 0;
        const tb = db ? db.getTime() : 0;
        return tb - ta; // newest first
      });
      setExpenses(sortedExpenses);

      const summary = await calculateGroupSummary(id);
      setBalances(summary.balances);
    } catch (error) {
      Alert.alert("Error", "Failed to load group data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGroupData();
  }, [id, user?.uid]);

  useFocusEffect(
    useCallback(() => {
        if (id && user) {
            loadGroupData();
        }
    }, [id, user])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadGroupData();
  };

  const handleAddExpense = () => {
    router.push(`/(tabs)/add-expense?groupId=${id}` as any);
  };

  const handleShareInviteCode = async () => {
    if (!group) return;
    try {
      await Share.share({
        message: `Join my expense group "${group.name}" on Splitify with invite code: ${group.inviteCode}`,
        title: "Join Splitify Group",
      });
    } catch (error) {}
  };

  const handleShowMembers = async () => {
    if (!group) return;
    setShowMembersModal(true);
    setLoadingMembers(true);

    try {
      const memberData = await Promise.all(
        group.members.map(async (memberId) => {
          try {
            const userData = await getUser(memberId);
            if (userData) return userData;

            const isEmailUid = memberId.includes("@") && memberId.includes(".");
            return {
              uid: memberId,
              email: isEmailUid ? memberId : "",
              name: isEmailUid ? memberId : `User ${memberId.substring(0, 8)}`,
              createdAt: null,
              lastSeen: null,
            } as User;
          } catch (error) {
            return {
              uid: memberId,
              email: "",
              name: `User ${memberId.substring(0, 8)}`,
              createdAt: null,
              lastSeen: null,
            } as User;
          }
        })
      );
      setMembers(memberData);
    } catch (error) {
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || !id) return;
    try {
      await deleteGroup(id);
      setShowDeleteModal(false);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      Alert.alert("Error", "Failed to delete group: " + error.message);
      setShowDeleteModal(false);
    }
  };

  const normalizeEmail = (e?: string | null) => (e || "").trim().toLowerCase();
  const isCurrentUser = (b: Balance) => {
    const userUid = (user?.uid || "").trim();
    const userEmail = normalizeEmail(user?.email);
    const bUid = (b.uid || "").trim();
    const bEmail = normalizeEmail(b.email);
    // Match if:
    // - Balance uid equals user's real uid
    // - Balance uid was stored as the user's email
    // - Balance email equals user's email (case-insensitive)
    return (
      bUid === userUid ||
      bUid === user?.email ||
      (bEmail && bEmail === userEmail)
    );
  };
  const userBalance = balances
    .filter(isCurrentUser)
    .reduce((sum, b) => sum + (b.balance || 0), 0);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#DAA520" />
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

      {/* Premium Golden Header */}
      <LinearGradient
        colors={["#B8860B", "#DAA520", "#FFD700"]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)/home")}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {group?.name}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleShareInviteCode}
            >
              <Ionicons name="share-social-outline" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleShowMembers}
            >
              <Ionicons name="people-outline" size={20} color="white" />
            </TouchableOpacity>
            {group?.hostId === user?.uid && (
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => setShowDeleteModal(true)}
              >
                <Ionicons name="trash-outline" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Animated.View style={[styles.summaryCard]}>
          <Text style={styles.summaryAmount}>
            Rs {Math.abs(userBalance).toFixed(2)}
          </Text>
          <Text
            style={[
              styles.summaryStatus,
              { color: userBalance >= 0 ? "#fff" : "#fee2e2" },
            ]}
          >
            {userBalance === 0
              ? "You are settled"
              : userBalance > 0
              ? "You get back"
              : "You owe"}
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* White Content Sheet */}
      <View style={styles.contentSheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#DAA520"
            />
          }
        >
          {/* Members Subsection (removed summary button; moved to bottom) */}

          {/* Activity Subsection */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <View style={styles.expenseListHeader}>
              <Text style={styles.sectionTitle}>Activity</Text>
            </View>

            {expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="receipt-outline" size={40} color="#cbd5e1" />
                </View>
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptyText}>
                  Tap the + button to add your first expense for this group.
                </Text>
              </View>
            ) : (
              <View style={styles.expenseList}>
                {expenses.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.expenseCard}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedExpense(item);
                      setShowExpenseModal(true);
                    }}
                  >
                    <View style={styles.expenseIconContainer}>
                      <Ionicons name="cash-outline" size={24} color="#DAA520" />
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {(() => {
                        const nameLine = getPaidByName(item.paidBy);
                        const emailLine = getPaidByLabel(item.paidBy);
                        const showEmail = emailLine && nameLine !== emailLine;
                        return (
                          <>
                            <Text style={styles.expenseMeta} numberOfLines={1}>
                              Paid by {nameLine}
                            </Text>
                            {showEmail && (
                              <Text
                                style={styles.expenseMeta}
                                numberOfLines={1}
                              >
                                {emailLine}
                              </Text>
                            )}
                          </>
                        );
                      })()}
                    </View>
                    <View style={styles.expenseAmountContainer}>
                      <Text style={styles.expenseAmount}>
                        Rs {item.amount.toFixed(2)}
                      </Text>
                      <Text style={styles.expenseDate}>
                        {(() => {
                          const d = getExpenseDate(item);
                          return d ? d.toLocaleDateString() : "—";
                        })()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </View>

      {/* Premium FAB */}
      <Animated.View entering={FadeInUp.delay(600).springify()}>
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddExpense}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#DAA520" />
        </TouchableOpacity>
      </Animated.View>

      {/* Summary FAB (bottom-left) */}
      <Animated.View entering={FadeInUp.delay(600).springify()}>
        <TouchableOpacity
          style={styles.summaryFab}
          onPress={() => router.push(`/group-summary?groupId=${id}` as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="stats-chart-outline" size={28} color="#DAA520" />
        </TouchableOpacity>
      </Animated.View>

      {/* Members List Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Group Members</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMembersModal(false)}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {loadingMembers ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator color="#DAA520" />
            </View>
          ) : (
            <FlatList
              data={members}
              keyExtractor={(item) => item.uid}
              contentContainerStyle={styles.membersList}
              renderItem={({ item }) => (
                <View style={styles.memberListCard}>
                  <View
                    style={[
                      styles.memberAvatar,
                      {
                        width: 44,
                        height: 44,
                        marginBottom: 0,
                        marginRight: 16,
                      },
                    ]}
                  >
                    <Text style={[styles.memberInitials, { fontSize: 16 }]}>
                      {(item.name || item.email || "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberListInfo}>
                    <Text style={styles.memberListName}>
                      {item.name || "Splitify User"}
                    </Text>
                    {!!item.email && item.email !== item.name && (
                      <Text style={styles.memberListEmail}>{item.email}</Text>
                    )}
                  </View>
                  {item.uid === group?.hostId && (
                    <View style={styles.hostBadge}>
                      <Text style={styles.hostBadgeText}>Host</Text>
                    </View>
                  )}
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      {/* Expense Detail Popup */}
      <Modal
        visible={showExpenseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExpenseModal(false)}
      >
        <View style={styles.detailModalBackdrop}>
          <View style={styles.detailModalCard}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={styles.detailTitle} numberOfLines={1}>
                {selectedExpense?.title || "Expense"}
              </Text>
              <TouchableOpacity
                style={styles.detailCloseBtn}
                onPress={() => setShowExpenseModal(false)}
              >
                <Ionicons name="close" size={18} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {selectedExpense && (
              <View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailValue}>
                    Rs {selectedExpense.amount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>
                    {selectedExpense.category || "Others"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Paid By</Text>
                  <Text style={styles.detailValue}>
                    {getPaidByName(selectedExpense.paidBy)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>
                    {getPaidByLabel(selectedExpense.paidBy)}
                  </Text>
                </View>
                {!!selectedExpense.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>For</Text>
                    <Text style={styles.detailValue} numberOfLines={2}>
                      {selectedExpense.description}
                    </Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {selectedExpense.note || "—"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {(() => {
                      const d = getExpenseDate(selectedExpense);
                      return d ? d.toLocaleString() : "—";
                    })()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>


      {/* Delete Group Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Group?"
        message="Are you sure you want to delete this group? This action cannot be undone and all expenses will be lost."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteGroup}
      />
    </View>
  );
}

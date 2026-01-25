import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Image, Modal, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { confirmSettlement } from "../../../../backend/routes/expenseRoutes";
import { GroupSummary, User } from "../../../../types";
import { styles } from "../styles";

interface SettlementsProps {
  summary: GroupSummary | null;
  user: User | null;
  groupId: string;
  onRefresh: () => void;
}

export const Settlements = ({
  summary,
  user,
  groupId,
  onRefresh,
}: SettlementsProps) => {
  if (!summary) return null;
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Settle Up</Text>
      </View>

      {(() => {
        const visible = (summary?.settlements || []).filter(
          (s) => !(s.settled || s.status === "settled")
        );
        return visible.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#059669" />
            <Text style={styles.emptyTitle}>Perfectly Balanced!</Text>
            <Text style={styles.emptyText}>
              Everyone in the group is settled. No payments needed.
            </Text>
          </View>
        ) : (
          visible.map((settlement, index) => {
            const fromUserBalance = summary?.balances?.find(
              (b) => b.uid === settlement.fromUser
            );
            const toUserBalance = summary?.balances?.find(
              (b) => b.uid === settlement.toUser
            );

            const fromPrimaryName =
              fromUserBalance?.name ||
              fromUserBalance?.displayName ||
              settlement.fromUserName ||
              settlement.fromUser ||
              "User";
            const fromEmail =
              fromUserBalance?.email || settlement.fromUser || "";
            const showFromEmail = !!fromEmail;
            const fromDisplayName = (() => {
              if (fromPrimaryName && fromPrimaryName !== fromEmail)
                return fromPrimaryName;
              if (fromEmail) return fromEmail.split("@")[0];
              return fromPrimaryName;
            })();

            const toPrimaryName =
              toUserBalance?.name ||
              toUserBalance?.displayName ||
              settlement.toUserName ||
              settlement.toUser ||
              "User";
            const toEmail = toUserBalance?.email || settlement.toUser || "";
            const showToEmail = !!toEmail;
            const toDisplayName = (() => {
              if (toPrimaryName && toPrimaryName !== toEmail)
                return toPrimaryName;
              if (toEmail) return toEmail.split("@")[0];
              return toPrimaryName;
            })();

            const currentEmail = (user?.email || "").toLowerCase();
            const isInvolved =
              (settlement.fromUser || "").toLowerCase() === currentEmail ||
              (settlement.toUser || "").toLowerCase() === currentEmail;
            const confirmations = (settlement.confirmations || []).map((c) =>
              (c || "").toLowerCase()
            );
            const alreadyConfirmed = confirmations.includes(currentEmail);
            const isSettled =
              !!settlement.settled || settlement.status === "settled";
            const isPending = !isSettled && confirmations.length > 0;

            return (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(index * 100).springify()}
                style={styles.settlementCard}
              >
                <View style={styles.settlementFlow}>
                  <View className="from" style={styles.settlementUser}>
                    <View
                      style={[
                        styles.balanceAvatar,
                        {
                          width: 44,
                          height: 44,
                          marginRight: 0,
                          marginBottom: 8,
                          backgroundColor: "#dc2626",
                        },
                      ]}
                    >
                      {fromUserBalance?.photoURL ? (
                        <Image
                          source={{ uri: fromUserBalance.photoURL }}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: 12,
                          }}
                        />
                      ) : (
                        <Text style={styles.balanceInitials}>
                          {(
                            settlement.fromUserName ||
                            settlement.fromUser ||
                            "?"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {fromDisplayName.split(" ")[0]}
                    </Text>
                    {showFromEmail && (
                      <Text style={styles.listSubtitle} numberOfLines={1}>
                        {fromEmail}
                      </Text>
                    )}
                  </View>

                  <View style={styles.settlementArrow}>
                    <Ionicons name="arrow-forward" size={20} color="#DAA520" />
                  </View>

                  <View className="to" style={styles.settlementUser}>
                    <View
                      style={[
                        styles.balanceAvatar,
                        {
                          width: 44,
                          height: 44,
                          marginRight: 0,
                          marginBottom: 8,
                          backgroundColor: "#059669",
                        },
                      ]}
                    >
                      {toUserBalance?.photoURL ? (
                        <Image
                          source={{ uri: toUserBalance.photoURL }}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: 12,
                          }}
                        />
                      ) : (
                        <Text style={styles.balanceInitials}>
                          {(settlement.toUserName || settlement.toUser || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {toDisplayName.split(" ")[0]}
                    </Text>
                    {showToEmail && (
                      <Text style={styles.listSubtitle} numberOfLines={1}>
                        {toEmail}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.settlementAmountBox}>
                  <Text style={styles.settlementLabel}>Suggested Payment</Text>
                  <Text style={styles.settlementAmount}>
                    Rs {settlement.amount.toFixed(1)}
                  </Text>
                  {isPending ? (
                    <View style={{ marginTop: 10 }}>
                      <Text
                        style={[styles.settlementLabel, { color: "#b45309" }]}
                      >
                        The amount settles only when both users click ‘Settled’
                      </Text>
                    </View>
                  ) : null}
                  {isInvolved && !alreadyConfirmed && !isSettled && (
                    <TouchableOpacity
                      style={{
                        marginTop: 12,
                        backgroundColor: "#DAA520",
                        borderRadius: 12,
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        alignSelf: "center",
                      }}
                      onPress={async () => {
                        try {
                          const currentEmailLower = (
                            user!.email || ""
                          ).toLowerCase();
                          const otherEmailLower =
                            (settlement.fromUser || "").toLowerCase() ===
                            currentEmailLower
                              ? (settlement.toUser || "").toLowerCase()
                              : (settlement.fromUser || "").toLowerCase();
                          const confirmationsLower = (
                            settlement.confirmations || []
                          ).map((c: string) => (c || "").toLowerCase());
                          const willBeSettled =
                            confirmationsLower.includes(otherEmailLower);

                          await confirmSettlement(
                            groupId as string,
                            settlement.fromUser,
                            settlement.toUser,
                            settlement.amount,
                            user!.email!,
                            { id: settlement.id as string | undefined }
                          );
                          setPopupTitle(
                            willBeSettled
                              ? "Settlement completed"
                              : "Confirmation recorded"
                          );
                          setPopupMessage(
                            willBeSettled
                              ? "Both parties have confirmed. This payment is now marked as Settled."
                              : "Thanks — your confirmation has been recorded. The amount settles only when both users click 'Settled'."
                          );
                          setPopupVisible(true);
                        } catch (e: any) {
                          console.error("Settlement Error:", e);
                          Alert.alert("Settlement Failed", e.message || "Unknown error occurred");
                        }
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "800" }}>
                        Settled
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            );
          })
        );
      })()}

      {/* Confirmation Popup */}
      <Modal
        visible={popupVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
          activeOpacity={1}
          onPress={() => {
            setPopupVisible(false);
            onRefresh();
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
              minWidth: 280,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: "#0f172a",
                marginBottom: 8,
              }}
            >
              {popupTitle}
            </Text>
            <Text style={{ fontSize: 14, color: "#64748b" }}>
              {popupMessage}
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 16,
                alignSelf: "flex-end",
                backgroundColor: "#DAA520",
                borderRadius: 10,
                paddingVertical: 8,
                paddingHorizontal: 16,
              }}
              onPress={() => {
                setPopupVisible(false);
                onRefresh();
              }}
            >
              <Text style={{ color: "white", fontWeight: "800" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

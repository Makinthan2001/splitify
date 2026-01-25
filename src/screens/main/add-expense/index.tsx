import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { addExpense } from "../../../backend/routes/expenseRoutes";
import { getGroup } from "../../../backend/services/GroupService";
import { useApp } from "../../../store";
import { Expense } from "../../../types";
import { styles } from "./styles";

const CATEGORIES = [
  { id: "Food", icon: "restaurant-outline" },
  { id: "Living", icon: "home-outline" },
  { id: "Travel", icon: "bus-outline" },
  { id: "Shopping", icon: "cart-outline" },
  { id: "Entertainment", icon: "game-controller-outline" },
  { id: "Utilities", icon: "bulb-outline" },
  { id: "Bills", icon: "wallet-outline" },
  { id: "Others", icon: "ellipsis-horizontal-outline" },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { state } = useApp();
  const { user } = state;

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    description: "",
    category: "Others",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    title: "",
    amount: "",
  });

  const validateForm = () => {
    const newErrors = { title: "", amount: "" };
    let isValid = true;

    if (!formData.title.trim()) {
      newErrors.title = "Expense title is required";
      isValid = false;
    }

    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required";
      isValid = false;
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = "Enter a valid amount";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAddExpense = async () => {
    if (!validateForm() || !user || !groupId) return;

    setLoading(true);

    try {
      const group = await getGroup(groupId);
      if (!group) {
        Alert.alert("Error", "Group not found");
        return;
      }

      const expenseData: Omit<Expense, "id" | "createdAt"> = {
        title: formData.title.trim(),
        description: formData.description?.trim(),
        amount: Number(formData.amount),
        currency: "Rs",
        paidBy: user.email || user.uid,
        participants: group.members,
        splitType: "equal",
        category: formData.category,
        note: formData.note.trim() || undefined,
        // paidAt left undefined; backend will set serverTimestamp()
      };
      await addExpense(groupId, expenseData);
      router.replace(`/group/${groupId}` as any);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field as keyof typeof errors]: "" });
    }
  };

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
              } else if (groupId) {
                router.replace(`/group/${groupId}` as any);
              } else {
                router.replace("/(tabs)/home" as any);
              }
            }}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>New Transaction</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.contentSheet}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              {/* Amount Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Amount Paid</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    styles.amountWrapper,
                    errors.amount && { borderColor: "#ef4444" },
                  ]}
                >
                  <Text style={styles.currencyText}>Rs</Text>
                  <TextInput
                    style={[styles.input, styles.amountInput]}
                    placeholder="0"
                    placeholderTextColor="#d97706"
                    keyboardType="decimal-pad"
                    value={formData.amount}
                    onChangeText={(text) => updateField("amount", text)}
                    editable={!loading}
                  />
                </View>
                {errors.amount ? (
                  <Text style={styles.errorText}>{errors.amount}</Text>
                ) : null}
              </View>

              {/* Title Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>What was it for?</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.title && { borderColor: "#ef4444" },
                  ]}
                >
                  <Ionicons
                    name="pencil-outline"
                    size={20}
                    color="#94a3b8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Pizza Night, Taxi..."
                    placeholderTextColor="#94a3b8"
                    value={formData.title}
                    onChangeText={(text) => updateField("title", text)}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
                {errors.title ? (
                  <Text style={styles.errorText}>{errors.title}</Text>
                ) : null}
              </View>

              {/* Category selector */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryCard,
                        formData.category === cat.id &&
                          styles.selectedCategoryCard,
                      ]}
                      onPress={() => updateField("category", cat.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.categoryIconContainer}>
                        <Ionicons
                          name={cat.icon as any}
                          size={20}
                          color={
                            formData.category === cat.id ? "#DAA520" : "#64748b"
                          }
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryLabel,
                          formData.category === cat.id &&
                            styles.selectedCategoryLabel,
                        ]}
                      >
                        {cat.id}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Receipt Image Removed */}

              {/* Description / Note */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Any details to remember?"
                    placeholderTextColor="#94a3b8"
                    value={formData.note}
                    onChangeText={(text) => updateField("note", text)}
                    multiline
                    numberOfLines={3}
                    editable={!loading}
                  />
                </View>
              </View>
            </Animated.View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleAddExpense}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={24}
                    color="white"
                  />
                  <Text style={styles.submitButtonText}>SAVE EXPENSE</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

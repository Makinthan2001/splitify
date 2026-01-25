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
import {
  clearGroupsCache,
  createGroup,
} from "../../../backend/services/GroupService";
import { useApp } from "../../../store";
import { styles } from "./styles";
import SuccessModal from "@/components/SuccessModal";

export default function CreateGroupScreen() {
  const router = useRouter();
  const { state } = useApp();
  const { user } = state;

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue.value }],
  }));

  const handleCreateGroup = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to create a group");
      return;
    }

    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    setLoading(true);

    try {
      const groupId = await createGroup(
        user.uid,
        groupName.trim(),
        description.trim() || undefined,
        [] 
      );


      if (user?.uid) {
        clearGroupsCache(user.uid);
      }

      // Show custom success modal
      setShowSuccessModal(true);
      
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.replace("/(tabs)/home");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
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
              entering={FadeInUp.delay(200).springify()}
              style={[styles.iconComposition, animatedIconStyle]}
            >
              <View style={styles.glassCircle}>
                <Ionicons name="people" size={36} color="white" />
              </View>
            </Animated.View>
            
            <Animated.View entering={FadeInUp.delay(300).springify()} style={{ alignItems: 'center' }}>
              <Text style={styles.headerTitle}>S P I L T I F Y</Text>
              <Text style={styles.headerSubtitle}>Start Your New Circle</Text>
            </Animated.View>
          </LinearGradient>

          {/* White Content Sheet */}
          <View style={styles.contentSheet}>
            <Animated.View entering={FadeInDown.delay(500).springify()}>
              {/* Group Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Group Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="bookmark-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Europe Trip 2024"
                    placeholderTextColor="#94a3b8"
                    value={groupName}
                    onChangeText={setGroupName}
                  />
                </View>
              </View>

              {/* Description Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Description (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="document-text-outline" size={20} color="#94a3b8" style={[styles.inputIcon, { marginTop: 14, alignSelf: 'flex-start' }]} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="What is this group for?"
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={3}
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#0369a1" style={styles.infoIcon} />
                <Text style={styles.infoText}>
                  You’ll be the group admin, and you can add more members using the share code.
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.footerActions}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => router.replace("/(tabs)/home")}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.createButton, (!groupName.trim() || loading) && styles.createButtonDisabled]} 
                  onPress={handleCreateGroup}
                  disabled={!groupName.trim() || loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.createButtonText}>CREATE GROUP</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccessModal}
        title="Group Created!"
        message={`"${groupName}" has been successfully created.`}
        confirmText="Ok"
        onConfirm={handleSuccessClose}
      />
    </View>
  );
}

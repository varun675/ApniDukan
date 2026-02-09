import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getSettings, saveSettings, Settings } from "@/lib/storage";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettingsState] = useState<Settings>({
    upiId: "",
    businessName: "",
    phoneNumber: "",
  });
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    const data = await getSettings();
    setSettingsState(data);
  };

  const handleSave = async () => {
    if (!settings.upiId.trim()) {
      Alert.alert("UPI ID Required", "Please enter your UPI ID to generate payment links.");
      return;
    }
    await saveSettings(settings);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Configure your business details</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your Business Name"
                placeholderTextColor={Colors.textLight}
                value={settings.businessName}
                onChangeText={(t) => setSettingsState({ ...settings, businessName: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Your phone number"
                placeholderTextColor={Colors.textLight}
                keyboardType="phone-pad"
                value={settings.phoneNumber}
                onChangeText={(t) => setSettingsState({ ...settings, phoneNumber: t })}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Settings</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>UPI ID</Text>
              <TextInput
                style={styles.input}
                placeholder="yourname@paytm or phone@gpay"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="none"
                value={settings.upiId}
                onChangeText={(t) => setSettingsState({ ...settings, upiId: t })}
              />
              <Text style={styles.inputHint}>
                This UPI ID will be used for generating QR codes and payment links in bills
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={22} color={Colors.primary} />
            <Text style={styles.infoText}>
              Your UPI ID is stored locally on this device only and is used to generate payment QR codes
              and deep links for GPay and PhonePe.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && styles.saveBtnPressed,
              saved && styles.saveBtnSaved,
            ]}
            onPress={handleSave}
          >
            {saved ? (
              <View style={styles.savedRow}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                <Text style={styles.saveBtnText}>Saved</Text>
              </View>
            ) : (
              <Text style={styles.saveBtnText}>Save Settings</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
  },
  inputHint: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  infoCard: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: Colors.primary + "08",
    borderRadius: 14,
    marginTop: 24,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  saveBtnSaved: {
    backgroundColor: Colors.success,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

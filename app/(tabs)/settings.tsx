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
import { getSettings, saveSettings, Settings, WhatsAppGroup } from "@/lib/storage";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettingsState] = useState<Settings>({
    upiId: "",
    businessName: "",
    phoneNumber: "",
    whatsappGroups: [],
  });
  const [newGroupName, setNewGroupName] = useState("");
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

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup: WhatsAppGroup = {
      id: generateId(),
      name: newGroupName.trim(),
    };
    setSettingsState({
      ...settings,
      whatsappGroups: [...settings.whatsappGroups, newGroup],
    });
    setNewGroupName("");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDeleteGroup = (id: string) => {
    setSettingsState({
      ...settings,
      whatsappGroups: settings.whatsappGroups.filter((g) => g.id !== id),
    });
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const handleSave = async () => {
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
          <Text style={styles.headerSubtitle}>Apni Dukan configuration</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="storefront-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Business Details</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Apni Dukan"
                placeholderTextColor={Colors.textLight}
                value={settings.businessName}
                onChangeText={(t) => setSettingsState({ ...settings, businessName: t })}
              />
              <Text style={styles.inputHint}>
                This name appears in your WhatsApp messages
              </Text>
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
            <View style={styles.sectionHeader}>
              <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Payment Settings</Text>
            </View>

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
                Used for QR codes and payment links in bills
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="logo-whatsapp" size={20} color={Colors.whatsapp} />
              <Text style={styles.sectionTitle}>WhatsApp Groups</Text>
            </View>
            <Text style={styles.sectionDesc}>
              Save group names here so you can quickly share your price list to multiple groups
            </Text>

            <View style={styles.addGroupRow}>
              <TextInput
                style={[styles.input, styles.addGroupInput]}
                placeholder="Group name"
                placeholderTextColor={Colors.textLight}
                value={newGroupName}
                onChangeText={setNewGroupName}
                onSubmitEditing={handleAddGroup}
              />
              <Pressable
                onPress={handleAddGroup}
                style={[styles.addGroupBtn, !newGroupName.trim() && styles.addGroupBtnDisabled]}
              >
                <Ionicons name="add" size={20} color={Colors.white} />
              </Pressable>
            </View>

            {settings.whatsappGroups.length > 0 ? (
              <View style={styles.groupList}>
                {settings.whatsappGroups.map((group, idx) => (
                  <View key={group.id} style={styles.groupItem}>
                    <View style={styles.groupItemLeft}>
                      <View style={styles.groupIcon}>
                        <Ionicons name="people" size={16} color={Colors.whatsapp} />
                      </View>
                      <Text style={styles.groupName}>{group.name}</Text>
                    </View>
                    <Pressable onPress={() => handleDeleteGroup(group.id)} hitSlop={8}>
                      <Ionicons name="close-circle" size={22} color={Colors.error + "80"} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noGroupsBox}>
                <Text style={styles.noGroupsText}>
                  No groups added yet. Add your WhatsApp group names above.
                </Text>
              </View>
            )}
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
                <Text style={styles.saveBtnText}>Saved!</Text>
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
    color: Colors.primaryDark,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  sectionDesc: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
    marginBottom: 14,
    marginTop: 4,
    lineHeight: 19,
  },
  inputGroup: {
    marginTop: 14,
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
  addGroupRow: {
    flexDirection: "row",
    gap: 8,
  },
  addGroupInput: {
    flex: 1,
  },
  addGroupBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.whatsapp,
    alignItems: "center",
    justifyContent: "center",
  },
  addGroupBtnDisabled: {
    opacity: 0.5,
  },
  groupList: {
    marginTop: 12,
    gap: 6,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  groupIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.whatsapp + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  groupName: {
    fontSize: 15,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.text,
  },
  noGroupsBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
  },
  noGroupsText: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
    textAlign: "center",
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

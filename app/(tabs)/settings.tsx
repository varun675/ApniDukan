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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
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
    qrCodeImage: undefined,
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

  const handlePickQR = () => {
    if (Platform.OS === "web") {
      pickFromGallery();
      return;
    }
    Alert.alert("Upload QR Code", "Choose how to add your payment QR code", [
      {
        text: "Take Photo",
        onPress: takePhoto,
      },
      {
        text: "Choose from Gallery",
        onPress: pickFromGallery,
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Needed", "Please allow camera access to take a photo of your QR code.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setSettingsState({ ...settings, qrCodeImage: result.assets[0].uri });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Needed", "Please allow gallery access to select your QR code image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setSettingsState({ ...settings, qrCodeImage: result.assets[0].uri });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRemoveQR = () => {
    Alert.alert("Remove QR Code", "Are you sure you want to remove your payment QR code?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setSettingsState({ ...settings, qrCodeImage: undefined });
          if (Platform.OS !== "web") Haptics.selectionAsync();
        },
      },
    ]);
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
              <Text style={styles.inputLabel}>PhonePe UPI ID</Text>
              <TextInput
                style={styles.input}
                placeholder="yourname@ybl or phone@ibl"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="none"
                value={settings.phonepeUpiId || ""}
                onChangeText={(t) => setSettingsState({ ...settings, phonepeUpiId: t || undefined })}
              />
              <Text style={styles.inputHint}>
                Customers can tap a link in WhatsApp to pay via PhonePe
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Google Pay UPI ID</Text>
              <TextInput
                style={styles.input}
                placeholder="yourname@okaxis or phone@okhdfcbank"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="none"
                value={settings.gpayUpiId || ""}
                onChangeText={(t) => setSettingsState({ ...settings, gpayUpiId: t || undefined })}
              />
              <Text style={styles.inputHint}>
                Customers can tap a link in WhatsApp to pay via Google Pay
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>UPI ID (General)</Text>
              <TextInput
                style={styles.input}
                placeholder="yourname@paytm or any UPI ID"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="none"
                value={settings.upiId}
                onChangeText={(t) => setSettingsState({ ...settings, upiId: t })}
              />
              <Text style={styles.inputHint}>
                Shown in bills for manual payment (copy & pay)
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment QR Code</Text>
              <Text style={styles.inputHint}>
                Upload your GPay / PhonePe / Paytm QR code image. This will be shown in bills.
              </Text>

              {settings.qrCodeImage ? (
                <View style={styles.qrPreviewContainer}>
                  <Image
                    source={{ uri: settings.qrCodeImage }}
                    style={styles.qrPreviewImage}
                    resizeMode="contain"
                  />
                  <View style={styles.qrPreviewActions}>
                    <Pressable
                      onPress={handlePickQR}
                      style={styles.qrChangeBtn}
                    >
                      <Ionicons name="camera-outline" size={18} color={Colors.primary} />
                      <Text style={styles.qrChangeBtnText}>Change</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleRemoveQR}
                      style={styles.qrRemoveBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                      <Text style={styles.qrRemoveBtnText}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={handlePickQR}
                  style={styles.qrUploadBox}
                >
                  <View style={styles.qrUploadIconCircle}>
                    <Ionicons name="qr-code-outline" size={32} color={Colors.primary} />
                  </View>
                  <Text style={styles.qrUploadText}>Tap to upload QR code</Text>
                  <Text style={styles.qrUploadSubtext}>Take a photo or choose from gallery</Text>
                </Pressable>
              )}
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
                {settings.whatsappGroups.map((group) => (
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
  qrUploadBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.primary + "40",
    backgroundColor: Colors.primary + "06",
  },
  qrUploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  qrUploadText: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.primary,
  },
  qrUploadSubtext: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
    marginTop: 4,
  },
  qrPreviewContainer: {
    marginTop: 10,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  qrPreviewImage: {
    width: "100%",
    height: 240,
    backgroundColor: Colors.white,
  },
  qrPreviewActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  qrChangeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.primary + "12",
  },
  qrChangeBtnText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.primary,
  },
  qrRemoveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.error + "10",
  },
  qrRemoveBtnText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.error,
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

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { saveItem, updateItem, getItems } from "@/lib/storage";

type PricingType = "per_kg" | "per_unit" | "per_piece" | "per_dozen";

const PRICING_OPTIONS: { label: string; value: PricingType; icon: string }[] = [
  { label: "Per Kg", value: "per_kg", icon: "scale-outline" },
  { label: "Per Unit", value: "per_unit", icon: "cube-outline" },
  { label: "Per Piece", value: "per_piece", icon: "ellipse-outline" },
  { label: "Per Dozen", value: "per_dozen", icon: "grid-outline" },
];

export default function AddItemScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ editId?: string }>();
  const isEditing = !!params.editId;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [pricingType, setPricingType] = useState<PricingType>("per_kg");
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    if (params.editId) {
      loadItem(params.editId);
    }
  }, [params.editId]);

  const loadItem = async (id: string) => {
    const items = await getItems();
    const item = items.find((i) => i.id === id);
    if (item) {
      setName(item.name);
      setPrice(item.price.toString());
      setPricingType(item.pricingType);
      setQuantity(item.quantity || "");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter the item name.");
      return;
    }
    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price.");
      return;
    }

    if (isEditing && params.editId) {
      await updateItem(params.editId, {
        name: name.trim(),
        price: parseFloat(price),
        pricingType,
        quantity: quantity.trim() || undefined,
      });
    } else {
      await saveItem({
        name: name.trim(),
        price: parseFloat(price),
        pricingType,
        quantity: quantity.trim() || undefined,
      });
    }

    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1 }} onStartShouldSetResponder={() => { Keyboard.dismiss(); return false; }}>
        <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
            <Text style={styles.topBarTitle}>{isEditing ? "Edit Item" : "Add Item"}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.iconHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="pricetag" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.iconSubtext}>
              {isEditing ? "Update item details" : "Add a new item to your price list"}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Tomatoes, Mangoes, Coconut"
                placeholderTextColor={Colors.textLight}
                value={name}
                onChangeText={setName}
                autoFocus={!isEditing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price (INR)</Text>
              <View style={styles.priceInputRow}>
                <Text style={styles.currencySymbol}>{"\u20B9"}</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pricing Type</Text>
              <View style={styles.pricingRow}>
                {PRICING_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      setPricingType(opt.value);
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                    }}
                    style={[
                      styles.pricingOption,
                      pricingType === opt.value && styles.pricingOptionActive,
                    ]}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={18}
                      color={pricingType === opt.value ? Colors.primary : Colors.textLight}
                    />
                    <Text
                      style={[
                        styles.pricingOptionText,
                        pricingType === opt.value && styles.pricingOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Available Quantity (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 50 kg, 100 pieces"
                placeholderTextColor={Colors.textLight}
                value={quantity}
                onChangeText={setQuantity}
              />
              <Text style={styles.inputHint}>
                This will show up in the WhatsApp message if filled
              </Text>
            </View>
          </View>

          {name.trim() && price.trim() && (
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Preview in message:</Text>
              <Text style={styles.previewText}>
                {"\uD83D\uDCB0"} *{name.trim()}* - {"\u20B9"}{price}{getPricingLabel(pricingType)}
                {quantity.trim() ? ` | ${quantity.trim()} available` : ""}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && styles.saveBtnPressed,
            ]}
            onPress={handleSave}
          >
            <Ionicons name="checkmark" size={22} color={Colors.white} />
            <Text style={styles.saveBtnText}>{isEditing ? "Update Item" : "Add Item"}</Text>
          </Pressable>
        </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function getPricingLabel(type: string): string {
  switch (type) {
    case "per_kg": return "/kg";
    case "per_unit": return "/unit";
    case "per_piece": return "/pc";
    case "per_dozen": return "/dozen";
    default: return "";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  iconHeader: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  iconSubtext: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
  },
  form: {},
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 8,
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
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 22,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.primaryDark,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 22,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
    height: "100%",
  },
  inputHint: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  pricingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pricingOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pricingOptionActive: {
    backgroundColor: Colors.primary + "12",
    borderColor: Colors.primary,
  },
  pricingOptionText: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  pricingOptionTextActive: {
    color: Colors.primary,
  },
  previewCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textLight,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
    lineHeight: 22,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
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
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
});

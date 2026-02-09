import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { saveItem, updateItem, getItems, Item } from "@/lib/storage";

type PricingType = "per_kg" | "per_unit" | "per_piece" | "per_dozen";

const PRICING_OPTIONS: { label: string; value: PricingType }[] = [
  { label: "Per Kg", value: "per_kg" },
  { label: "Per Unit", value: "per_unit" },
  { label: "Per Piece", value: "per_piece" },
  { label: "Per Dozen", value: "per_dozen" },
];

export default function AddItemScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ editId?: string }>();
  const isEditing = !!params.editId;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [pricingType, setPricingType] = useState<PricingType>("per_kg");
  const [quantity, setQuantity] = useState("");
  const [imageUri, setImageUri] = useState("");

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
      setImageUri(item.imageUri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera Permission", "We need camera permission to take photos of items.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Gallery Permission", "We need permission to access your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    if (!imageUri) {
      Alert.alert("No Photo", "Please take or select a photo of the item.");
      return;
    }

    if (isEditing && params.editId) {
      await updateItem(params.editId, {
        name: name.trim(),
        price: parseFloat(price),
        pricingType,
        quantity: quantity.trim() || undefined,
        imageUri,
      });
    } else {
      await saveItem({
        name: name.trim(),
        price: parseFloat(price),
        pricingType,
        quantity: quantity.trim() || undefined,
        imageUri,
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
          <Pressable
            onPress={handleTakePhoto}
            style={[styles.imageContainer, imageUri ? styles.imageContainerFilled : null]}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={48} color={Colors.textLight} />
                <Text style={styles.imagePlaceholderText}>Tap to take photo</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.imageActions}>
            <Pressable onPress={handleTakePhoto} style={styles.imageActionBtn}>
              <Ionicons name="camera-outline" size={20} color={Colors.primary} />
              <Text style={styles.imageActionText}>Camera</Text>
            </Pressable>
            <Pressable onPress={handlePickImage} style={styles.imageActionBtn}>
              <Ionicons name="images-outline" size={20} color={Colors.primary} />
              <Text style={styles.imageActionText}>Gallery</Text>
            </Pressable>
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
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price (INR)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter price"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
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
            </View>
          </View>
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
    </KeyboardAvoidingView>
  );
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
  imageContainer: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  imageContainerFilled: {
    borderStyle: "solid",
    borderColor: Colors.primaryLight,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  imagePlaceholderText: {
    fontSize: 15,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textLight,
  },
  imageActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 12,
    marginBottom: 8,
  },
  imageActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.primary + "10",
  },
  imageActionText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.primary,
  },
  form: {
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 18,
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
  pricingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pricingOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pricingOptionActive: {
    backgroundColor: Colors.primary + "15",
    borderColor: Colors.primary,
  },
  pricingOptionText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  pricingOptionTextActive: {
    color: Colors.primary,
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

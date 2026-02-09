import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import {
  getItems,
  saveBill,
  getSettings,
  formatCurrency,
  getPricingLabel,
  Item,
  BillItem,
} from "@/lib/storage";

interface SelectedItem extends Item {
  billQty: string;
}

export default function CreateBillScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Map<string, string>>(new Map());
  const [customerName, setCustomerName] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [step, setStep] = useState<"items" | "details">("details");

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const data = await getItems();
    setItems(data);
  };

  const toggleItem = (id: string) => {
    const newSelected = new Map(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.set(id, "1");
    }
    setSelected(newSelected);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const updateQty = (id: string, qty: string) => {
    const newSelected = new Map(selected);
    newSelected.set(id, qty);
    setSelected(newSelected);
  };

  const getSelectedItems = (): BillItem[] => {
    return items
      .filter((item) => selected.has(item.id))
      .map((item) => {
        const qty = parseFloat(selected.get(item.id) || "1") || 1;
        return {
          itemId: item.id,
          name: item.name,
          price: item.price,
          pricingType: item.pricingType,
          quantity: qty,
          total: item.price * qty,
          imageUri: item.imageUri,
        };
      });
  };

  const totalAmount = getSelectedItems().reduce((sum, item) => sum + item.total, 0);

  const handleNext = () => {
    if (!customerName.trim()) {
      Alert.alert("Customer Name", "Please enter the customer name.");
      return;
    }
    if (!flatNumber.trim()) {
      Alert.alert("Flat Number", "Please enter the flat number.");
      return;
    }
    if (items.length === 0) {
      Alert.alert("No Items", "Please add items to your catalog first.");
      return;
    }
    setStep("items");
  };

  const handleCreateBill = async () => {
    const billItems = getSelectedItems();
    if (billItems.length === 0) {
      Alert.alert("No Items Selected", "Please select at least one item.");
      return;
    }

    const bill = await saveBill({
      customerName: customerName.trim(),
      flatNumber: flatNumber.trim(),
      items: billItems,
      totalAmount,
      paid: false,
    });

    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: "/bill-detail", params: { billId: bill.id } });
  };

  const renderItemCard = ({ item }: { item: Item }) => {
    const isSelected = selected.has(item.id);
    const qty = selected.get(item.id) || "1";

    return (
      <View style={[styles.itemCard, isSelected && styles.itemCardSelected]}>
        <Pressable
          style={styles.itemMainRow}
          onPress={() => toggleItem(item.id)}
        >
          <Image source={{ uri: item.imageUri }} style={styles.itemImage} contentFit="cover" />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.itemPrice}>
              {formatCurrency(item.price)}{getPricingLabel(item.pricingType)}
            </Text>
          </View>
          <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
            {isSelected && <Ionicons name="checkmark" size={16} color={Colors.white} />}
          </View>
        </Pressable>
        {isSelected && (
          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Qty:</Text>
            <Pressable
              onPress={() => {
                const current = parseFloat(qty) || 1;
                if (current > 0.5) updateQty(item.id, (current - 0.5).toString());
              }}
              style={styles.qtyBtn}
            >
              <Ionicons name="remove" size={16} color={Colors.text} />
            </Pressable>
            <TextInput
              style={styles.qtyInput}
              keyboardType="numeric"
              value={qty}
              onChangeText={(t) => updateQty(item.id, t)}
            />
            <Pressable
              onPress={() => {
                const current = parseFloat(qty) || 0;
                updateQty(item.id, (current + 0.5).toString());
              }}
              style={styles.qtyBtn}
            >
              <Ionicons name="add" size={16} color={Colors.text} />
            </Pressable>
            <Text style={styles.lineTotal}>
              = {formatCurrency(item.price * (parseFloat(qty) || 0))}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (step === "details") {
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
            <Text style={styles.topBarTitle}>New Bill</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.detailsForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Customer Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter customer name"
                placeholderTextColor={Colors.textLight}
                value={customerName}
                onChangeText={setCustomerName}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Flat Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. A-101, B-204"
                placeholderTextColor={Colors.textLight}
                value={flatNumber}
                onChangeText={setFlatNumber}
              />
            </View>
          </View>

          <View style={[styles.bottomBar, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 12 }]}>
            <Pressable
              style={({ pressed }) => [styles.nextBtn, pressed && styles.nextBtnPressed]}
              onPress={handleNext}
            >
              <Text style={styles.nextBtnText}>Select Items</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => setStep("details")} style={styles.closeBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Select Items</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.customerBanner}>
        <Ionicons name="person" size={16} color={Colors.primary} />
        <Text style={styles.customerBannerText}>
          {customerName} | Flat: {flatNumber}
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="leaf-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyText}>No items in catalog. Add items first.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItemCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {selected.size > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 12 }]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{selected.size} items</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.createBtn, pressed && styles.createBtnPressed]}
            onPress={handleCreateBill}
          >
            <Ionicons name="receipt" size={20} color={Colors.white} />
            <Text style={styles.createBtnText}>Generate Bill</Text>
          </Pressable>
        </View>
      )}
    </View>
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
  customerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.primary + "10",
    borderRadius: 10,
    marginBottom: 8,
  },
  customerBannerText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.primary,
  },
  detailsForm: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 160,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "05",
  },
  itemMainRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.primary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  qtyLabel: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyInput: {
    width: 56,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    textAlign: "center",
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  lineTotal: {
    flex: 1,
    textAlign: "right",
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.accent,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 22,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
  },
  nextBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
  createBtn: {
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
  createBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  createBtnText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
    textAlign: "center",
  },
});

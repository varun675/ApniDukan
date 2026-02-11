import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  Animated as RNAnimated,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import {
  getItems,
  saveBill,
  deleteItem,
  formatCurrencyShort,
  getPricingLabel,
  getFlashSaleState,
  Item,
  BillItem,
  FlashSaleState,
} from "@/lib/storage";

const DELETE_THRESHOLD = -80;

function SwipeableBillItem({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const isSwipedRef = useRef(false);
  const [showDelete, setShowDelete] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 15;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -120));
        } else if (isSwipedRef.current) {
          translateX.setValue(Math.min(gestureState.dx + DELETE_THRESHOLD, 0));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < DELETE_THRESHOLD) {
          RNAnimated.spring(translateX, { toValue: DELETE_THRESHOLD, useNativeDriver: false }).start();
          isSwipedRef.current = true;
          setShowDelete(true);
        } else {
          RNAnimated.spring(translateX, { toValue: 0, useNativeDriver: false }).start();
          isSwipedRef.current = false;
          setShowDelete(false);
        }
      },
    })
  ).current;

  const resetSwipe = () => {
    RNAnimated.spring(translateX, { toValue: 0, useNativeDriver: false }).start();
    isSwipedRef.current = false;
    setShowDelete(false);
  };

  return (
    <View style={{ overflow: "hidden" as const, borderRadius: 14, marginBottom: 10 }}>
      <RNAnimated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </RNAnimated.View>
      {showDelete && (
        <Pressable
          style={billSwipeStyles.deleteOverlay}
          onPress={() => {
            resetSwipe();
            onDelete();
          }}
          testID="delete-bill-item-btn"
        >
          <Ionicons name="trash" size={22} color={Colors.white} />
          <Text style={billSwipeStyles.deleteBgText}>Delete</Text>
        </Pressable>
      )}
    </View>
  );
}

const billSwipeStyles = StyleSheet.create({
  deleteOverlay: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#FF3B30",
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    gap: 4,
  },
  deleteBgText: {
    fontSize: 11,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
});

export default function CreateBillScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Map<string, string>>(new Map());
  const [kgValues, setKgValues] = useState<Map<string, { kg: string; grams: string }>>(new Map());
  const [customerName, setCustomerName] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [step, setStep] = useState<"items" | "details">("details");
  const [flashSaleState, setFlashSaleStateData] = useState<FlashSaleState | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const data = await getItems();
    setItems(data);
    const fsState = await getFlashSaleState();
    setFlashSaleStateData(fsState);
  };

  const toggleItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    const newSelected = new Map(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      const newKg = new Map(kgValues);
      newKg.delete(id);
      setKgValues(newKg);
    } else {
      newSelected.set(id, "1");
      if (item?.pricingType === "per_kg") {
        const newKg = new Map(kgValues);
        newKg.set(id, { kg: "1", grams: "0" });
        setKgValues(newKg);
      }
    }
    setSelected(newSelected);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const updateQty = (id: string, qty: string) => {
    const newSelected = new Map(selected);
    newSelected.set(id, qty);
    setSelected(newSelected);
  };

  const updateKgGrams = (id: string, field: "kg" | "grams", value: string) => {
    const newKg = new Map(kgValues);
    const current = newKg.get(id) || { kg: "0", grams: "0" };
    newKg.set(id, { ...current, [field]: value });
    setKgValues(newKg);
    const updated = newKg.get(id)!;
    const kgNum = parseFloat(updated.kg) || 0;
    const gramsNum = parseFloat(updated.grams) || 0;
    const totalKg = kgNum + gramsNum / 1000;
    const newSelected = new Map(selected);
    newSelected.set(id, totalKg.toString());
    setSelected(newSelected);
  };

  const getSelectedItems = (): BillItem[] => {
    return items
      .filter((item) => selected.has(item.id))
      .map((item) => {
        let qty: number;
        if (item.pricingType === "per_kg" && kgValues.has(item.id)) {
          const kv = kgValues.get(item.id)!;
          const kgNum = parseFloat(kv.kg) || 0;
          const gramsNum = parseFloat(kv.grams) || 0;
          qty = kgNum + gramsNum / 1000;
        } else {
          qty = parseFloat(selected.get(item.id) || "1") || 1;
        }
        return {
          itemId: item.id,
          name: item.name,
          price: item.price,
          pricingType: item.pricingType,
          quantity: qty,
          total: item.price * qty,
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

  const handleDeleteItem = async (item: Item) => {
    const doDelete = async () => {
      const newSelected = new Map(selected);
      newSelected.delete(item.id);
      setSelected(newSelected);
      const newKg = new Map(kgValues);
      newKg.delete(item.id);
      setKgValues(newKg);
      await deleteItem(item.id);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadItems();
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(`Remove "${item.name}" from your catalog?`);
      if (confirmed) {
        await doDelete();
      }
    } else {
      Alert.alert("Delete Item", `Remove "${item.name}" from your catalog?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: doDelete,
        },
      ]);
    }
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
    const origPrice = flashSaleState?.originalPrices?.[item.id];
    const isPriceChanged = origPrice !== undefined && origPrice !== item.price;

    return (
      <SwipeableBillItem onDelete={() => handleDeleteItem(item)}>
        <View style={[styles.itemCard, isSelected && styles.itemCardSelected]}>
          <Pressable
            style={styles.itemMainRow}
            onPress={() => toggleItem(item.id)}
          >
            <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
              {isSelected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.priceRow}>
                {isPriceChanged && (
                  <Text style={styles.originalPrice}>{formatCurrencyShort(origPrice)}</Text>
                )}
                <Text style={[styles.itemPrice, isPriceChanged && styles.flashPrice]}>
                  {formatCurrencyShort(item.price)}{getPricingLabel(item.pricingType)}
                </Text>
              </View>
            </View>
          </Pressable>
          {isSelected && item.pricingType === "per_kg" && (
            <View style={styles.qtyRow}>
              <View style={styles.kgGramsRow}>
                <View style={styles.kgGramsGroup}>
                  <TextInput
                    style={styles.kgGramsInput}
                    keyboardType="numeric"
                    value={kgValues.get(item.id)?.kg || "0"}
                    onChangeText={(t) => updateKgGrams(item.id, "kg", t)}
                    selectTextOnFocus
                  />
                  <Text style={styles.kgGramsLabel}>Kg</Text>
                </View>
                <View style={styles.kgGramsGroup}>
                  <TextInput
                    style={styles.kgGramsInput}
                    keyboardType="numeric"
                    value={kgValues.get(item.id)?.grams || "0"}
                    onChangeText={(t) => updateKgGrams(item.id, "grams", t)}
                    selectTextOnFocus
                  />
                  <Text style={styles.kgGramsLabel}>gm</Text>
                </View>
              </View>
              <Text style={styles.lineTotal}>
                = {formatCurrencyShort(item.price * (
                  (parseFloat(kgValues.get(item.id)?.kg || "0") || 0) +
                  (parseFloat(kgValues.get(item.id)?.grams || "0") || 0) / 1000
                ))}
              </Text>
            </View>
          )}
          {isSelected && item.pricingType !== "per_kg" && (
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Qty:</Text>
              <Pressable
                onPress={() => {
                  const current = parseFloat(qty) || 1;
                  if (current > 1) updateQty(item.id, (current - 1).toString());
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
                  updateQty(item.id, (current + 1).toString());
                }}
                style={styles.qtyBtn}
              >
                <Ionicons name="add" size={16} color={Colors.text} />
              </Pressable>
              <Text style={styles.lineTotal}>
                = {formatCurrencyShort(item.price * (parseFloat(qty) || 0))}
              </Text>
            </View>
          )}
        </View>
      </SwipeableBillItem>
    );
  };

  if (step === "details") {
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

      {flashSaleState && (
        <View style={styles.flashSaleBanner}>
          <Ionicons name="flash" size={14} color={Colors.white} />
          <Text style={styles.flashSaleBannerText}>Flash Sale prices active</Text>
        </View>
      )}

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={48} color={Colors.border} />
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
          ListHeaderComponent={
            <Text style={styles.swipeHintText}>Swipe left on any item to delete</Text>
          }
        />
      )}

      {selected.size > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 12 }]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{selected.size} items</Text>
            <Text style={styles.totalValue}>{formatCurrencyShort(totalAmount)}</Text>
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
    backgroundColor: Colors.primary + "12",
    borderRadius: 10,
    marginBottom: 8,
  },
  customerBannerText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.primaryDark,
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
    padding: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.primaryDark,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  originalPrice: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
    textDecorationLine: "line-through",
  },
  flashPrice: {
    color: Colors.flashSale,
    marginTop: 0,
  },
  flashSaleBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.flashSale,
    borderRadius: 10,
    marginBottom: 8,
  },
  flashSaleBannerText: {
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 8,
  },
  kgGramsRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  kgGramsGroup: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  kgGramsInput: {
    width: 52,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    textAlign: "center" as const,
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  kgGramsLabel: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
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
    color: Colors.primaryDark,
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
  swipeHintText: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
    textAlign: "center",
    marginBottom: 10,
  },
});

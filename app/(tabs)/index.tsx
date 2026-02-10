import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Alert,
  Platform,
  Linking,
  RefreshControl,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import {
  getItems,
  deleteItem,
  getSettings,
  getPricingLabel,
  formatCurrencyShort,
  generateWhatsAppMessage,
  getFlashSaleState,
  startFlashSale,
  endFlashSale,
  getFlashSaleRemainingTime,
  Item,
  Settings,
  WhatsAppGroup,
  FlashSaleState,
} from "@/lib/storage";

const FLASH_DURATIONS = [1, 2, 3, 4, 5, 6];

export default function ItemsScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Item[]>([]);
  const [settings, setSettingsData] = useState<Settings | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [flashSale, setFlashSale] = useState(false);
  const [flashDuration, setFlashDuration] = useState(2);
  const [flashSaleState, setFlashSaleStateData] = useState<FlashSaleState | null>(null);
  const [countdown, setCountdown] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareGroupIndex, setShareGroupIndex] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    const data = await getItems();
    setItems(data);
    const s = await getSettings();
    setSettingsData(s);
    const fsState = await getFlashSaleState();
    if (fsState) {
      setFlashSale(true);
      setFlashDuration(fsState.duration);
      setFlashSaleStateData(fsState);
    } else {
      setFlashSale(false);
      setFlashSaleStateData(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    if (flashSale && flashSaleState) {
      const updateCountdown = async () => {
        const remaining = await getFlashSaleRemainingTime();
        if (remaining) {
          setCountdown(`${String(remaining.hours).padStart(2, "0")}:${String(remaining.minutes).padStart(2, "0")}:${String(remaining.seconds).padStart(2, "0")}`);
        } else {
          setCountdown("");
          setFlashSale(false);
          setFlashSaleStateData(null);
          loadData();
          if (countdownRef.current) clearInterval(countdownRef.current);
        }
      };
      updateCountdown();
      countdownRef.current = setInterval(updateCountdown, 1000);
      return () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    } else {
      setCountdown("");
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  }, [flashSale, flashSaleState]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = (item: Item) => {
    Alert.alert("Delete Item", `Remove "${item.name}" from your list?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteItem(item.id);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          loadData();
        },
      },
    ]);
  };

  const shareToWhatsApp = async () => {
    if (items.length === 0) {
      Alert.alert("No Items", "Add some items first to share.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const message = generateWhatsAppMessage(
      items,
      settings?.businessName || "",
      flashSale,
      flashDuration,
      settings?.phoneNumber || undefined,
      settings?.shopAddress || undefined,
    );

    const groups = settings?.whatsappGroups || [];
    if (groups.length > 0) {
      setShareGroupIndex(0);
      setShowShareModal(true);
    } else {
      openWhatsApp(message);
    }
  };

  const openWhatsApp = async (message: string) => {
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      Linking.openURL(whatsappUrl);
    } else {
      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
    }
  };

  const handleShareToGroup = () => {
    const message = generateWhatsAppMessage(
      items,
      settings?.businessName || "",
      flashSale,
      flashDuration,
      settings?.phoneNumber || undefined,
      settings?.shopAddress || undefined,
    );
    openWhatsApp(message);
  };

  const handleNextGroup = () => {
    const groups = settings?.whatsappGroups || [];
    if (shareGroupIndex < groups.length - 1) {
      setShareGroupIndex(shareGroupIndex + 1);
    } else {
      setShowShareModal(false);
    }
  };

  const getOriginalPrice = (itemId: string): number | null => {
    if (!flashSaleState || !flashSaleState.originalPrices[itemId]) return null;
    const orig = flashSaleState.originalPrices[itemId];
    return orig;
  };

  const renderItem = ({ item, index }: { item: Item; index: number }) => {
    const originalPrice = getOriginalPrice(item.id);
    const isPriceChanged = originalPrice !== null && originalPrice !== item.price;

    return (
      <View style={styles.itemRow}>
        <View style={styles.itemNumber}>
          <Text style={styles.itemNumberText}>{index + 1}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.itemCard, pressed && styles.itemCardPressed, flashSaleState && styles.itemCardFlash]}
          onPress={() => router.push({ pathname: "/add-item", params: { editId: item.id } })}
          onLongPress={() => handleDelete(item)}
        >
          <View style={styles.itemMainInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            {item.quantity ? (
              <Text style={styles.itemQty}>{item.quantity} available</Text>
            ) : null}
          </View>
          <View style={styles.itemPriceBox}>
            {isPriceChanged && (
              <Text style={styles.originalPrice}>{formatCurrencyShort(originalPrice)}</Text>
            )}
            <Text style={[styles.itemPrice, isPriceChanged && styles.flashPrice]}>{formatCurrencyShort(item.price)}</Text>
            <Text style={styles.itemUnit}>{getPricingLabel(item.pricingType)}</Text>
          </View>
          <View style={styles.itemActions}>
            <Pressable
              onPress={() => router.push({ pathname: "/add-item", params: { editId: item.id } })}
              hitSlop={8}
            >
              <Ionicons name="create-outline" size={18} color={Colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
            </Pressable>
          </View>
        </Pressable>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="storefront-outline" size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>No items yet</Text>
      <Text style={styles.emptyText}>
        Tap the + button to add items to your daily price list
      </Text>
    </View>
  );

  const groups = settings?.whatsappGroups || [];
  const currentGroup = groups[shareGroupIndex];

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Apni Dukan</Text>
          <Text style={styles.headerSubtitle}>{items.length} items in today's list</Text>
        </View>
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/add-item");
          }}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </Pressable>
      </View>

      {items.length > 0 && (
        <View style={styles.flashSaleBar}>
          {!flashSaleState ? (
            <>
              <Pressable
                onPress={() => {
                  setFlashSale(!flashSale);
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                }}
                style={[styles.flashToggle, flashSale && styles.flashToggleActive]}
              >
                <Ionicons
                  name="flash"
                  size={16}
                  color={flashSale ? Colors.white : Colors.flashSale}
                />
                <Text style={[styles.flashToggleText, flashSale && styles.flashToggleTextActive]}>
                  Flash Sale
                </Text>
              </Pressable>

              {flashSale && (
                <View style={styles.durationRow}>
                  {FLASH_DURATIONS.map((hrs) => (
                    <Pressable
                      key={hrs}
                      onPress={() => {
                        setFlashDuration(hrs);
                        if (Platform.OS !== "web") Haptics.selectionAsync();
                      }}
                      style={[
                        styles.durationChip,
                        flashDuration === hrs && styles.durationChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.durationChipText,
                          flashDuration === hrs && styles.durationChipTextActive,
                        ]}
                      >
                        {hrs}hr
                      </Text>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={async () => {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      const state = await startFlashSale(flashDuration);
                      setFlashSaleStateData(state);
                      Alert.alert(
                        "Flash Sale Started",
                        `Flash sale is now active for ${flashDuration} hour${flashDuration > 1 ? "s" : ""}. You can now update item prices for the sale. Prices will automatically revert when the sale ends.`,
                      );
                    }}
                    style={styles.startFlashBtn}
                  >
                    <Text style={styles.startFlashBtnText}>Start</Text>
                  </Pressable>
                </View>
              )}
            </>
          ) : (
            <View style={styles.flashActiveBar}>
              <View style={styles.flashActiveInfo}>
                <Ionicons name="flash" size={18} color={Colors.white} />
                <Text style={styles.flashActiveText}>Flash Sale Active</Text>
                {countdown ? (
                  <View style={styles.countdownBadge}>
                    <Ionicons name="time-outline" size={14} color={Colors.flashSale} />
                    <Text style={styles.countdownText}>{countdown}</Text>
                  </View>
                ) : null}
              </View>
              <Pressable
                onPress={() => {
                  Alert.alert(
                    "End Flash Sale?",
                    "This will stop the flash sale and revert all prices to their original values.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "End Sale",
                        style: "destructive",
                        onPress: async () => {
                          await endFlashSale();
                          setFlashSale(false);
                          setFlashSaleStateData(null);
                          setCountdown("");
                          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          loadData();
                        },
                      },
                    ],
                  );
                }}
                style={styles.endFlashBtn}
              >
                <Ionicons name="close-circle" size={16} color={Colors.white} />
                <Text style={styles.endFlashBtnText}>End</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={() => items.length > 0 ? (
          <View style={styles.poweredByContainer}>
            <Text style={styles.poweredByText}>Powered by</Text>
            <Text style={styles.poweredByCompany}>Codesmotech Consulting Pvt Ltd</Text>
          </View>
        ) : null}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      />

      {items.length > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 60 }]}>
          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && styles.shareBtnPressed]}
            onPress={shareToWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={22} color={Colors.white} />
            <Text style={styles.shareBtnText}>
              {flashSale ? "Share Flash Sale" : "Share Price List"}
            </Text>
          </Pressable>
        </View>
      )}

      <Modal
        visible={showShareModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="logo-whatsapp" size={28} color={Colors.whatsapp} />
              <Text style={styles.modalTitle}>Share to Groups</Text>
            </View>

            <Text style={styles.modalGroupLabel}>
              Send to group {shareGroupIndex + 1} of {groups.length}:
            </Text>
            <View style={styles.modalGroupBadge}>
              <Ionicons name="people" size={18} color={Colors.primary} />
              <Text style={styles.modalGroupName}>{currentGroup?.name || "Group"}</Text>
            </View>

            <Text style={styles.modalHint}>
              WhatsApp will open. Select the "{currentGroup?.name}" group and send the message.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.modalSendBtn, pressed && { opacity: 0.9 }]}
              onPress={handleShareToGroup}
            >
              <Ionicons name="send" size={18} color={Colors.white} />
              <Text style={styles.modalSendText}>Open WhatsApp</Text>
            </Pressable>

            <View style={styles.modalFooter}>
              {shareGroupIndex < groups.length - 1 ? (
                <Pressable onPress={handleNextGroup} style={styles.modalNextBtn}>
                  <Text style={styles.modalNextText}>
                    Next: {groups[shareGroupIndex + 1]?.name}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                </Pressable>
              ) : (
                <Pressable onPress={() => setShowShareModal(false)} style={styles.modalNextBtn}>
                  <Text style={styles.modalNextText}>Done</Text>
                  <Ionicons name="checkmark" size={16} color={Colors.success} />
                </Pressable>
              )}

              <Pressable onPress={() => setShowShareModal(false)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.primaryDark,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  flashSaleBar: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  flashToggle: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.flashSale + "12",
    borderWidth: 1,
    borderColor: Colors.flashSale + "30",
  },
  flashToggleActive: {
    backgroundColor: Colors.flashSale,
    borderColor: Colors.flashSale,
  },
  flashToggleText: {
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
    color: Colors.flashSale,
  },
  flashToggleTextActive: {
    color: Colors.white,
  },
  durationRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  },
  durationChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  durationChipActive: {
    backgroundColor: Colors.flashSale + "15",
    borderColor: Colors.flashSale,
  },
  durationChipText: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  durationChipTextActive: {
    color: Colors.flashSale,
  },
  startFlashBtn: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.flashSale,
    marginLeft: 4,
  },
  startFlashBtnText: {
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
  flashActiveBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.flashSale,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  flashActiveInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  flashActiveText: {
    fontSize: 14,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countdownText: {
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
    color: Colors.flashSale,
  },
  endFlashBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  endFlashBtnText: {
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
  itemCardFlash: {
    borderColor: Colors.flashSale + "40",
  },
  originalPrice: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
    textDecorationLine: "line-through",
  },
  flashPrice: {
    color: Colors.flashSale,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  listContentEmpty: {
    flex: 1,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  itemNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  itemNumberText: {
    fontSize: 12,
    fontFamily: "Nunito_700Bold",
    color: Colors.primary,
  },
  itemCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemCardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  itemMainInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  itemQty: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
    marginTop: 2,
  },
  itemPriceBox: {
    alignItems: "flex-end",
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 17,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.primaryDark,
  },
  itemUnit: {
    fontSize: 11,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
  },
  itemActions: {
    flexDirection: "row",
    gap: 12,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
  },
  shareBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.whatsapp,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.whatsapp,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  shareBtnText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Nunito_700Bold",
    color: Colors.textSecondary,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
    textAlign: "center",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 360,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
  },
  modalGroupLabel: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  modalGroupBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary + "10",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  modalGroupName: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  modalHint: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalSendBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.whatsapp,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  modalSendText: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalNextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modalNextText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.primary,
  },
  modalCloseText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textLight,
  },
  poweredByContainer: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 8,
    paddingVertical: 12,
  },
  poweredByText: {
    fontSize: 11,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
  },
  poweredByCompany: {
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

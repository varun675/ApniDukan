import React, { useState, useCallback } from "react";
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
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getItems, deleteItem, getPricingLabel, formatCurrency, Item } from "@/lib/storage";

export default function ItemsScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Item[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    const data = await getItems();
    setItems(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const handleDelete = (item: Item) => {
    Alert.alert("Delete Item", `Remove "${item.name}" from your catalog?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteItem(item.id);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          loadItems();
        },
      },
    ]);
  };

  const handleShareAll = async () => {
    if (items.length === 0) {
      Alert.alert("No Items", "Add some items first to share.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let message = "*Today's Fresh Items*\n\n";
    items.forEach((item, idx) => {
      message += `${idx + 1}. *${item.name}* - ${formatCurrency(item.price)}${getPricingLabel(item.pricingType)}`;
      if (item.quantity) message += ` (${item.quantity} available)`;
      message += "\n";
    });
    message += "\n_Sent via FreshCart_";

    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      Linking.openURL(whatsappUrl);
    } else {
      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
    }
  };

  const renderItem = ({ item }: { item: Item }) => (
    <Pressable
      style={({ pressed }) => [styles.itemCard, pressed && styles.itemCardPressed]}
      onLongPress={() => handleDelete(item)}
      onPress={() => router.push({ pathname: "/add-item", params: { editId: item.id } })}
    >
      <Image source={{ uri: item.imageUri }} style={styles.itemImage} contentFit="cover" />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.itemPrice}>
          {formatCurrency(item.price)}
          <Text style={styles.itemUnit}>{getPricingLabel(item.pricingType)}</Text>
        </Text>
        {item.quantity ? (
          <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => handleDelete(item)}
        hitSlop={8}
        style={styles.deleteBtn}
      >
        <Ionicons name="trash-outline" size={18} color={Colors.error} />
      </Pressable>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="leaf-outline" size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>No items yet</Text>
      <Text style={styles.emptyText}>
        Tap the + button to add fruits, vegetables, or other items
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Today's Items</Text>
          <Text style={styles.headerSubtitle}>{items.length} items listed</Text>
        </View>
        <View style={styles.headerActions}>
          {items.length > 0 && (
            <Pressable onPress={handleShareAll} style={styles.headerBtn}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </Pressable>
          )}
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
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      />
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
    paddingVertical: 16,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
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
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flex: 1,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  itemCard: {
    flex: 1,
    margin: 4,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    maxWidth: "48%",
  },
  itemCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  itemImage: {
    width: "100%",
    height: 120,
    backgroundColor: Colors.surfaceElevated,
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  itemPrice: {
    fontSize: 18,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.primary,
    marginTop: 4,
  },
  itemUnit: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
  },
  itemQty: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
    marginTop: 2,
  },
  deleteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
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
});

import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Alert,
  Platform,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getBills, deleteBill, formatCurrency, Bill } from "@/lib/storage";

export default function BillsScreen() {
  const insets = useSafeAreaInsets();
  const [bills, setBills] = useState<Bill[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadBills = useCallback(async () => {
    const data = await getBills();
    setBills(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBills();
    }, [loadBills])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBills();
    setRefreshing(false);
  };

  const handleDelete = (bill: Bill) => {
    Alert.alert("Delete Bill", `Remove bill for "${bill.customerName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteBill(bill.id);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          loadBills();
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderItem = ({ item }: { item: Bill }) => (
    <Pressable
      style={({ pressed }) => [styles.billCard, pressed && styles.billCardPressed]}
      onPress={() => router.push({ pathname: "/bill-detail", params: { billId: item.id } })}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.billHeader}>
        <View style={styles.billIcon}>
          <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
        </View>
        <View style={styles.billMeta}>
          <Text style={styles.billName} numberOfLines={1}>{item.customerName}</Text>
          <Text style={styles.billFlat}>Flat: {item.flatNumber}</Text>
        </View>
        <View style={styles.billRight}>
          <Text style={styles.billTotal}>{formatCurrency(item.totalAmount)}</Text>
          <View style={[styles.statusBadge, item.paid ? styles.paidBadge : styles.unpaidBadge]}>
            <Text style={[styles.statusText, item.paid ? styles.paidText : styles.unpaidText]}>
              {item.paid ? "Paid" : "Pending"}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.billFooter}>
        <Text style={styles.billDate}>{formatDate(item.createdAt)}</Text>
        <Text style={styles.billItems}>{item.items.length} items</Text>
      </View>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>No bills yet</Text>
      <Text style={styles.emptyText}>Create a bill to get started</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bills</Text>
          <Text style={styles.headerSubtitle}>{bills.length} bills generated</Text>
        </View>
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/create-bill");
          }}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </Pressable>
      </View>

      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          bills.length === 0 && styles.listContentEmpty,
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
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flex: 1,
  },
  billCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  billCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  billHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  billIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  billMeta: {
    flex: 1,
    marginLeft: 12,
  },
  billName: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  billFlat: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  billRight: {
    alignItems: "flex-end",
  },
  billTotal: {
    fontSize: 18,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  paidBadge: {
    backgroundColor: Colors.success + "15",
  },
  unpaidBadge: {
    backgroundColor: Colors.warning + "15",
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Nunito_600SemiBold",
  },
  paidText: {
    color: Colors.success,
  },
  unpaidText: {
    color: Colors.warning,
  },
  billFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  billDate: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
  },
  billItems: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
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

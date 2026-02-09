import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  SectionList,
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
import {
  getBills,
  deleteBill,
  formatCurrencyShort,
  groupBillsByDate,
  Bill,
} from "@/lib/storage";

interface DateGroup {
  date: string;
  dateLabel: string;
  bills: Bill[];
}

export default function BillsScreen() {
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [totalBills, setTotalBills] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadBills = useCallback(async () => {
    const data = await getBills();
    setTotalBills(data.length);
    const grouped = groupBillsByDate(data);
    setGroups(grouped);
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
          if (Platform.OS !== "web")
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          loadBills();
        },
      },
    ]);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const sections = groups.map((g) => ({
    title: g.dateLabel,
    count: g.bills.length,
    totalAmount: g.bills.reduce((sum, b) => sum + b.totalAmount, 0),
    data: g.bills,
  }));

  const renderItem = ({ item }: { item: Bill }) => (
    <Pressable
      style={({ pressed }) => [styles.billCard, pressed && styles.billCardPressed]}
      onPress={() =>
        router.push({ pathname: "/bill-detail", params: { billId: item.id } })
      }
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.billHeader}>
        <View style={styles.billIcon}>
          <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
        </View>
        <View style={styles.billMeta}>
          <Text style={styles.billName} numberOfLines={1}>
            {item.customerName}
          </Text>
          <Text style={styles.billFlat}>
            {item.billNumber ? `#${item.billNumber} | ` : ""}Flat: {item.flatNumber} | {formatTime(item.createdAt)}
          </Text>
        </View>
        <View style={styles.billRight}>
          <Text style={styles.billTotal}>
            {formatCurrencyShort(item.totalAmount)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              item.paid ? styles.paidBadge : styles.unpaidBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                item.paid ? styles.paidText : styles.unpaidText,
              ]}
            >
              {item.paid ? "Paid" : "Pending"}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.billFooter}>
        <Text style={styles.billItems}>{item.items.length} items</Text>
        <View style={styles.shareHint}>
          <Ionicons
            name="logo-whatsapp"
            size={14}
            color={Colors.whatsapp}
          />
          <Text style={styles.shareHintText}>Tap to view & share</Text>
        </View>
      </View>
    </Pressable>
  );

  const renderSectionHeader = ({
    section,
  }: {
    section: { title: string; count: number; totalAmount: number };
  }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View style={styles.sectionCountBadge}>
          <Text style={styles.sectionCount}>{section.count}</Text>
        </View>
      </View>
      <Text style={styles.sectionTotal}>
        {formatCurrencyShort(section.totalAmount)}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="document-text-outline"
        size={64}
        color={Colors.border}
      />
      <Text style={styles.emptyTitle}>No bills this week</Text>
      <Text style={styles.emptyText}>
        Bills are stored for 7 days. Create a bill to get started.
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 67 : insets.top },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bills</Text>
          <Text style={styles.headerSubtitle}>
            {totalBills} bills this week | Auto-cleaned after 7 days
          </Text>
        </View>
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web")
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/create-bill");
          }}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </Pressable>
      </View>

      {groups.length > 0 && (
        <View style={styles.weekSummary}>
          <View style={styles.weekSummaryItem}>
            <Text style={styles.weekSummaryValue}>{groups.length}</Text>
            <Text style={styles.weekSummaryLabel}>Days</Text>
          </View>
          <View style={styles.weekSummaryDivider} />
          <View style={styles.weekSummaryItem}>
            <Text style={styles.weekSummaryValue}>{totalBills}</Text>
            <Text style={styles.weekSummaryLabel}>Bills</Text>
          </View>
          <View style={styles.weekSummaryDivider} />
          <View style={styles.weekSummaryItem}>
            <Text style={styles.weekSummaryValue}>
              {formatCurrencyShort(
                groups.reduce(
                  (s, g) =>
                    s + g.bills.reduce((bs, b) => bs + b.totalAmount, 0),
                  0
                )
              )}
            </Text>
            <Text style={styles.weekSummaryLabel}>Total</Text>
          </View>
        </View>
      )}

      {totalBills === 0 ? (
        renderEmpty()
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}
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
    fontSize: 12,
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
  weekSummary: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  weekSummaryItem: {
    flex: 1,
    alignItems: "center",
  },
  weekSummaryValue: {
    fontSize: 18,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.primaryDark,
  },
  weekSummaryLabel: {
    fontSize: 11,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textLight,
    marginTop: 2,
  },
  weekSummaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 8,
  },
  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  sectionCountBadge: {
    backgroundColor: Colors.primary + "18",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionCount: {
    fontSize: 12,
    fontFamily: "Nunito_700Bold",
    color: Colors.primary,
  },
  sectionTotal: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.primaryDark,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  billCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
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
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  billMeta: {
    flex: 1,
    marginLeft: 10,
  },
  billName: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  billFlat: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  billRight: {
    alignItems: "flex-end",
  },
  billTotal: {
    fontSize: 17,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
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
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  billItems: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  shareHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  shareHintText: {
    fontSize: 11,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
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
    lineHeight: 22,
  },
});

import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import {
  getDailyAccount,
  saveDailyAccount,
  getDailyAccounts,
  formatCurrency,
  DailyAccount,
} from "@/lib/storage";

function getDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const today = getDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [account, setAccount] = useState<DailyAccount | null>(null);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmt, setExpenseAmt] = useState("");
  const [saleAmt, setSaleAmt] = useState("");
  const [allAccounts, setAllAccounts] = useState<DailyAccount[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadAccount = useCallback(async () => {
    const data = await getDailyAccount(selectedDate);
    setAccount(data);
    const all = await getDailyAccounts();
    setAllAccounts(all.slice(0, 30));
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadAccount();
    }, [loadAccount])
  );

  const handleAddExpense = async () => {
    if (!expenseDesc.trim() || !expenseAmt.trim()) {
      Alert.alert("Missing Info", "Enter expense description and amount.");
      return;
    }
    const amount = parseFloat(expenseAmt);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Enter a valid amount.");
      return;
    }

    const currentExpenses = account?.expenses || [];
    const newExpenses = [...currentExpenses, { description: expenseDesc.trim(), amount }];
    const totalExpense = newExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalSale = account?.totalSale || 0;

    await saveDailyAccount({
      date: selectedDate,
      expenses: newExpenses,
      totalExpense,
      totalSale,
      profit: totalSale - totalExpense,
    });

    setExpenseDesc("");
    setExpenseAmt("");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadAccount();
  };

  const handleUpdateSale = async () => {
    const amount = parseFloat(saleAmt);
    if (isNaN(amount) || amount < 0) {
      Alert.alert("Invalid Amount", "Enter a valid sale amount.");
      return;
    }

    const currentExpenses = account?.expenses || [];
    const totalExpense = currentExpenses.reduce((sum, e) => sum + e.amount, 0);

    await saveDailyAccount({
      date: selectedDate,
      expenses: currentExpenses,
      totalExpense,
      totalSale: amount,
      profit: amount - totalExpense,
    });

    setSaleAmt("");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadAccount();
  };

  const navigateDate = (direction: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + direction);
    setSelectedDate(getDateStr(d));
  };

  const profit = account ? account.profit : 0;
  const isProfit = profit >= 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Daily Accounts</Text>
        </View>

        <View style={styles.dateNav}>
          <Pressable onPress={() => navigateDate(-1)} style={styles.dateArrow}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
          <Pressable onPress={() => setSelectedDate(today)}>
            <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
            {selectedDate === today && (
              <Text style={styles.todayBadge}>Today</Text>
            )}
          </Pressable>
          <Pressable onPress={() => navigateDate(1)} style={styles.dateArrow}>
            <Ionicons name="chevron-forward" size={22} color={Colors.text} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.expenseCard]}>
              <Ionicons name="arrow-down-circle" size={24} color={Colors.error} />
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryValue, { color: Colors.error }]}>
                {formatCurrency(account?.totalExpense || 0)}
              </Text>
            </View>
            <View style={[styles.summaryCard, styles.saleCard]}>
              <Ionicons name="arrow-up-circle" size={24} color={Colors.success} />
              <Text style={styles.summaryLabel}>Sales</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>
                {formatCurrency(account?.totalSale || 0)}
              </Text>
            </View>
          </View>

          <View style={[styles.profitCard, isProfit ? styles.profitPositive : styles.profitNegative]}>
            <Ionicons
              name={isProfit ? "trending-up" : "trending-down"}
              size={28}
              color={isProfit ? Colors.success : Colors.error}
            />
            <View style={styles.profitInfo}>
              <Text style={styles.profitLabel}>{isProfit ? "Profit" : "Loss"}</Text>
              <Text
                style={[
                  styles.profitValue,
                  { color: isProfit ? Colors.success : Colors.error },
                ]}
              >
                {formatCurrency(Math.abs(profit))}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Expense</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="Description (e.g. Tomatoes purchase)"
                placeholderTextColor={Colors.textLight}
                value={expenseDesc}
                onChangeText={setExpenseDesc}
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="Amount"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
                value={expenseAmt}
                onChangeText={setExpenseAmt}
              />
              <Pressable onPress={handleAddExpense} style={styles.actionBtn}>
                <Ionicons name="add" size={20} color={Colors.white} />
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Sale</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="Total sale amount"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
                value={saleAmt}
                onChangeText={setSaleAmt}
              />
              <Pressable onPress={handleUpdateSale} style={[styles.actionBtn, { backgroundColor: Colors.success }]}>
                <Ionicons name="checkmark" size={20} color={Colors.white} />
              </Pressable>
            </View>
          </View>

          {account && account.expenses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Expenses List</Text>
              {account.expenses.map((exp, idx) => (
                <View key={idx} style={styles.expenseItem}>
                  <Text style={styles.expenseName} numberOfLines={1}>{exp.description}</Text>
                  <Text style={styles.expenseAmount}>{formatCurrency(exp.amount)}</Text>
                </View>
              ))}
            </View>
          )}

          <Pressable
            style={styles.historyToggle}
            onPress={() => setShowHistory(!showHistory)}
          >
            <Text style={styles.historyToggleText}>
              {showHistory ? "Hide History" : "View History"}
            </Text>
            <Ionicons
              name={showHistory ? "chevron-up" : "chevron-down"}
              size={18}
              color={Colors.primary}
            />
          </Pressable>

          {showHistory && allAccounts.length > 0 && (
            <View style={styles.section}>
              {allAccounts.map((acc) => (
                <Pressable
                  key={acc.id}
                  style={styles.historyItem}
                  onPress={() => setSelectedDate(acc.date)}
                >
                  <Text style={styles.historyDate}>{formatDisplayDate(acc.date)}</Text>
                  <View style={styles.historyNumbers}>
                    <Text style={[styles.historyProfit, { color: acc.profit >= 0 ? Colors.success : Colors.error }]}>
                      {acc.profit >= 0 ? "+" : ""}{formatCurrency(acc.profit)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
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
    color: Colors.text,
  },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 16,
  },
  dateArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
    textAlign: "center",
  },
  todayBadge: {
    fontSize: 11,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.primary,
    textAlign: "center",
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
  },
  expenseCard: {
    backgroundColor: Colors.error + "10",
  },
  saleCard: {
    backgroundColor: Colors.success + "10",
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: "Nunito_800ExtraBold",
  },
  profitCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
  },
  profitPositive: {
    backgroundColor: Colors.success + "10",
  },
  profitNegative: {
    backgroundColor: Colors.error + "10",
  },
  profitInfo: {
    flex: 1,
  },
  profitLabel: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  profitValue: {
    fontSize: 24,
    fontFamily: "Nunito_800ExtraBold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
  },
  inputFlex: {
    flex: 1,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 6,
  },
  expenseName: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  expenseAmount: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.error,
  },
  historyToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
  },
  historyToggleText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.primary,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 6,
  },
  historyDate: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
  },
  historyNumbers: {
    alignItems: "flex-end",
  },
  historyProfit: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
  },
});

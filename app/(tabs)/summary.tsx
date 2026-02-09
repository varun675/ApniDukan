import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import {
  getDailyAccounts,
  getBills,
  formatCurrency,
  DailyAccount,
  Bill,
} from "@/lib/storage";

const SCREEN_WIDTH = Dimensions.get("window").width;

type TimeRange = "7days" | "14days" | "30days";

function BarChart({
  data,
  maxValue,
  color,
  label,
}: {
  data: { date: string; value: number }[];
  maxValue: number;
  color: string;
  label: string;
}) {
  const barWidth = Math.max(
    12,
    Math.min(28, (SCREEN_WIDTH - 80) / data.length - 6)
  );
  const chartHeight = 140;

  return (
    <View style={chartStyles.container}>
      <Text style={chartStyles.label}>{label}</Text>
      <View style={chartStyles.chartArea}>
        <View style={chartStyles.barsRow}>
          {data.map((item, idx) => {
            const barHeight =
              maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
            return (
              <View key={idx} style={chartStyles.barColumn}>
                <View
                  style={[
                    chartStyles.barContainer,
                    { height: chartHeight },
                  ]}
                >
                  <View
                    style={[
                      chartStyles.bar,
                      {
                        height: Math.max(barHeight, 2),
                        width: barWidth,
                        backgroundColor: color,
                        borderRadius: barWidth / 4,
                      },
                    ]}
                  />
                </View>
                <Text style={chartStyles.barLabel} numberOfLines={1}>
                  {formatShortDate(item.date)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }).replace(" ", "\n");
}

function StatCard({
  icon,
  iconColor,
  bgColor,
  title,
  value,
  subtitle,
}: {
  icon: string;
  iconColor: string;
  bgColor: string;
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <View style={[statStyles.card, { backgroundColor: bgColor }]}>
      <Ionicons name={icon as any} size={22} color={iconColor} />
      <Text style={statStyles.title}>{title}</Text>
      <Text style={[statStyles.value, { color: iconColor }]}>{value}</Text>
      {subtitle ? <Text style={statStyles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export default function SummaryScreen() {
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<DailyAccount[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("7days");

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const accs = await getDailyAccounts();
    setAccounts(accs);
    const b = await getBills();
    setBills(b);
  };

  const daysCount = timeRange === "7days" ? 7 : timeRange === "14days" ? 14 : 30;

  const dateRange = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  }, [daysCount]);

  const chartData = useMemo(() => {
    const accountMap = new Map<string, DailyAccount>();
    accounts.forEach((a) => accountMap.set(a.date, a));

    const expenses: { date: string; value: number }[] = [];
    const sales: { date: string; value: number }[] = [];
    const profits: { date: string; value: number }[] = [];

    dateRange.forEach((date) => {
      const acc = accountMap.get(date);
      expenses.push({ date, value: acc?.totalExpense || 0 });
      sales.push({ date, value: acc?.totalSale || 0 });
      profits.push({ date, value: acc?.profit || 0 });
    });

    return { expenses, sales, profits };
  }, [accounts, dateRange]);

  const totals = useMemo(() => {
    let totalExpense = 0;
    let totalSale = 0;
    let totalProfit = 0;
    let daysWithData = 0;

    const accountMap = new Map<string, DailyAccount>();
    accounts.forEach((a) => accountMap.set(a.date, a));

    dateRange.forEach((date) => {
      const acc = accountMap.get(date);
      if (acc) {
        totalExpense += acc.totalExpense;
        totalSale += acc.totalSale;
        totalProfit += acc.profit;
        daysWithData++;
      }
    });

    const billsInRange = bills.filter((b) => {
      const billDate = b.createdAt.split("T")[0];
      return dateRange.includes(billDate);
    });

    const avgProfit = daysWithData > 0 ? totalProfit / daysWithData : 0;

    return {
      totalExpense,
      totalSale,
      totalProfit,
      daysWithData,
      billCount: billsInRange.length,
      billTotal: billsInRange.reduce((s, b) => s + b.totalAmount, 0),
      paidBills: billsInRange.filter((b) => b.paid).length,
      unpaidBills: billsInRange.filter((b) => !b.paid).length,
      avgProfit,
    };
  }, [accounts, bills, dateRange]);

  const maxExpense = Math.max(...chartData.expenses.map((d) => d.value), 1);
  const maxSale = Math.max(...chartData.sales.map((d) => d.value), 1);
  const maxChart = Math.max(maxExpense, maxSale);
  const maxProfitAbs = Math.max(
    ...chartData.profits.map((d) => Math.abs(d.value)),
    1
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 67 : insets.top },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Summary</Text>
        <Text style={styles.headerSubtitle}>Business analytics</Text>
      </View>

      <View style={styles.timeRangeRow}>
        {(["7days", "14days", "30days"] as TimeRange[]).map((range) => (
          <Pressable
            key={range}
            onPress={() => setTimeRange(range)}
            style={[
              styles.timeRangeBtn,
              timeRange === range && styles.timeRangeBtnActive,
            ]}
          >
            <Text
              style={[
                styles.timeRangeText,
                timeRange === range && styles.timeRangeTextActive,
              ]}
            >
              {range === "7days"
                ? "7 Days"
                : range === "14days"
                ? "14 Days"
                : "30 Days"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <StatCard
            icon="arrow-down-circle"
            iconColor={Colors.error}
            bgColor={Colors.error + "0D"}
            title="Total Purchase"
            value={formatCurrency(totals.totalExpense)}
            subtitle={`${totals.daysWithData} days recorded`}
          />
          <StatCard
            icon="arrow-up-circle"
            iconColor={Colors.success}
            bgColor={Colors.success + "0D"}
            title="Total Sales"
            value={formatCurrency(totals.totalSale)}
          />
          <StatCard
            icon={totals.totalProfit >= 0 ? "trending-up" : "trending-down"}
            iconColor={totals.totalProfit >= 0 ? Colors.primary : Colors.error}
            bgColor={
              totals.totalProfit >= 0
                ? Colors.primary + "0D"
                : Colors.error + "0D"
            }
            title={totals.totalProfit >= 0 ? "Total Profit" : "Total Loss"}
            value={formatCurrency(Math.abs(totals.totalProfit))}
            subtitle={`Avg ${formatCurrency(Math.abs(totals.avgProfit))}/day`}
          />
          <StatCard
            icon="receipt-outline"
            iconColor={Colors.accent}
            bgColor={Colors.accent + "0D"}
            title="Bills Generated"
            value={totals.billCount.toString()}
            subtitle={`${totals.paidBills} paid, ${totals.unpaidBills} pending`}
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartCardTitle}>Daily Purchases vs Sales</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
              <Text style={styles.legendText}>Purchases</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.legendText}>Sales</Text>
            </View>
          </View>
          <View style={styles.dualChartRow}>
            <View style={styles.dualChartCol}>
              <BarChart
                data={chartData.expenses}
                maxValue={maxChart}
                color={Colors.error}
                label="Purchases"
              />
            </View>
          </View>
          <View style={styles.dualChartRow}>
            <View style={styles.dualChartCol}>
              <BarChart
                data={chartData.sales}
                maxValue={maxChart}
                color={Colors.success}
                label="Sales"
              />
            </View>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartCardTitle}>Daily Profit / Loss</Text>
          <View style={styles.profitChartArea}>
            {chartData.profits.map((item, idx) => {
              const isPositive = item.value >= 0;
              const barHeight =
                maxProfitAbs > 0
                  ? (Math.abs(item.value) / maxProfitAbs) * 60
                  : 0;
              const barWidth = Math.max(
                10,
                Math.min(24, (SCREEN_WIDTH - 100) / chartData.profits.length - 4)
              );
              return (
                <View key={idx} style={styles.profitBarCol}>
                  <View style={styles.profitBarContainer}>
                    {isPositive ? (
                      <View style={styles.profitBarTop}>
                        <View
                          style={[
                            styles.profitBar,
                            {
                              height: Math.max(barHeight, 2),
                              width: barWidth,
                              backgroundColor: Colors.success,
                              borderRadius: barWidth / 4,
                            },
                          ]}
                        />
                      </View>
                    ) : (
                      <View style={styles.profitBarBottom}>
                        <View
                          style={[
                            styles.profitBar,
                            {
                              height: Math.max(barHeight, 2),
                              width: barWidth,
                              backgroundColor: Colors.error,
                              borderRadius: barWidth / 4,
                            },
                          ]}
                        />
                      </View>
                    )}
                  </View>
                  <Text style={styles.profitBarLabel} numberOfLines={1}>
                    {new Date(item.date + "T00:00:00").getDate()}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.profitLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.legendText}>Profit</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
              <Text style={styles.legendText}>Loss</Text>
            </View>
          </View>
        </View>

        {totals.billCount > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartCardTitle}>Bill Summary</Text>
            <View style={styles.billSummaryRow}>
              <View style={styles.billSummaryItem}>
                <Text style={styles.billSummaryValue}>
                  {formatCurrency(totals.billTotal)}
                </Text>
                <Text style={styles.billSummaryLabel}>Total Billed</Text>
              </View>
              <View style={styles.billDivider} />
              <View style={styles.billSummaryItem}>
                <Text
                  style={[styles.billSummaryValue, { color: Colors.success }]}
                >
                  {totals.paidBills}
                </Text>
                <Text style={styles.billSummaryLabel}>Paid</Text>
              </View>
              <View style={styles.billDivider} />
              <View style={styles.billSummaryItem}>
                <Text
                  style={[styles.billSummaryValue, { color: Colors.warning }]}
                >
                  {totals.unpaidBills}
                </Text>
                <Text style={styles.billSummaryLabel}>Pending</Text>
              </View>
            </View>

            <View style={styles.paymentBar}>
              <View
                style={[
                  styles.paymentBarFill,
                  {
                    width:
                      totals.billCount > 0
                        ? `${(totals.paidBills / totals.billCount) * 100}%`
                        : "0%",
                  },
                ]}
              />
            </View>
            <Text style={styles.paymentBarLabel}>
              {totals.billCount > 0
                ? Math.round((totals.paidBills / totals.billCount) * 100)
                : 0}
              % payment collected
            </Text>
          </View>
        )}

        {totals.daysWithData === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons
              name="analytics-outline"
              size={48}
              color={Colors.border}
            />
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptyText}>
              Start recording your daily expenses and sales in the Accounts tab
              to see charts and analytics here
            </Text>
          </View>
        )}
        <View style={styles.poweredByContainer}>
          <Text style={styles.poweredByText}>Powered by</Text>
          <Text style={styles.poweredByCompany}>Codesmotech Consulting Pvt Ltd</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  chartArea: {
    overflow: "hidden",
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
  },
  barColumn: {
    alignItems: "center",
  },
  barContainer: {
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    minHeight: 2,
  },
  barLabel: {
    fontSize: 9,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
    marginTop: 4,
    textAlign: "center",
    width: 32,
  },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "45%",
    padding: 14,
    borderRadius: 16,
    gap: 6,
  },
  title: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 18,
    fontFamily: "Nunito_800ExtraBold",
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
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
  timeRangeRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 12,
  },
  timeRangeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
  },
  timeRangeBtnActive: {
    backgroundColor: Colors.primary,
  },
  timeRangeText: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  timeRangeTextActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartCardTitle: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
  },
  dualChartRow: {
    marginBottom: 4,
  },
  dualChartCol: {
    flex: 1,
  },
  profitChartArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    height: 140,
    paddingTop: 10,
  },
  profitBarCol: {
    alignItems: "center",
  },
  profitBarContainer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  profitBarTop: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  profitBarBottom: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  profitBar: {
    minHeight: 2,
  },
  profitBarLabel: {
    fontSize: 9,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
    marginTop: 4,
  },
  profitLegendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 12,
  },
  billSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  billSummaryItem: {
    alignItems: "center",
    gap: 4,
  },
  billSummaryValue: {
    fontSize: 20,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
  },
  billSummaryLabel: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
  },
  billDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.borderLight,
  },
  paymentBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceElevated,
    overflow: "hidden",
  },
  paymentBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  paymentBarLabel: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 30,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.textLight,
    textAlign: "center",
    lineHeight: 22,
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

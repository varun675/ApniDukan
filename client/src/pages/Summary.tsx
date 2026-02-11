import React, { useState, useEffect, useCallback } from "react";
import {
  IoStatsChart,
  IoReceipt,
  IoCartOutline,
  IoTrendingUp,
  IoTrendingDown,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoBarChart,
} from "react-icons/io5";
import Colors from "@/constants/colors";
import {
  getBills,
  getDailyAccounts,
  formatCurrency,
  formatCurrencyShort,
} from "@/lib/storage";
import type { Bill, DailyAccount } from "@/lib/storage";

export default function SummaryPage() {
  const [range, setRange] = useState(7);
  const [bills, setBills] = useState<Bill[]>([]);
  const [accounts, setAccounts] = useState<DailyAccount[]>([]);

  const loadData = useCallback(() => {
    setBills(getBills());
    setAccounts(getDailyAccounts());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const now = new Date();
  const cutoff = new Date(now.getTime() - range * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const filteredAccounts = accounts.filter((a) => a.date >= cutoffStr);
  const filteredBills = bills.filter(
    (b) => new Date(b.createdAt).toISOString().split("T")[0] >= cutoffStr
  );

  const totalPurchase = filteredAccounts.reduce((s, a) => s + a.totalExpense, 0);
  const totalSales = filteredAccounts.reduce((s, a) => s + a.totalSale, 0);
  const totalProfit = totalSales - totalPurchase;
  const billsGenerated = filteredBills.length;

  const totalBilled = filteredBills.reduce((s, b) => s + b.totalAmount, 0);
  const paidBills = filteredBills.filter((b) => b.paid);
  const pendingBills = filteredBills.filter((b) => !b.paid);
  const paidAmount = paidBills.reduce((s, b) => s + b.totalAmount, 0);
  const collectionPercent = totalBilled > 0 ? (paidAmount / totalBilled) * 100 : 0;

  const dateLabels: string[] = [];
  const dailyPurchases: number[] = [];
  const dailySales: number[] = [];
  const dailyProfit: number[] = [];

  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    dateLabels.push(
      d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    );
    const acc = filteredAccounts.find((a) => a.date === key);
    dailyPurchases.push(acc ? acc.totalExpense : 0);
    dailySales.push(acc ? acc.totalSale : 0);
    dailyProfit.push(acc ? acc.profit : 0);
  }

  const maxPurchaseSale = Math.max(
    ...dailyPurchases,
    ...dailySales,
    1
  );
  const maxProfit = Math.max(...dailyProfit.map(Math.abs), 1);

  const hasData = filteredAccounts.length > 0 || filteredBills.length > 0;

  const statCards = [
    {
      label: "Total Purchase",
      value: formatCurrencyShort(totalPurchase),
      icon: <IoCartOutline size={20} color={Colors.error} />,
      color: Colors.error,
    },
    {
      label: "Total Sales",
      value: formatCurrencyShort(totalSales),
      icon: <IoBarChart size={20} color={Colors.success} />,
      color: Colors.success,
    },
    {
      label: "Total Profit/Loss",
      value: (totalProfit >= 0 ? "+" : "") + formatCurrencyShort(totalProfit),
      icon:
        totalProfit >= 0 ? (
          <IoTrendingUp size={20} color={Colors.success} />
        ) : (
          <IoTrendingDown size={20} color={Colors.error} />
        ),
      color: totalProfit >= 0 ? Colors.success : Colors.error,
    },
    {
      label: "Bills Generated",
      value: billsGenerated.toString(),
      icon: <IoReceipt size={20} color={Colors.primary} />,
      color: Colors.primary,
    },
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Summary</h2>
      <p style={styles.subtitle}>Business analytics</p>

      <div style={styles.rangeRow}>
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            style={{
              ...styles.rangeBtn,
              background: range === d ? Colors.primary : Colors.surface,
              color: range === d ? "#fff" : Colors.text,
            }}
            onClick={() => setRange(d)}
          >
            {d} Days
          </button>
        ))}
      </div>

      {!hasData ? (
        <div style={styles.emptyState}>
          <IoStatsChart size={48} color={Colors.textLight} />
          <p style={styles.emptyText}>
            No data available for the selected period
          </p>
          <p style={styles.emptySubtext}>
            Start tracking your daily accounts and creating bills to see analytics
          </p>
        </div>
      ) : (
        <>
          <div style={styles.statsGrid}>
            {statCards.map((card, idx) => (
              <div key={idx} style={styles.statCard}>
                <div style={styles.statIcon}>{card.icon}</div>
                <span style={styles.statLabel}>{card.label}</span>
                <span style={{ ...styles.statValue, color: card.color }}>
                  {card.value}
                </span>
              </div>
            ))}
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Daily Purchases vs Sales</h3>
            <div style={styles.chartArea}>
              {dateLabels.map((label, idx) => (
                <div key={idx} style={styles.chartCol}>
                  <div style={styles.barsContainer}>
                    <div
                      style={{
                        ...styles.bar,
                        height: `${(dailyPurchases[idx] / maxPurchaseSale) * 100}%`,
                        background: Colors.error,
                        opacity: 0.8,
                      }}
                      title={`Purchase: ${formatCurrencyShort(dailyPurchases[idx])}`}
                    />
                    <div
                      style={{
                        ...styles.bar,
                        height: `${(dailySales[idx] / maxPurchaseSale) * 100}%`,
                        background: Colors.success,
                        opacity: 0.8,
                      }}
                      title={`Sales: ${formatCurrencyShort(dailySales[idx])}`}
                    />
                  </div>
                  <span style={styles.chartLabel}>
                    {range <= 14
                      ? label
                      : idx % 3 === 0
                      ? label
                      : ""}
                  </span>
                </div>
              ))}
            </div>
            <div style={styles.legend}>
              <div style={styles.legendItem}>
                <div
                  style={{
                    ...styles.legendDot,
                    background: Colors.error,
                  }}
                />
                <span style={styles.legendText}>Purchases</span>
              </div>
              <div style={styles.legendItem}>
                <div
                  style={{
                    ...styles.legendDot,
                    background: Colors.success,
                  }}
                />
                <span style={styles.legendText}>Sales</span>
              </div>
            </div>
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Daily Profit / Loss</h3>
            <div style={styles.profitChartArea}>
              <div style={styles.profitZeroLine} />
              {dateLabels.map((label, idx) => {
                const val = dailyProfit[idx];
                const pct = (Math.abs(val) / maxProfit) * 50;
                const isProfit = val >= 0;
                return (
                  <div key={idx} style={styles.profitChartCol}>
                    <div style={styles.profitBarWrapper}>
                      {isProfit ? (
                        <>
                          <div style={styles.profitTopHalf}>
                            <div
                              style={{
                                ...styles.profitBar,
                                height: `${pct}%`,
                                background: Colors.success,
                                alignSelf: "flex-end",
                              }}
                              title={`Profit: ${formatCurrencyShort(val)}`}
                            />
                          </div>
                          <div style={styles.profitBottomHalf} />
                        </>
                      ) : (
                        <>
                          <div style={styles.profitTopHalf} />
                          <div style={styles.profitBottomHalf}>
                            <div
                              style={{
                                ...styles.profitBar,
                                height: `${pct}%`,
                                background: Colors.error,
                                alignSelf: "flex-start",
                              }}
                              title={`Loss: ${formatCurrencyShort(Math.abs(val))}`}
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <span style={styles.chartLabel}>
                      {range <= 14
                        ? label
                        : idx % 3 === 0
                        ? label
                        : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={styles.billSummaryCard}>
            <h3 style={styles.chartTitle}>Bill Summary</h3>
            <div style={styles.billStatRow}>
              <div style={styles.billStat}>
                <span style={styles.billStatLabel}>Total Billed</span>
                <span style={styles.billStatValue}>
                  {formatCurrency(totalBilled)}
                </span>
              </div>
              <div style={styles.billStat}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <IoCheckmarkCircle size={14} color={Colors.success} />
                  <span style={styles.billStatLabel}>Paid</span>
                </div>
                <span style={{ ...styles.billStatValue, color: Colors.success }}>
                  {paidBills.length}
                </span>
              </div>
              <div style={styles.billStat}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <IoTimeOutline size={14} color={Colors.warning} />
                  <span style={styles.billStatLabel}>Pending</span>
                </div>
                <span style={{ ...styles.billStatValue, color: Colors.warning }}>
                  {pendingBills.length}
                </span>
              </div>
            </div>
            <div style={styles.progressContainer}>
              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${collectionPercent}%`,
                  }}
                />
              </div>
              <span style={styles.progressText}>
                {collectionPercent.toFixed(0)}% collected
              </span>
            </div>
          </div>
        </>
      )}

      <p style={styles.footer}>Powered by Codesmotech Consulting Pvt Ltd</p>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: Colors.background,
    fontFamily: "Nunito",
    maxWidth: 480,
    margin: "0 auto",
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    fontFamily: "Nunito",
    fontSize: 24,
    fontWeight: 800,
    color: Colors.text,
    margin: "0 0 4px",
  },
  subtitle: {
    fontFamily: "Nunito",
    fontSize: 14,
    color: Colors.textSecondary,
    margin: "0 0 16px",
  },
  rangeRow: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
  },
  rangeBtn: {
    fontFamily: "Nunito",
    fontSize: 13,
    fontWeight: 700,
    border: `1px solid ${Colors.border}`,
    borderRadius: 10,
    padding: "8px 16px",
    cursor: "pointer",
    flex: 1,
    textAlign: "center" as const,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    background: Colors.surface,
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: "Nunito",
    fontSize: 16,
    fontWeight: 700,
    color: Colors.textSecondary,
    marginTop: 16,
    textAlign: "center" as const,
  },
  emptySubtext: {
    fontFamily: "Nunito",
    fontSize: 13,
    color: Colors.textLight,
    textAlign: "center" as const,
    marginTop: 4,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    background: Colors.surface,
    borderRadius: 14,
    padding: 16,
    boxShadow: `0 2px 8px ${Colors.cardShadow}`,
  },
  statIcon: {
    marginBottom: 8,
  },
  statLabel: {
    display: "block",
    fontFamily: "Nunito",
    fontSize: 12,
    fontWeight: 600,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    display: "block",
    fontFamily: "Nunito",
    fontSize: 18,
    fontWeight: 800,
  },
  chartCard: {
    background: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: `0 2px 8px ${Colors.cardShadow}`,
  },
  chartTitle: {
    fontFamily: "Nunito",
    fontSize: 15,
    fontWeight: 700,
    color: Colors.text,
    margin: "0 0 16px",
  },
  chartArea: {
    display: "flex",
    alignItems: "flex-end",
    height: 140,
    gap: 2,
  },
  chartCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    height: "100%",
  },
  barsContainer: {
    flex: 1,
    display: "flex",
    alignItems: "flex-end",
    gap: 2,
    width: "100%",
    justifyContent: "center",
  },
  bar: {
    width: "40%",
    minWidth: 4,
    borderRadius: "3px 3px 0 0",
    minHeight: 2,
    transition: "height 0.3s ease",
  },
  chartLabel: {
    fontFamily: "Nunito",
    fontSize: 9,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
    overflow: "hidden" as const,
  },
  legend: {
    display: "flex",
    justifyContent: "center",
    gap: 20,
    marginTop: 12,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: "Nunito",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  profitChartArea: {
    display: "flex",
    alignItems: "stretch",
    height: 140,
    gap: 2,
    position: "relative" as const,
  },
  profitZeroLine: {
    position: "absolute" as const,
    top: "50%",
    left: 0,
    right: 0,
    height: 1,
    background: Colors.border,
  },
  profitChartCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  },
  profitBarWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    width: "100%",
  },
  profitTopHalf: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  profitBottomHalf: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  profitBar: {
    width: "60%",
    minWidth: 4,
    borderRadius: 3,
    minHeight: 0,
    transition: "height 0.3s ease",
  },
  billSummaryCard: {
    background: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: `0 2px 8px ${Colors.cardShadow}`,
  },
  billStatRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  billStat: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 4,
  },
  billStatLabel: {
    fontFamily: "Nunito",
    fontSize: 12,
    fontWeight: 600,
    color: Colors.textSecondary,
  },
  billStatValue: {
    fontFamily: "Nunito",
    fontSize: 18,
    fontWeight: 800,
    color: Colors.text,
  },
  progressContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  progressTrack: {
    height: 8,
    background: Colors.borderLight,
    borderRadius: 4,
    overflow: "hidden" as const,
  },
  progressFill: {
    height: "100%",
    background: Colors.success,
    borderRadius: 4,
    transition: "width 0.3s ease",
  },
  progressText: {
    fontFamily: "Nunito",
    fontSize: 12,
    fontWeight: 600,
    color: Colors.textSecondary,
    textAlign: "right" as const,
  },
  footer: {
    textAlign: "center" as const,
    fontFamily: "Nunito",
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 16,
    paddingBottom: 16,
  },
};

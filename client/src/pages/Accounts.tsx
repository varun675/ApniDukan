import React, { useState, useEffect, useCallback } from "react";
import {
  IoChevronBack,
  IoChevronForward,
  IoAdd,
  IoTrendingUp,
  IoTrendingDown,
  IoTrash,
  IoCalendar,
  IoTime,
  IoWallet,
  IoCart,
} from "react-icons/io5";
import Colors from "@/constants/colors";
import {
  getDailyAccount,
  saveDailyAccount,
  getDailyAccounts,
  getBillsForDate,
  formatCurrency,
  formatCurrencyShort,
} from "@/lib/storage";
import type { DailyAccount } from "@/lib/storage";

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AccountsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [account, setAccount] = useState<DailyAccount | null>(null);
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [saleAmount, setSaleAmount] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [allAccounts, setAllAccounts] = useState<DailyAccount[]>([]);

  const dateKey = formatDateKey(selectedDate);
  const isToday = dateKey === formatDateKey(new Date());

  const billsSaleTotal = getBillsForDate(dateKey).reduce((sum, b) => sum + b.totalAmount, 0);

  const loadData = useCallback(() => {
    const acc = getDailyAccount(dateKey);
    setAccount(acc);
    setSaleAmount(acc ? acc.totalSale.toString() : "");
    setAllAccounts(getDailyAccounts().slice(0, 30));
  }, [dateKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const navigateDate = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    if (d <= new Date()) setSelectedDate(d);
  };

  const addExpense = () => {
    const desc = expDesc.trim();
    const amt = parseFloat(expAmount);
    if (!desc || isNaN(amt) || amt <= 0) return;

    const expenses = account ? [...account.expenses] : [];
    expenses.push({ description: desc, amount: amt });
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
    const totalSale = account ? account.totalSale : 0;

    saveDailyAccount({
      date: dateKey,
      expenses,
      totalExpense,
      totalSale,
      profit: totalSale - totalExpense,
    });
    setExpDesc("");
    setExpAmount("");
    loadData();
  };

  const removeExpense = (index: number) => {
    if (!account) return;
    const expenses = account.expenses.filter((_, i) => i !== index);
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

    saveDailyAccount({
      date: dateKey,
      expenses,
      totalExpense,
      totalSale: account.totalSale,
      profit: account.totalSale - totalExpense,
    });
    loadData();
  };

  const updateSale = () => {
    const amt = parseFloat(saleAmount);
    if (isNaN(amt) || amt < 0) return;
    const expenses = account ? account.expenses : [];
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

    saveDailyAccount({
      date: dateKey,
      expenses,
      totalExpense,
      totalSale: amt,
      profit: amt - totalExpense,
    });
    loadData();
  };

  const totalExpense = account ? account.totalExpense : 0;
  const totalSale = account ? account.totalSale : 0;
  const profit = totalSale - totalExpense;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Daily Accounts</h2>

      <div style={styles.dateNav}>
        <button style={styles.navBtn} onClick={() => navigateDate(-1)}>
          <IoChevronBack size={20} color={Colors.text} />
        </button>
        <div style={styles.dateCenter}>
          <span style={styles.dateText}>{formatDateLabel(selectedDate)}</span>
          {isToday && <span style={styles.todayBadge}>Today</span>}
        </div>
        <button
          style={{
            ...styles.navBtn,
            opacity: isToday ? 0.3 : 1,
          }}
          onClick={() => navigateDate(1)}
          disabled={isToday}
        >
          <IoChevronForward size={20} color={Colors.text} />
        </button>
      </div>

      <div style={styles.summaryRow}>
        <div style={{ ...styles.summaryCard, borderLeft: `4px solid ${Colors.error}` }}>
          <div style={styles.summaryIcon}>
            <IoWallet size={18} color={Colors.error} />
          </div>
          <span style={styles.summaryLabel}>Expenses</span>
          <span style={{ ...styles.summaryValue, color: Colors.error }}>
            {formatCurrency(totalExpense)}
          </span>
        </div>
        <div style={{ ...styles.summaryCard, borderLeft: `4px solid ${Colors.success}` }}>
          <div style={styles.summaryIcon}>
            <IoCart size={18} color={Colors.success} />
          </div>
          <span style={styles.summaryLabel}>Sales</span>
          <span style={{ ...styles.summaryValue, color: Colors.success }}>
            {formatCurrency(totalSale)}
          </span>
        </div>
      </div>

      <div
        style={{
          ...styles.profitCard,
          background: profit >= 0 ? "#E8F5E9" : "#FFEBEE",
          borderLeft: `4px solid ${profit >= 0 ? Colors.success : Colors.error}`,
        }}
      >
        {profit >= 0 ? (
          <IoTrendingUp size={24} color={Colors.success} />
        ) : (
          <IoTrendingDown size={24} color={Colors.error} />
        )}
        <div style={styles.profitInfo}>
          <span style={styles.profitLabel}>
            {profit >= 0 ? "Profit" : "Loss"}
          </span>
          <span
            style={{
              ...styles.profitValue,
              color: profit >= 0 ? Colors.success : Colors.error,
            }}
          >
            {formatCurrency(Math.abs(profit))}
          </span>
        </div>
      </div>

      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>Add Expense</h3>
        <div style={styles.inputRow}>
          <input
            type="text"
            placeholder="Description"
            value={expDesc}
            onChange={(e) => setExpDesc(e.target.value)}
            style={{ ...styles.input, flex: 2 }}
            enterKeyHint="next"
            autoComplete="off"
          />
          <input
            type="text"
            inputMode="decimal"
            placeholder="₹ Amount"
            value={expAmount}
            onChange={(e) => setExpAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            style={{ ...styles.input, flex: 1 }}
            enterKeyHint="done"
          />
          <button style={styles.addBtn} onClick={addExpense}>
            <IoAdd size={20} color="#fff" />
          </button>
        </div>
      </div>

      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>Today's Sale</h3>
        {billsSaleTotal > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: "#E8F5E9",
            borderRadius: 8,
            marginBottom: 10,
            fontSize: 13,
            fontFamily: "Nunito",
            color: Colors.success,
            fontWeight: 600,
          }}>
            <IoCart size={16} />
            <span>From bills: {formatCurrencyShort(billsSaleTotal)}</span>
            <button
              onClick={() => {
                setSaleAmount(billsSaleTotal.toString());
                const expenses = account ? account.expenses : [];
                const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
                saveDailyAccount({
                  date: dateKey,
                  expenses,
                  totalExpense,
                  totalSale: billsSaleTotal,
                  profit: billsSaleTotal - totalExpense,
                });
                loadData();
              }}
              style={{
                marginLeft: "auto",
                background: Colors.success,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "Nunito",
                cursor: "pointer",
              }}
            >
              Use this
            </button>
          </div>
        )}
        <div style={styles.inputRow}>
          <input
            type="text"
            inputMode="decimal"
            placeholder="₹ Sale Amount"
            value={saleAmount}
            onChange={(e) => setSaleAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            style={{ ...styles.input, flex: 1 }}
            enterKeyHint="done"
          />
          <button style={styles.updateBtn} onClick={updateSale}>
            Update
          </button>
        </div>
      </div>

      {account && account.expenses.length > 0 && (
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>Expenses</h3>
          {account.expenses.map((exp, idx) => (
            <div key={idx} style={styles.expenseRow}>
              <div style={styles.expenseInfo}>
                <span style={styles.expenseDesc}>{exp.description}</span>
                <span style={styles.expenseAmt}>
                  {formatCurrency(exp.amount)}
                </span>
              </div>
              <button
                style={styles.deleteBtn}
                onClick={() => removeExpense(idx)}
              >
                <IoTrash size={16} color={Colors.error} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        style={styles.historyToggle}
        onClick={() => setShowHistory(!showHistory)}
      >
        <IoTime size={16} color={Colors.primary} />
        <span style={styles.historyToggleText}>
          {showHistory ? "Hide History" : "View History"}
        </span>
      </button>

      {showHistory && (
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>Last 30 Days</h3>
          {allAccounts.length === 0 ? (
            <p style={styles.emptyText}>No records yet</p>
          ) : (
            allAccounts.map((acc) => {
              const d = new Date(acc.date + "T00:00:00");
              const label = d.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              });
              const isSelected = acc.date === dateKey;
              return (
                <div
                  key={acc.id}
                  style={{
                    ...styles.historyRow,
                    background: isSelected ? Colors.surfaceElevated : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setSelectedDate(new Date(acc.date + "T00:00:00"));
                  }}
                >
                  <div style={styles.historyDate}>
                    <IoCalendar size={14} color={Colors.textSecondary} />
                    <span style={styles.historyDateText}>{label}</span>
                  </div>
                  <div style={styles.historyNumbers}>
                    <span style={{ ...styles.historyAmt, color: Colors.error }}>
                      -{formatCurrency(acc.totalExpense)}
                    </span>
                    <span style={{ ...styles.historyAmt, color: Colors.success }}>
                      +{formatCurrency(acc.totalSale)}
                    </span>
                    <span
                      style={{
                        ...styles.historyAmt,
                        fontWeight: 700,
                        color: acc.profit >= 0 ? Colors.success : Colors.error,
                      }}
                    >
                      {acc.profit >= 0 ? "+" : ""}
                      {formatCurrency(acc.profit)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
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
    margin: "0 0 16px",
  },
  dateNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: Colors.surface,
    borderRadius: 14,
    padding: "10px 12px",
    marginBottom: 16,
    boxShadow: `0 2px 8px ${Colors.cardShadow}`,
  },
  navBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 8,
    display: "flex",
    alignItems: "center",
    borderRadius: 8,
  },
  dateCenter: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontFamily: "Nunito",
    fontSize: 15,
    fontWeight: 700,
    color: Colors.text,
  },
  todayBadge: {
    fontFamily: "Nunito",
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    background: Colors.primary,
    padding: "2px 8px",
    borderRadius: 10,
  },
  summaryRow: {
    display: "flex",
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    background: Colors.surface,
    borderRadius: 14,
    padding: 16,
    boxShadow: `0 2px 8px ${Colors.cardShadow}`,
  },
  summaryIcon: {
    marginBottom: 8,
  },
  summaryLabel: {
    display: "block",
    fontFamily: "Nunito",
    fontSize: 12,
    fontWeight: 600,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    display: "block",
    fontFamily: "Nunito",
    fontSize: 20,
    fontWeight: 800,
  },
  profitCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  profitInfo: {
    display: "flex",
    flexDirection: "column" as const,
  },
  profitLabel: {
    fontFamily: "Nunito",
    fontSize: 13,
    fontWeight: 600,
    color: Colors.textSecondary,
  },
  profitValue: {
    fontFamily: "Nunito",
    fontSize: 22,
    fontWeight: 800,
  },
  sectionCard: {
    background: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    boxShadow: `0 2px 8px ${Colors.cardShadow}`,
  },
  sectionTitle: {
    fontFamily: "Nunito",
    fontSize: 15,
    fontWeight: 700,
    color: Colors.text,
    margin: "0 0 12px",
  },
  inputRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  input: {
    fontFamily: "Nunito",
    fontSize: 14,
    padding: "10px 12px",
    border: `1px solid ${Colors.border}`,
    borderRadius: 10,
    outline: "none",
    background: Colors.background,
  },
  addBtn: {
    background: Colors.primary,
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  updateBtn: {
    fontFamily: "Nunito",
    fontSize: 14,
    fontWeight: 700,
    background: Colors.success,
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    cursor: "pointer",
  },
  expenseRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: `1px solid ${Colors.borderLight}`,
  },
  expenseInfo: {
    display: "flex",
    flexDirection: "column" as const,
  },
  expenseDesc: {
    fontFamily: "Nunito",
    fontSize: 14,
    fontWeight: 600,
    color: Colors.text,
  },
  expenseAmt: {
    fontFamily: "Nunito",
    fontSize: 13,
    color: Colors.error,
    fontWeight: 700,
  },
  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 6,
    display: "flex",
    alignItems: "center",
  },
  historyToggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    background: Colors.surfaceElevated,
    border: `1px solid ${Colors.border}`,
    borderRadius: 10,
    padding: "10px 16px",
    cursor: "pointer",
    marginBottom: 16,
  },
  historyToggleText: {
    fontFamily: "Nunito",
    fontSize: 14,
    fontWeight: 600,
    color: Colors.primary,
  },
  historyRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 8px",
    borderRadius: 8,
    borderBottom: `1px solid ${Colors.borderLight}`,
  },
  historyDate: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  historyDateText: {
    fontFamily: "Nunito",
    fontSize: 13,
    fontWeight: 600,
    color: Colors.text,
  },
  historyNumbers: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  historyAmt: {
    fontFamily: "Nunito",
    fontSize: 12,
    fontWeight: 600,
  },
  emptyText: {
    fontFamily: "Nunito",
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center" as const,
    padding: 16,
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

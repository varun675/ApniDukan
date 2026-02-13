import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoAdd,
  IoReceiptOutline,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoSearch,
  IoStorefrontOutline,
} from "react-icons/io5";
import Colors from "@/constants/colors";
import { getBills, formatCurrencyShort } from "@/lib/storage";
import type { Bill } from "@/lib/storage";

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface GroupedBills {
  dateLabel: string;
  bills: Bill[];
}

export default function BillsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const allBills = getBills();

  const groupedBills = useMemo(() => {
    const sorted = [...allBills].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const q = searchQuery.toLowerCase();
    const filtered = sorted.filter((bill) =>
      bill.customerName.toLowerCase().includes(q) ||
      (bill.billNumber && bill.billNumber.toLowerCase().includes(q))
    );

    const groups = new Map<string, Bill[]>();
    filtered.forEach((bill) => {
      const label = getDateLabel(bill.createdAt);
      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)!.push(bill);
    });

    return Array.from(groups.entries()).map(([dateLabel, bills]) => ({
      dateLabel,
      bills,
    }));
  }, [allBills, searchQuery]);

  const handleBillClick = (bill: Bill) => {
    navigate(`/bill-detail?billId=${bill.id}`);
  };

  const isEmpty = allBills.length === 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>Bills</h1>
            <div style={styles.countBadge}>{allBills.length}</div>
          </div>
          <button
            style={styles.createBtn}
            onClick={() => navigate("/create-bill")}
            title="Create Bill"
          >
            <IoAdd size={24} color="#fff" />
          </button>
        </div>

        {/* Search Bar */}
        <div style={styles.searchContainer}>
          <IoSearch size={18} color={Colors.textLight} />
          <input
            type="text"
            placeholder="Search by name or bill number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Content */}
      {isEmpty ? (
        <div style={styles.emptyState}>
          <IoReceiptOutline size={48} color={Colors.textLight} />
          <p style={styles.emptyText}>No bills yet</p>
          <p style={styles.emptySubtext}>
            Create your first bill to get started
          </p>
        </div>
      ) : groupedBills.length === 0 ? (
        <div style={styles.emptyState}>
          <IoSearch size={48} color={Colors.textLight} />
          <p style={styles.emptyText}>No bills found</p>
          <p style={styles.emptySubtext}>Try searching with a different name</p>
        </div>
      ) : (
        <div style={styles.scrollArea}>
          {groupedBills.map((group) => (
            <div key={group.dateLabel} style={styles.group}>
              <h3 style={styles.dateLabel}>{group.dateLabel}</h3>
              {group.bills.map((bill) => (
                <div
                  key={bill.id}
                  style={styles.billCard}
                  onClick={() => handleBillClick(bill)}
                >
                  {/* Bill Header */}
                  <div style={styles.billHeader}>
                    <div style={styles.billInfo}>
                      <p style={styles.billNumber}>#{bill.billNumber}</p>
                      <p style={styles.customerName}>{bill.customerName}</p>
                      {bill.flatNumber && (
                        <p style={styles.flatNumber}>
                          🏠 {bill.flatNumber}
                        </p>
                      )}
                    </div>
                    <div style={styles.billMeta}>
                      <div
                        style={{
                          ...styles.statusBadge,
                          background: bill.paid
                            ? Colors.success
                            : Colors.warning,
                        }}
                      >
                        {bill.paid ? (
                          <IoCheckmarkCircle
                            size={14}
                            color="#fff"
                            style={{ marginRight: 4 }}
                          />
                        ) : (
                          <IoTimeOutline
                            size={14}
                            color="#fff"
                            style={{ marginRight: 4 }}
                          />
                        )}
                        <span style={styles.statusText}>
                          {bill.paid ? "Paid" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bill Details */}
                  <div style={styles.billDetails}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Items:</span>
                      <span style={styles.detailValue}>{bill.items.length}</span>
                    </div>
                    <div style={styles.detailDivider}>•</div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Total:</span>
                      <span style={styles.detailValue}>
                        {formatCurrencyShort(bill.totalAmount)}
                      </span>
                    </div>
                    <div style={styles.detailDivider}>•</div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Time:</span>
                      <span style={styles.detailValue}>
                        {new Date(bill.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>Powered by Codesmotech Consulting Pvt Ltd</p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: Colors.background,
    fontFamily: "'Nunito', sans-serif",
  },

  header: {
    background: Colors.surface,
    borderBottom: `1px solid ${Colors.border}`,
    padding: "16px",
    flex: "0 0 auto",
  },

  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: Colors.text,
    margin: 0,
    fontFamily: "'Nunito', sans-serif",
  },

  countBadge: {
    background: Colors.primary,
    color: Colors.white,
    borderRadius: "12px",
    padding: "4px 12px",
    fontSize: "14px",
    fontWeight: "600",
    minWidth: "32px",
    textAlign: "center",
  },

  createBtn: {
    background: Colors.primary,
    border: "none",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 0.2s",
    flex: "0 0 auto",
  },

  searchContainer: {
    display: "flex",
    alignItems: "center",
    background: Colors.background,
    borderRadius: "8px",
    padding: "8px 12px",
    gap: "8px",
    border: `1px solid ${Colors.borderLight}`,
  },

  searchInput: {
    flex: 1,
    border: "none",
    background: "transparent",
    fontSize: "14px",
    fontFamily: "'Nunito', sans-serif",
    color: Colors.text,
    outline: "none",
  },

  scrollArea: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  group: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  dateLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: Colors.textSecondary,
    margin: "0 0 4px 0",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontFamily: "'Nunito', sans-serif",
  },

  billCard: {
    background: Colors.surface,
    borderRadius: "12px",
    padding: "12px",
    border: `1px solid ${Colors.borderLight}`,
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  billHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },

  billInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  billNumber: {
    fontSize: "13px",
    fontWeight: "600",
    color: Colors.primary,
    margin: 0,
    fontFamily: "'Nunito', sans-serif",
  },

  customerName: {
    fontSize: "15px",
    fontWeight: "600",
    color: Colors.text,
    margin: 0,
    fontFamily: "'Nunito', sans-serif",
  },

  flatNumber: {
    fontSize: "13px",
    color: Colors.textSecondary,
    margin: 0,
    fontFamily: "'Nunito', sans-serif",
  },

  billMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "flex-end",
  },

  statusBadge: {
    display: "flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    color: Colors.white,
  },

  statusText: {
    fontFamily: "'Nunito', sans-serif",
  },

  billDetails: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: Colors.textSecondary,
    paddingTop: "4px",
    borderTop: `1px solid ${Colors.borderLight}`,
  },

  detailItem: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
  },

  detailLabel: {
    color: Colors.textLight,
    fontSize: "11px",
    fontWeight: "500",
    fontFamily: "'Nunito', sans-serif",
  },

  detailValue: {
    color: Colors.text,
    fontWeight: "600",
    fontFamily: "'Nunito', sans-serif",
  },

  detailDivider: {
    color: Colors.borderLight,
    fontSize: "10px",
  },

  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "32px 16px",
  },

  emptyText: {
    fontSize: "18px",
    fontWeight: "600",
    color: Colors.text,
    margin: 0,
    fontFamily: "'Nunito', sans-serif",
  },

  emptySubtext: {
    fontSize: "14px",
    color: Colors.textLight,
    margin: 0,
    textAlign: "center",
    fontFamily: "'Nunito', sans-serif",
  },

  footer: {
    background: Colors.surface,
    borderTop: `1px solid ${Colors.border}`,
    padding: "12px 16px",
    flex: "0 0 auto",
    textAlign: "center",
  },

  footerText: {
    fontSize: "11px",
    color: Colors.textLight,
    margin: 0,
    fontFamily: "'Nunito', sans-serif",
  },
};

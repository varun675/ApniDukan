import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  IoClose,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoLogoWhatsapp,
  IoWarning,
  IoReceipt,
  IoPerson,
  IoHome,
  IoCalendar,
  IoCart,
} from "react-icons/io5";
import { QRCodeSVG } from "qrcode.react";
import Colors from "@/constants/colors";
import {
  getBills,
  getSettings,
  updateBill,
  formatCurrencyShort,
  getPricingLabel,
  generateUPILink,
  generatePaymentPageUrl,
} from "@/lib/storage";
import type { Bill, Settings } from "@/lib/storage";

export default function BillDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const billId = searchParams.get("billId");

  const [bill, setBill] = useState<Bill | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const bills = getBills();
    const found = bills.find((b) => b.id === billId);
    setBill(found || null);
    setSettings(getSettings());
  }, [billId]);

  const togglePaid = () => {
    if (!bill) return;
    const newPaid = !bill.paid;
    updateBill(bill.id, { paid: newPaid });
    setBill({ ...bill, paid: newPaid });
  };

  const buildBillMessage = (): string => {
    if (!bill || !settings) return "";
    const date = new Date(bill.createdAt);
    const dateStr = date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const businessName = settings.businessName || "Apni Dukan";

    let msg = `🧾✨ *${businessName}* ✨🧾\n`;
    msg += `${"─".repeat(30)}\n`;
    msg += `📋 *BILL #${bill.billNumber}*\n`;
    msg += `📅 ${dateStr} | 🕐 ${timeStr}\n\n`;

    msg += `👤 *Customer:* ${bill.customerName}\n`;
    if (bill.flatNumber) msg += `🏠 *Flat/Address:* ${bill.flatNumber}\n`;
    msg += `\n${"━".repeat(30)}\n`;
    msg += `🛒 *ITEMS PURCHASED*\n`;
    msg += `${"━".repeat(30)}\n\n`;

    bill.items.forEach((item, idx) => {
      const label = getPricingLabel(item.pricingType);
      msg += `${idx + 1}. *${item.name}*\n`;
      msg += `     ${item.quantity} x 💰₹${formatCurrencyShort(item.price).replace("₹", "")}${label}\n`;
      msg += `     ✅ *💰₹${formatCurrencyShort(item.total).replace("₹", "")}*\n`;
      if (idx < bill.items.length - 1) msg += `\n`;
    });

    msg += `\n${"━".repeat(30)}\n\n`;
    msg += `💵💵 *GRAND TOTAL: 💰₹${formatCurrencyShort(bill.totalAmount).replace("₹", "")}* 💵💵\n\n`;
    msg += `📌 Status: ${bill.paid ? "✅ *PAID* - Thank You! 🙏" : "⏳ *PAYMENT PENDING*"}\n\n`;

    if (settings.upiId) {
      const payUrl = generatePaymentPageUrl(
        settings.upiId,
        businessName,
        bill.totalAmount,
        `Bill ${bill.billNumber}`
      );
      msg += `${"━".repeat(30)}\n`;
      if (!bill.paid) {
        msg += `📱💳 *PAY ONLINE (UPI):*\n\n`;
        msg += `👇 _Tap below to pay 💰₹${formatCurrencyShort(bill.totalAmount).replace("₹", "")} instantly_\n`;
      } else {
        msg += `📱💳 *PAYMENT LINK:*\n\n`;
      }
      msg += `🔗 ${payUrl}\n\n`;
      msg += `✅ _PhonePe / GPay / Paytm - any UPI app!_\n\n`;
    }

    if (settings.phoneNumber) {
      msg += `📞 Questions? Call: *${settings.phoneNumber}*\n\n`;
    }

    msg += `${"─".repeat(30)}\n`;
    msg += `💚 _Thank you for shopping with us!_ 💚\n`;
    msg += `🙏 _Aapka bharosa hi hamari taakat hai_\n\n`;
    msg += `_Powered by *${businessName}*_ 🏪`;
    return msg;
  };

  const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: blob.type || "image/png" });
  };

  const handleWhatsAppShare = async () => {
    if (!bill || !settings) return;
    const billMsg = buildBillMessage();
    const hasQr = !!settings.qrCodeImage;

    if (hasQr) {
      try {
        const qrFile = await dataUrlToFile(settings.qrCodeImage!, `payment-qr-${bill.billNumber}.png`);
        const businessName = settings.businessName || "Apni Dukan";
        const qrCaption = `📱💳 *${businessName} - Payment QR Code*\n\n🧾 Bill #${bill.billNumber}\n💰 Amount: ₹${formatCurrencyShort(bill.totalAmount).replace("₹", "")}\n\n👆 _Scan this QR code to pay via any UPI app_`;

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [qrFile] })) {
          await navigator.share({
            text: qrCaption,
            files: [qrFile],
          });
          setTimeout(() => {
            window.open(`https://wa.me/?text=${encodeURIComponent(billMsg)}`, "_blank");
          }, 1000);
        } else {
          const link = document.createElement("a");
          link.href = settings.qrCodeImage!;
          link.download = `payment-qr-${bill.billNumber}.png`;
          link.click();
          window.alert("QR code image downloaded! Now sharing the bill message on WhatsApp...");
          window.open(`https://wa.me/?text=${encodeURIComponent(billMsg)}`, "_blank");
        }
      } catch (err) {
        window.open(`https://wa.me/?text=${encodeURIComponent(billMsg)}`, "_blank");
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(billMsg)}`, "_blank");
    }
  };

  if (!bill) {
    return (
      <div style={styles.container}>
        <div style={styles.topBar}>
          <button style={styles.closeBtn} onClick={() => navigate(-1)}>
            <IoClose size={24} color={Colors.text} />
          </button>
          <h2 style={styles.title}>Bill Details</h2>
          <div style={{ width: 40 }} />
        </div>
        <div style={styles.emptyState}>
          <IoReceipt size={48} color={Colors.textLight} />
          <p style={{ color: Colors.textLight, marginTop: 12, fontFamily: "Nunito" }}>
            Bill not found
          </p>
        </div>
      </div>
    );
  }

  const date = new Date(bill.createdAt);
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const businessName = settings?.businessName || "Apni Dukan";
  const hasQrImage = !!settings?.qrCodeImage;
  const hasUpiId = !!settings?.upiId;

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button style={styles.closeBtn} onClick={() => navigate(-1)}>
          <IoClose size={24} color={Colors.text} />
        </button>
        <h2 style={styles.title}>Bill Details</h2>
        <button
          style={{
            ...styles.paidToggle,
            background: bill.paid ? Colors.success : Colors.warning,
          }}
          onClick={togglePaid}
        >
          {bill.paid ? (
            <IoCheckmarkCircle size={16} color="#fff" />
          ) : (
            <IoTimeOutline size={16} color="#fff" />
          )}
          <span style={styles.paidToggleText}>
            {bill.paid ? "Paid" : "Pending"}
          </span>
        </button>
      </div>

      <div style={styles.scrollArea}>
        <div style={styles.billCard}>
          <div style={styles.billCardHeader}>
            <span style={styles.businessName}>{businessName}</span>
            <span
              style={{
                ...styles.statusBadge,
                background: bill.paid ? "#E8F5E9" : "#FFF3E0",
                color: bill.paid ? Colors.success : Colors.warning,
              }}
            >
              {bill.paid ? "Paid" : "Pending"}
            </span>
          </div>
          <div style={styles.billMeta}>
            <div style={styles.metaRow}>
              <IoReceipt size={14} color={Colors.textSecondary} />
              <span style={styles.metaText}>#{bill.billNumber}</span>
            </div>
            <div style={styles.metaRow}>
              <IoPerson size={14} color={Colors.textSecondary} />
              <span style={styles.metaText}>{bill.customerName}</span>
            </div>
            {bill.flatNumber && (
              <div style={styles.metaRow}>
                <IoHome size={14} color={Colors.textSecondary} />
                <span style={styles.metaText}>{bill.flatNumber}</span>
              </div>
            )}
            <div style={styles.metaRow}>
              <IoCalendar size={14} color={Colors.textSecondary} />
              <span style={styles.metaText}>{dateStr}</span>
            </div>
            <div style={styles.metaRow}>
              <IoCart size={14} color={Colors.textSecondary} />
              <span style={styles.metaText}>
                {bill.items.length} item{bill.items.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>Items</h3>
          {bill.items.map((item, idx) => {
            const label = getPricingLabel(item.pricingType);
            return (
              <div key={idx} style={styles.itemRow}>
                <span style={styles.itemNumber}>{idx + 1}.</span>
                <div style={styles.itemDetails}>
                  <span style={styles.itemName}>{item.name}</span>
                  <span style={styles.itemCalc}>
                    {item.quantity} x {formatCurrencyShort(item.price)}
                    {label}
                  </span>
                </div>
                <span style={styles.itemTotal}>
                  {formatCurrencyShort(item.total)}
                </span>
              </div>
            );
          })}
          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>Total Amount</span>
            <span style={styles.totalValue}>
              {formatCurrencyShort(bill.totalAmount)}
            </span>
          </div>
        </div>

        {hasQrImage ? (
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>Payment QR Code</h3>
            <div style={styles.qrContainer}>
              <img
                src={settings!.qrCodeImage!}
                alt="Payment QR"
                style={styles.qrImage}
              />
            </div>
            {hasUpiId && (
              <div style={styles.upiBox}>
                <span style={styles.upiLabel}>UPI ID</span>
                <span style={styles.upiValue}>{settings!.upiId}</span>
              </div>
            )}
          </div>
        ) : hasUpiId ? (
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>Payment QR Code</h3>
            <div style={styles.qrContainer}>
              <QRCodeSVG
                value={generateUPILink(
                  settings!.upiId,
                  businessName,
                  bill.totalAmount,
                  `Bill ${bill.billNumber}`
                )}
                size={180}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
            <div style={styles.upiBox}>
              <span style={styles.upiLabel}>UPI ID</span>
              <span style={styles.upiValue}>{settings!.upiId}</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              ...styles.sectionCard,
              background: "#FFF3E0",
              borderLeft: `4px solid ${Colors.warning}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IoWarning size={20} color={Colors.warning} />
              <span
                style={{
                  fontFamily: "Nunito",
                  fontWeight: 600,
                  color: Colors.warning,
                }}
              >
                No UPI Setup
              </span>
            </div>
            <p
              style={{
                fontFamily: "Nunito",
                fontSize: 13,
                color: Colors.textSecondary,
                margin: "8px 0 0",
              }}
            >
              Add your UPI ID or upload a QR code in Settings to enable payment
              collection.
            </p>
          </div>
        )}

        <button style={styles.whatsappBtn} onClick={handleWhatsAppShare}>
          <IoLogoWhatsapp size={20} color="#fff" />
          <span style={styles.whatsappBtnText}>Share on WhatsApp</span>
        </button>

        <p style={styles.footer}>Powered by Codesmotech Consulting Pvt Ltd</p>
      </div>
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
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px",
    background: Colors.surface,
    borderBottom: `1px solid ${Colors.border}`,
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 8,
    display: "flex",
    alignItems: "center",
  },
  title: {
    fontFamily: "Nunito",
    fontSize: 18,
    fontWeight: 700,
    color: Colors.text,
    margin: 0,
  },
  paidToggle: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    border: "none",
    borderRadius: 20,
    padding: "6px 14px",
    cursor: "pointer",
  },
  paidToggleText: {
    fontFamily: "Nunito",
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
  },
  scrollArea: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: 64,
  },
  billCard: {
    background: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: `0 2px 8px ${Colors.cardShadow}`,
  },
  billCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  businessName: {
    fontFamily: "Nunito",
    fontSize: 18,
    fontWeight: 800,
    color: Colors.primary,
  },
  statusBadge: {
    fontFamily: "Nunito",
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: 12,
  },
  billMeta: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontFamily: "Nunito",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sectionCard: {
    background: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: `0 2px 8px ${Colors.cardShadow}`,
  },
  sectionTitle: {
    fontFamily: "Nunito",
    fontSize: 16,
    fontWeight: 700,
    color: Colors.text,
    margin: "0 0 16px",
  },
  itemRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "10px 0",
    borderBottom: `1px solid ${Colors.borderLight}`,
  },
  itemNumber: {
    fontFamily: "Nunito",
    fontSize: 14,
    fontWeight: 700,
    color: Colors.textSecondary,
    minWidth: 24,
  },
  itemDetails: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
  },
  itemName: {
    fontFamily: "Nunito",
    fontSize: 14,
    fontWeight: 600,
    color: Colors.text,
  },
  itemCalc: {
    fontFamily: "Nunito",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemTotal: {
    fontFamily: "Nunito",
    fontSize: 14,
    fontWeight: 700,
    color: Colors.text,
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTop: `2px solid ${Colors.primary}`,
  },
  totalLabel: {
    fontFamily: "Nunito",
    fontSize: 16,
    fontWeight: 700,
    color: Colors.text,
  },
  totalValue: {
    fontFamily: "Nunito",
    fontSize: 20,
    fontWeight: 800,
    color: Colors.primary,
  },
  qrContainer: {
    display: "flex",
    justifyContent: "center",
    padding: 20,
    background: "#fff",
    borderRadius: 12,
    marginBottom: 12,
  },
  qrImage: {
    width: 180,
    height: 180,
    objectFit: "contain" as const,
  },
  upiBox: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "10px 16px",
    background: Colors.surfaceElevated,
    borderRadius: 8,
    gap: 2,
  },
  upiLabel: {
    fontFamily: "Nunito",
    fontSize: 11,
    fontWeight: 600,
    color: Colors.textLight,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  upiValue: {
    fontFamily: "Nunito",
    fontSize: 14,
    fontWeight: 700,
    color: Colors.text,
  },
  whatsappBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "14px 24px",
    background: Colors.whatsapp,
    color: "#fff",
    border: "none",
    borderRadius: 14,
    cursor: "pointer",
    marginBottom: 24,
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "Nunito",
  },
  whatsappBtnText: {
    fontFamily: "Nunito",
    fontSize: 15,
    fontWeight: 700,
    color: "#fff",
  },
  footer: {
    textAlign: "center" as const,
    fontFamily: "Nunito",
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 8,
    paddingBottom: 16,
  },
};

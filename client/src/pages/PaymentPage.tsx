import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";

function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function buildUpiUrl(pa: string, pn: string, am: string, tn: string): string {
  const params = new URLSearchParams({ pa, pn, am, cu: "INR" });
  if (tn) params.set("tn", tn);
  return `upi://pay?${params.toString()}`;
}

function openPhonePe(pa: string, pn: string, am: string, tn: string) {
  const upiUrl = buildUpiUrl(pa, pn, am, tn);
  if (isIOS()) {
    window.location.href = `phonepe://pay?${new URLSearchParams({ pa, pn, am, cu: "INR", ...(tn ? { tn } : {}) }).toString()}`;
  } else {
    window.location.href = `intent://pay?${new URLSearchParams({ pa, pn, am, cu: "INR", ...(tn ? { tn } : {}) }).toString()}#Intent;scheme=phonepe;package=com.phonepe.app;end`;
  }
}

function openGooglePay(pa: string, pn: string, am: string, tn: string) {
  if (isIOS()) {
    window.location.href = `tez://upi/pay?${new URLSearchParams({ pa, pn, am, cu: "INR", ...(tn ? { tn } : {}) }).toString()}`;
  } else {
    window.location.href = `intent://pay#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user;end`;
  }
}

function openPaytm(pa: string, pn: string, am: string, tn: string) {
  if (isIOS()) {
    window.location.href = `paytmmp://pay?${new URLSearchParams({ pa, pn, am, cu: "INR", ...(tn ? { tn } : {}) }).toString()}`;
  } else {
    window.location.href = `intent://pay?${new URLSearchParams({ pa, pn, am, cu: "INR", ...(tn ? { tn } : {}) }).toString()}#Intent;scheme=paytmmp;package=net.one97.paytm;end`;
  }
}

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);

  const pa = searchParams.get("pa") || "";
  const pn = searchParams.get("pn") || "Shop";
  const am = searchParams.get("am") || "";
  const tn = searchParams.get("tn") || "";

  if (!pa || !am) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: "center" as const, padding: "40px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ color: "#D32F2F", margin: "0 0 8px 0", fontSize: 20 }}>Invalid payment link</h2>
            <p style={{ color: "#666", margin: 0, fontSize: 14 }}>
              This payment link is missing required information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = pa;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.shopIcon}>🏪</div>
          <h1 style={styles.shopName}>{pn}</h1>
          {tn && <p style={styles.note}>{tn}</p>}
        </div>

        <div style={styles.amountSection}>
          <span style={styles.amountLabel}>Amount to Pay</span>
          <div style={styles.amount}>₹{parseFloat(am).toFixed(2)}</div>
        </div>

        <div style={styles.divider} />

        <div style={styles.appsSection}>
          <p style={styles.appsLabel}>Pay using</p>
          <div style={styles.appsRow}>
            <button
              style={{ ...styles.appButton, ...styles.phonePeBtn }}
              onClick={() => openPhonePe(pa, pn, am, tn)}
            >
              PhonePe
            </button>
            <button
              style={{ ...styles.appButton, ...styles.gpayBtn }}
              onClick={() => openGooglePay(pa, pn, am, tn)}
            >
              Google Pay
            </button>
            <button
              style={{ ...styles.appButton, ...styles.paytmBtn }}
              onClick={() => openPaytm(pa, pn, am, tn)}
            >
              Paytm
            </button>
          </div>
        </div>

        <div style={styles.divider} />

        <div style={styles.upiSection}>
          <p style={styles.upiLabel}>Or copy UPI ID</p>
          <div style={styles.upiRow}>
            <span style={styles.upiId}>{pa}</span>
            <button style={styles.copyBtn} onClick={handleCopy}>
              {copied ? "Copied!" : "Copy UPI ID"}
            </button>
          </div>
        </div>

        <div style={styles.footer}>
          Secure UPI payment · Powered by Codesmotech Consulting Pvt Ltd
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #FF8F00 0%, #E65100 50%, #BF360C 100%)",
    padding: 16,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    background: "#FFFFFF",
    borderRadius: 16,
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
  },
  header: {
    textAlign: "center",
    padding: "28px 24px 16px",
  },
  shopIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  shopName: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1A1A1A",
    margin: "0 0 4px 0",
  },
  note: {
    fontSize: 14,
    color: "#666666",
    margin: 0,
  },
  amountSection: {
    textAlign: "center",
    padding: "8px 24px 24px",
  },
  amountLabel: {
    fontSize: 13,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 1,
    display: "block",
    marginBottom: 4,
  },
  amount: {
    fontSize: 40,
    fontWeight: 800,
    color: "#E65100",
  },
  divider: {
    height: 1,
    background: "#F0E0D0",
    margin: "0 24px",
  },
  appsSection: {
    padding: "20px 24px",
  },
  appsLabel: {
    fontSize: 14,
    color: "#666666",
    margin: "0 0 12px 0",
    textAlign: "center",
  },
  appsRow: {
    display: "flex",
    gap: 10,
  },
  appButton: {
    flex: 1,
    padding: "12px 8px",
    border: "none",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: "#FFFFFF",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  phonePeBtn: {
    background: "#5F259F",
  },
  gpayBtn: {
    background: "#4285F4",
  },
  paytmBtn: {
    background: "#00BAF2",
  },
  upiSection: {
    padding: "20px 24px",
  },
  upiLabel: {
    fontSize: 14,
    color: "#666666",
    margin: "0 0 10px 0",
    textAlign: "center",
  },
  upiRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#FFF8F0",
    borderRadius: 10,
    padding: "10px 14px",
    border: "1px solid #F0E0D0",
  },
  upiId: {
    flex: 1,
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  copyBtn: {
    padding: "8px 16px",
    background: "#2E7D32",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  footer: {
    textAlign: "center",
    padding: "16px 24px",
    fontSize: 11,
    color: "#999999",
    borderTop: "1px solid #F0E0D0",
  },
};

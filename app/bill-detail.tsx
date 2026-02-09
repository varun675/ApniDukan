import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  Linking,
  Image,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import QRCode from "react-native-qrcode-svg";
import Colors from "@/constants/colors";
import {
  getBills,
  getSettings,
  updateBill,
  formatCurrencyShort,
  getPricingLabel,
  generateUPILink,
  generatePaymentPageUrl,
  Bill,
  Settings,
} from "@/lib/storage";

export default function BillDetailScreen() {
  const insets = useSafeAreaInsets();
  const { billId } = useLocalSearchParams<{ billId: string }>();
  const [bill, setBill] = useState<Bill | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    loadData();
  }, [billId]);

  const loadData = async () => {
    const bills = await getBills();
    const found = bills.find((b) => b.id === billId);
    setBill(found || null);
    const s = await getSettings();
    setSettings(s);
  };

  const handleTogglePaid = async () => {
    if (!bill) return;
    await updateBill(bill.id, { paid: !bill.paid });
    setBill({ ...bill, paid: !bill.paid });
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleShareWhatsApp = async () => {
    if (!bill || !settings) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const name = settings.businessName || "Apni Dukan";

    const payUpiId = settings.phonepeUpiId || settings.gpayUpiId || settings.upiId || "";
    const payLink = payUpiId ? generatePaymentPageUrl(payUpiId, name, bill.totalAmount) : "";

    let message = `\uD83D\uDCCB *Bill from ${name}*\n\n`;
    message += `\uD83D\uDC64 *Customer:* ${bill.customerName}\n`;
    message += `\uD83C\uDFE0 *Flat:* ${bill.flatNumber}\n`;
    message += `\uD83D\uDCC5 *Date:* ${new Date(bill.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}\n`;
    message += `\n${"━".repeat(28)}\n`;
    message += `\uD83D\uDED2 *Items Purchased:*\n\n`;

    bill.items.forEach((item, idx) => {
      message += `${idx + 1}. *${item.name}*\n`;
      message += `   ${item.quantity} x ${formatCurrencyShort(item.price)}${getPricingLabel(item.pricingType)} = *${formatCurrencyShort(item.total)}*\n\n`;
    });

    message += `${"━".repeat(28)}\n`;
    message += `\uD83D\uDCB0 *Total: ${formatCurrencyShort(bill.totalAmount)}*\n\n`;

    if (payLink || settings.upiId) {
      message += `\uD83D\uDCB3 *Pay Now:* ${formatCurrencyShort(bill.totalAmount)}\n\n`;

      if (payLink) {
        message += `\u261D\uFE0F *Tap to pay (PhonePe / GPay / Paytm / any UPI):*\n`;
        message += `${payLink}\n\n`;
      }

      if (settings.upiId) {
        message += `UPI ID: *${settings.upiId}*\n`;
      }
    }

    if (settings.shopAddress) {
      message += `\n\uD83D\uDCCD *Address:* ${settings.shopAddress}\n`;
    }
    if (settings.phoneNumber) {
      message += `\uD83D\uDCDE *Contact:* ${settings.phoneNumber}\n`;
    }
    if (settings.shopAddress || settings.phoneNumber) {
      message += `\n`;
    }

    message += `\u2728 _Thank you for shopping with ${name}!_ \u2728`;

    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
    }

    if (settings.qrCodeImage && Platform.OS !== "web") {
      try {
        let fileUri = "";
        if (settings.qrCodeImage.startsWith("data:")) {
          const base64Data = settings.qrCodeImage.split(",")[1];
          const qrFile = new File(Paths.cache, "payment_qr.jpg");
          const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
          const writer = qrFile.writableStream().getWriter();
          await writer.write(bytes);
          await writer.close();
          fileUri = qrFile.uri;
        } else {
          fileUri = settings.qrCodeImage;
        }

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          setTimeout(async () => {
            try {
              await Sharing.shareAsync(fileUri, {
                mimeType: "image/jpeg",
                dialogTitle: "Share Payment QR Code",
              });
            } catch {}
          }, 1500);
        }
      } catch {}
    }
  };

  const handleOpenUPI = async () => {
    const upiIdToUse = settings?.phonepeUpiId || settings?.gpayUpiId || settings?.upiId;
    if (!bill || !upiIdToUse) {
      Alert.alert("No UPI ID", "Please set your UPI ID in Settings first.");
      return;
    }
    const upiLink = generateUPILink(upiIdToUse, settings?.businessName || "Apni Dukan", bill.totalAmount);
    try {
      await Linking.openURL(upiLink);
    } catch {
      Alert.alert("UPI App", "No UPI app found. Share the payment link via WhatsApp instead.");
    }
  };

  if (!bill) {
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.topBarTitle}>Bill</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading bill...</Text>
        </View>
      </View>
    );
  }

  const hasUploadedQR = !!settings?.qrCodeImage;
  const primaryUpiId = settings?.phonepeUpiId || settings?.gpayUpiId || settings?.upiId || "";
  const hasUpiId = !!primaryUpiId;
  const upiLink = hasUpiId
    ? generateUPILink(primaryUpiId, settings?.businessName || "Apni Dukan", bill.totalAmount)
    : "";

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Bill Details</Text>
        <Pressable onPress={handleTogglePaid} style={styles.closeBtn}>
          <Ionicons
            name={bill.paid ? "checkmark-circle" : "checkmark-circle-outline"}
            size={24}
            color={bill.paid ? Colors.success : Colors.textLight}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.billCard}>
          <View style={styles.billHeader}>
            <Text style={styles.businessName}>{settings?.businessName || "Apni Dukan"}</Text>
            <View style={[styles.statusBadge, bill.paid ? styles.paidBadge : styles.unpaidBadge]}>
              <Text style={[styles.statusText, bill.paid ? styles.paidText : styles.unpaidText]}>
                {bill.paid ? "Paid" : "Pending"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.customerRow}>
            <View style={styles.customerDetail}>
              <Text style={styles.detailLabel}>Customer</Text>
              <Text style={styles.detailValue}>{bill.customerName}</Text>
            </View>
            <View style={styles.customerDetail}>
              <Text style={styles.detailLabel}>Flat No.</Text>
              <Text style={styles.detailValue}>{bill.flatNumber}</Text>
            </View>
          </View>
          <View style={styles.customerRow}>
            <View style={styles.customerDetail}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date(bill.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.customerDetail}>
              <Text style={styles.detailLabel}>Items</Text>
              <Text style={styles.detailValue}>{bill.items.length}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Items</Text>
          {bill.items.map((item, idx) => (
            <View key={idx} style={styles.billItemRow}>
              <View style={styles.billItemNumber}>
                <Text style={styles.billItemNumberText}>{idx + 1}</Text>
              </View>
              <View style={styles.billItemInfo}>
                <Text style={styles.billItemName}>{item.name}</Text>
                <Text style={styles.billItemQty}>
                  {item.quantity} x {formatCurrencyShort(item.price)}{getPricingLabel(item.pricingType)}
                </Text>
              </View>
              <Text style={styles.billItemTotal}>{formatCurrencyShort(item.total)}</Text>
            </View>
          ))}

          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatCurrencyShort(bill.totalAmount)}</Text>
          </View>
        </View>

        {(hasUploadedQR || hasUpiId) ? (
          <View style={styles.paymentCard}>
            <Text style={styles.paymentTitle}>Payment</Text>

            {hasUploadedQR ? (
              <View style={styles.qrImageContainer}>
                <Image
                  source={{ uri: settings!.qrCodeImage }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
            ) : hasUpiId ? (
              <View style={styles.qrContainer}>
                <QRCode
                  value={upiLink}
                  size={180}
                  color={Colors.text}
                  backgroundColor={Colors.white}
                />
              </View>
            ) : null}

            <Text style={styles.qrHint}>Scan QR code to pay {formatCurrencyShort(bill.totalAmount)}</Text>

            {hasUpiId && (
              <View style={styles.upiDetailsBox}>
                <Text style={styles.upiLabel}>UPI ID</Text>
                <Text style={styles.upiIdText}>{primaryUpiId}</Text>
              </View>
            )}

            {hasUpiId && Platform.OS !== "web" && (
              <Pressable
                style={({ pressed }) => [styles.upiBtn, pressed && { opacity: 0.9 }]}
                onPress={handleOpenUPI}
              >
                <Ionicons name="wallet-outline" size={20} color={Colors.white} />
                <Text style={styles.upiBtnText}>Pay {formatCurrencyShort(bill.totalAmount)}</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.noUpiCard}>
            <Ionicons name="alert-circle-outline" size={24} color={Colors.warning} />
            <Text style={styles.noUpiText}>
              Upload your payment QR code or set your UPI ID in Settings to enable payment collection
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [styles.whatsappBtn, pressed && styles.whatsappBtnPressed]}
          onPress={handleShareWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={22} color={Colors.white} />
          <Text style={styles.whatsappBtnText}>Send via WhatsApp</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  billCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  businessName: {
    fontSize: 20,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.primaryDark,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paidBadge: {
    backgroundColor: Colors.success + "15",
  },
  unpaidBadge: {
    backgroundColor: Colors.warning + "15",
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Nunito_700Bold",
  },
  paidText: {
    color: Colors.success,
  },
  unpaidText: {
    color: Colors.warning,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 16,
  },
  customerRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  customerDetail: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textLight,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
    marginBottom: 12,
  },
  billItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  billItemNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  billItemNumberText: {
    fontSize: 12,
    fontFamily: "Nunito_700Bold",
    color: Colors.primary,
  },
  billItemInfo: {
    flex: 1,
  },
  billItemName: {
    fontSize: 14,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  billItemQty: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  billItemTotal: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  totalDivider: {
    height: 2,
    backgroundColor: Colors.primary + "20",
    marginTop: 16,
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 24,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.primaryDark,
  },
  paymentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    alignItems: "center",
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  paymentTitle: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
    marginBottom: 16,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  qrImageContainer: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.white,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  qrImage: {
    width: "100%",
    height: 240,
  },
  qrHint: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
    marginTop: 12,
  },
  upiDetailsBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
  },
  upiLabel: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textLight,
  },
  upiIdText: {
    fontSize: 14,
    fontFamily: "Nunito_700Bold",
    color: Colors.primaryDark,
  },
  upiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#5C2D91",
    marginTop: 16,
  },
  upiBtnText: {
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
  noUpiCard: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: Colors.warning + "10",
    borderRadius: 14,
    marginTop: 16,
    alignItems: "flex-start",
  },
  noUpiText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  whatsappBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.whatsapp,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.whatsapp,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  whatsappBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  whatsappBtnText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
});

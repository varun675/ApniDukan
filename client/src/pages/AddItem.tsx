import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoClose, IoCheckmark, IoPricetag } from "react-icons/io5";
import Colors from "@/constants/colors";
import {
  getItems,
  saveItem,
  updateItem,
  getPricingLabel,
  formatCurrencyShort,
} from "@/lib/storage";
import type { Item } from "@/lib/storage";

type PricingType = "per_kg" | "per_unit" | "per_piece" | "per_dozen";

const PRICING_OPTIONS: { label: string; value: PricingType }[] = [
  { label: "Per Kg", value: "per_kg" },
  { label: "Per Unit", value: "per_unit" },
  { label: "Per Piece", value: "per_piece" },
  { label: "Per Dozen", value: "per_dozen" },
];

export default function AddItemPage() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("editId");
  const isEditing = !!editId;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [pricingType, setPricingType] = useState<PricingType>("per_kg");
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    if (editId) {
      const items = getItems();
      const item = items.find((i) => i.id === editId);
      if (item) {
        setName(item.name);
        setPrice(item.price.toString());
        setPricingType(item.pricingType);
        setQuantity(item.quantity || "");
      }
    }
  }, [editId]);

  const handleSave = () => {
    if (!name.trim()) {
      window.alert("Please enter the item name.");
      return;
    }
    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      window.alert("Please enter a valid price.");
      return;
    }

    if (isEditing && editId) {
      updateItem(editId, {
        name: name.trim(),
        price: parseFloat(price),
        pricingType,
        quantity: quantity.trim() || undefined,
      });
    } else {
      saveItem({
        name: name.trim(),
        price: parseFloat(price),
        pricingType,
        quantity: quantity.trim() || undefined,
      });
    }

    navigate(-1);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <button style={styles.closeBtn} onClick={() => navigate(-1)}>
            <IoClose size={24} color={Colors.text} />
          </button>
          <span style={styles.topBarTitle}>{isEditing ? "Edit Item" : "Add Item"}</span>
          <div style={{ width: 40 }} />
        </div>

        <div style={styles.scrollContent}>
          <div style={styles.iconHeader}>
            <div style={styles.iconCircle}>
              <IoPricetag size={32} color={Colors.primary} />
            </div>
            <p style={styles.iconSubtext}>
              {isEditing ? "Update item details" : "Add a new item to your price list"}
            </p>
          </div>

          <div style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Item Name</label>
              <input
                style={styles.input}
                placeholder="e.g. Tomatoes, Mangoes, Coconut"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus={!isEditing}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Price (INR)</label>
              <div style={styles.priceInputRow}>
                <span style={styles.currencySymbol}>{"\u20B9"}</span>
                <input
                  style={styles.priceInput}
                  placeholder="0"
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Pricing Type</label>
              <div style={styles.pricingRow}>
                {PRICING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPricingType(opt.value)}
                    style={{
                      ...styles.pricingOption,
                      ...(pricingType === opt.value ? styles.pricingOptionActive : {}),
                    }}
                  >
                    <span
                      style={{
                        ...styles.pricingOptionText,
                        ...(pricingType === opt.value ? styles.pricingOptionTextActive : {}),
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Available Quantity (optional)</label>
              <input
                style={styles.input}
                placeholder="e.g. 50 kg, 100 pieces"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <p style={styles.inputHint}>
                This will show up in the WhatsApp message if filled
              </p>
            </div>
          </div>

          {name.trim() && price.trim() && (
            <div style={styles.previewCard}>
              <p style={styles.previewLabel}>Preview in message:</p>
              <p style={styles.previewText}>
                {"\uD83D\uDCB0"} *{name.trim()}* - {"\u20B9"}{price}{getPricingLabel(pricingType)}
                {quantity.trim() ? ` | ${quantity.trim()} available` : ""}
              </p>
            </div>
          )}
        </div>

        <div style={styles.bottomBar}>
          <button style={styles.saveBtn} onClick={handleSave}>
            <IoCheckmark size={22} color={Colors.white} />
            <span style={styles.saveBtnText}>{isEditing ? "Update Item" : "Add Item"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    backgroundColor: Colors.background,
    display: "flex",
    justifyContent: "center",
  },
  container: {
    width: "100%",
    maxWidth: 480,
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: Colors.background,
  },
  topBar: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
  },
  topBarTitle: {
    fontSize: 18,
    fontFamily: "Nunito",
    fontWeight: 700,
    color: Colors.text,
  },
  scrollContent: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "0 20px 24px",
  },
  iconHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + "12",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  iconSubtext: {
    fontSize: 14,
    fontFamily: "Nunito",
    fontWeight: 400,
    color: Colors.textSecondary,
    margin: 0,
  },
  form: {},
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Nunito",
    fontWeight: 600,
    color: Colors.textSecondary,
    marginBottom: 8,
    display: "block",
  },
  input: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    border: `1px solid ${Colors.border}`,
    padding: "0 16px",
    fontSize: 16,
    fontFamily: "Nunito",
    color: Colors.text,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  priceInputRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    border: `1px solid ${Colors.border}`,
    padding: "0 16px",
  },
  currencySymbol: {
    fontSize: 22,
    fontFamily: "Nunito",
    fontWeight: 800,
    color: Colors.primaryDark,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 22,
    fontFamily: "Nunito",
    fontWeight: 700,
    color: Colors.text,
    height: "100%",
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    width: "100%",
  },
  inputHint: {
    fontSize: 12,
    fontFamily: "Nunito",
    fontWeight: 400,
    color: Colors.textLight,
    marginTop: 6,
    paddingLeft: 4,
    margin: "6px 0 0",
  },
  pricingRow: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pricingOption: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: "10px 14px",
    borderRadius: 12,
    backgroundColor: Colors.surface,
    border: `1px solid ${Colors.border}`,
    cursor: "pointer",
  },
  pricingOptionActive: {
    backgroundColor: Colors.primary + "12",
    borderColor: Colors.primary,
  },
  pricingOptionText: {
    fontSize: 13,
    fontFamily: "Nunito",
    fontWeight: 600,
    color: Colors.textSecondary,
  },
  pricingOptionTextActive: {
    color: Colors.primary,
  },
  previewCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 16,
    border: `1px solid ${Colors.border}`,
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontFamily: "Nunito",
    fontWeight: 600,
    color: Colors.textLight,
    marginBottom: 8,
    margin: "0 0 8px",
  },
  previewText: {
    fontSize: 14,
    fontFamily: "Nunito",
    fontWeight: 400,
    color: Colors.text,
    lineHeight: "22px",
    margin: 0,
  },
  bottomBar: {
    padding: "12px 20px 24px",
    backgroundColor: Colors.background,
    borderTop: `1px solid ${Colors.borderLight}`,
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "none",
    cursor: "pointer",
    width: "100%",
    boxShadow: `0 4px 8px ${Colors.primary}4D`,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Nunito",
    fontWeight: 700,
    color: Colors.white,
  },
};

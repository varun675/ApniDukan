import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoClose,
  IoCheckmark,
  IoArrowBack,
  IoArrowForward,
  IoAdd,
  IoRemove,
  IoTrash,
  IoReceipt,
  IoFlash,
  IoPerson,
  IoStorefrontOutline,
} from "react-icons/io5";
import Colors from "@/constants/colors";
import {
  getItems,
  saveBill,
  deleteItem,
  formatCurrencyShort,
  getPricingLabel,
  getFlashSaleState,
} from "@/lib/storage";
import type { Item, BillItem, FlashSaleState } from "@/lib/storage";

export default function CreateBillPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Map<string, string>>(new Map());
  const [kgValues, setKgValues] = useState<Map<string, { kg: string; grams: string }>>(new Map());
  const [customerName, setCustomerName] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [step, setStep] = useState<"details" | "items">("details");
  const [flashSaleState, setFlashSaleStateData] = useState<FlashSaleState | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = () => {
    const data = getItems();
    setItems(data);
    const fsState = getFlashSaleState();
    setFlashSaleStateData(fsState);
  };

  const toggleItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    const newSelected = new Map(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      const newKg = new Map(kgValues);
      newKg.delete(id);
      setKgValues(newKg);
    } else {
      newSelected.set(id, "1");
      if (item?.pricingType === "per_kg") {
        const newKg = new Map(kgValues);
        newKg.set(id, { kg: "1", grams: "0" });
        setKgValues(newKg);
      }
    }
    setSelected(newSelected);
  };

  const updateQty = (id: string, qty: string) => {
    const newSelected = new Map(selected);
    newSelected.set(id, qty);
    setSelected(newSelected);
  };

  const updateKgGrams = (id: string, field: "kg" | "grams", value: string) => {
    const newKg = new Map(kgValues);
    const current = newKg.get(id) || { kg: "0", grams: "0" };
    newKg.set(id, { ...current, [field]: value });
    setKgValues(newKg);
    const updated = newKg.get(id)!;
    const kgNum = parseFloat(updated.kg) || 0;
    const gramsNum = parseFloat(updated.grams) || 0;
    const totalKg = kgNum + gramsNum / 1000;
    const newSelected = new Map(selected);
    newSelected.set(id, totalKg.toString());
    setSelected(newSelected);
  };

  const getSelectedItems = (): BillItem[] => {
    return items
      .filter((item) => selected.has(item.id))
      .map((item) => {
        let qty: number;
        if (item.pricingType === "per_kg" && kgValues.has(item.id)) {
          const kv = kgValues.get(item.id)!;
          const kgNum = parseFloat(kv.kg) || 0;
          const gramsNum = parseFloat(kv.grams) || 0;
          qty = kgNum + gramsNum / 1000;
        } else {
          qty = parseFloat(selected.get(item.id) || "1") || 1;
        }
        return {
          itemId: item.id,
          name: item.name,
          price: item.price,
          pricingType: item.pricingType,
          quantity: qty,
          total: item.price * qty,
        };
      });
  };

  const totalAmount = getSelectedItems().reduce((sum, item) => sum + item.total, 0);

  const handleNext = () => {
    if (!customerName.trim()) {
      window.alert("Please enter the customer name.");
      return;
    }
    if (!flatNumber.trim()) {
      window.alert("Please enter the flat number.");
      return;
    }
    if (items.length === 0) {
      window.alert("Please add items to your catalog first.");
      return;
    }
    setStep("items");
  };

  const handleDeleteItem = (item: Item) => {
    if (window.confirm(`Remove "${item.name}" from your catalog?`)) {
      const newSelected = new Map(selected);
      newSelected.delete(item.id);
      setSelected(newSelected);
      const newKg = new Map(kgValues);
      newKg.delete(item.id);
      setKgValues(newKg);
      deleteItem(item.id);
      loadItems();
    }
  };

  const handleCreateBill = () => {
    const billItems = getSelectedItems();
    if (billItems.length === 0) {
      window.alert("Please select at least one item.");
      return;
    }

    const bill = saveBill({
      customerName: customerName.trim(),
      flatNumber: flatNumber.trim(),
      items: billItems,
      totalAmount,
      paid: false,
    });

    navigate(`/bill-detail?billId=${bill.id}`, { replace: true });
  };

  if (step === "details") {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.topBar}>
            <button style={styles.closeBtn} onClick={() => navigate(-1)}>
              <IoClose size={24} color={Colors.text} />
            </button>
            <span style={styles.topBarTitle}>New Bill</span>
            <div style={{ width: 40 }} />
          </div>

          <div style={styles.detailsForm}>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Customer Name</label>
              <input
                style={styles.input}
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                autoFocus
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Flat Number</label>
              <input
                style={styles.input}
                placeholder="e.g. A-101, B-204"
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.bottomBar}>
            <button style={styles.nextBtn} onClick={handleNext}>
              <span style={styles.nextBtnText}>Select Items</span>
              <IoArrowForward size={20} color={Colors.white} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <button style={styles.closeBtn} onClick={() => setStep("details")}>
            <IoArrowBack size={24} color={Colors.text} />
          </button>
          <span style={styles.topBarTitle}>Select Items</span>
          <div style={{ width: 40 }} />
        </div>

        <div style={styles.customerBanner}>
          <IoPerson size={16} color={Colors.primary} />
          <span style={styles.customerBannerText}>
            {customerName} | Flat: {flatNumber}
          </span>
        </div>

        {flashSaleState && (
          <div style={styles.flashSaleBanner}>
            <IoFlash size={14} color={Colors.white} />
            <span style={styles.flashSaleBannerText}>Flash Sale prices active</span>
          </div>
        )}

        {items.length === 0 ? (
          <div style={styles.emptyContainer}>
            <IoStorefrontOutline size={48} color={Colors.border} />
            <p style={styles.emptyText}>No items in catalog. Add items first.</p>
          </div>
        ) : (
          <div style={styles.listContent}>
            <p style={styles.hintText}>Hover over items to see delete option</p>
            {items.map((item) => {
              const isSelected = selected.has(item.id);
              const qty = selected.get(item.id) || "1";
              const origPrice = flashSaleState?.originalPrices?.[item.id];
              const isPriceChanged = origPrice !== undefined && origPrice !== item.price;
              const isHovered = hoveredItemId === item.id;

              return (
                <div
                  key={item.id}
                  style={{
                    ...styles.itemCard,
                    ...(isSelected ? styles.itemCardSelected : {}),
                    position: "relative" as const,
                  }}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                >
                  <div
                    style={styles.itemMainRow}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div style={{ ...styles.checkbox, ...(isSelected ? styles.checkboxActive : {}) }}>
                      {isSelected && <IoCheckmark size={14} color={Colors.white} />}
                    </div>
                    <div style={styles.itemInfo}>
                      <span style={styles.itemName}>{item.name}</span>
                      <div style={styles.priceRow}>
                        {isPriceChanged && (
                          <span style={styles.originalPrice}>{formatCurrencyShort(origPrice)}</span>
                        )}
                        <span style={{ ...styles.itemPrice, ...(isPriceChanged ? styles.flashPrice : {}) }}>
                          {formatCurrencyShort(item.price)}{getPricingLabel(item.pricingType)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isHovered && (
                    <button
                      style={styles.deleteHoverBtn}
                      onClick={(e) => { e.stopPropagation(); handleDeleteItem(item); }}
                    >
                      <IoTrash size={16} color={Colors.white} />
                    </button>
                  )}

                  {isSelected && item.pricingType === "per_kg" && (
                    <div style={styles.qtyRow}>
                      <div style={styles.kgGramsRow}>
                        <div style={styles.kgGramsGroup}>
                          <input
                            style={styles.kgGramsInput}
                            type="number"
                            min="0"
                            value={kgValues.get(item.id)?.kg || "0"}
                            onChange={(e) => updateKgGrams(item.id, "kg", e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          <span style={styles.kgGramsLabel}>Kg</span>
                        </div>
                        <div style={styles.kgGramsGroup}>
                          <input
                            style={styles.kgGramsInput}
                            type="number"
                            min="0"
                            value={kgValues.get(item.id)?.grams || "0"}
                            onChange={(e) => updateKgGrams(item.id, "grams", e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          <span style={styles.kgGramsLabel}>gm</span>
                        </div>
                      </div>
                      <span style={styles.lineTotal}>
                        = {formatCurrencyShort(item.price * (
                          (parseFloat(kgValues.get(item.id)?.kg || "0") || 0) +
                          (parseFloat(kgValues.get(item.id)?.grams || "0") || 0) / 1000
                        ))}
                      </span>
                    </div>
                  )}

                  {isSelected && item.pricingType !== "per_kg" && (
                    <div style={styles.qtyRow}>
                      <span style={styles.qtyLabel}>Qty:</span>
                      <button
                        style={styles.qtyBtn}
                        onClick={() => {
                          const current = parseFloat(qty) || 1;
                          if (current > 1) updateQty(item.id, (current - 1).toString());
                        }}
                      >
                        <IoRemove size={16} color={Colors.text} />
                      </button>
                      <input
                        style={styles.qtyInput}
                        type="number"
                        min="1"
                        value={qty}
                        onChange={(e) => updateQty(item.id, e.target.value)}
                      />
                      <button
                        style={styles.qtyBtn}
                        onClick={() => {
                          const current = parseFloat(qty) || 0;
                          updateQty(item.id, (current + 1).toString());
                        }}
                      >
                        <IoAdd size={16} color={Colors.text} />
                      </button>
                      <span style={styles.lineTotal}>
                        = {formatCurrencyShort(item.price * (parseFloat(qty) || 0))}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selected.size > 0 && (
          <div style={styles.bottomBar}>
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>{selected.size} items</span>
              <span style={styles.totalValue}>{formatCurrencyShort(totalAmount)}</span>
            </div>
            <button style={styles.createBtn} onClick={handleCreateBill}>
              <IoReceipt size={20} color={Colors.white} />
              <span style={styles.createBtnText}>Generate Bill</span>
            </button>
          </div>
        )}
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
  customerBanner: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: "0 20px 8px",
    padding: "10px 14px",
    backgroundColor: Colors.primary + "12",
    borderRadius: 10,
  },
  customerBannerText: {
    fontSize: 14,
    fontFamily: "Nunito",
    fontWeight: 600,
    color: Colors.primaryDark,
  },
  flashSaleBanner: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    margin: "0 20px 8px",
    padding: "8px 12px",
    backgroundColor: Colors.flashSale,
    borderRadius: 10,
  },
  flashSaleBannerText: {
    fontSize: 13,
    fontFamily: "Nunito",
    fontWeight: 700,
    color: Colors.white,
  },
  detailsForm: {
    flex: 1,
    padding: "20px 20px 0",
  },
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
  listContent: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "0 20px 160px",
  },
  hintText: {
    fontSize: 12,
    fontFamily: "Nunito",
    fontWeight: 400,
    color: Colors.textLight,
    marginBottom: 8,
    margin: "0 0 8px",
  },
  itemCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: "hidden",
    border: `1px solid ${Colors.border}`,
    marginBottom: 10,
  },
  itemCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "05",
  },
  itemMainRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    cursor: "pointer",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    border: `2px solid ${Colors.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 15,
    fontFamily: "Nunito",
    fontWeight: 700,
    color: Colors.text,
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  priceRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: "Nunito",
    fontWeight: 600,
    color: Colors.primaryDark,
  },
  originalPrice: {
    fontSize: 13,
    fontFamily: "Nunito",
    fontWeight: 400,
    color: Colors.textLight,
    textDecoration: "line-through",
  },
  flashPrice: {
    color: Colors.flashSale,
  },
  deleteHoverBtn: {
    position: "absolute" as const,
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.error,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
    zIndex: 10,
  },
  qtyRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: "0 14px 12px",
    gap: 8,
  },
  kgGramsRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  kgGramsGroup: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  kgGramsInput: {
    width: 52,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    textAlign: "center" as const,
    fontSize: 15,
    fontFamily: "Nunito",
    fontWeight: 700,
    color: Colors.text,
    border: "none",
    outline: "none",
  },
  kgGramsLabel: {
    fontSize: 13,
    fontFamily: "Nunito",
    fontWeight: 600,
    color: Colors.textSecondary,
  },
  qtyLabel: {
    fontSize: 13,
    fontFamily: "Nunito",
    fontWeight: 600,
    color: Colors.textSecondary,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
  },
  qtyInput: {
    width: 56,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    textAlign: "center" as const,
    fontSize: 15,
    fontFamily: "Nunito",
    fontWeight: 700,
    color: Colors.text,
    border: "none",
    outline: "none",
  },
  lineTotal: {
    flex: 1,
    textAlign: "right" as const,
    fontSize: 15,
    fontFamily: "Nunito",
    fontWeight: 700,
    color: Colors.primaryDark,
  },
  emptyContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Nunito",
    fontWeight: 400,
    color: Colors.textLight,
    marginTop: 12,
  },
  bottomBar: {
    padding: "12px 20px 24px",
    backgroundColor: Colors.background,
    borderTop: `1px solid ${Colors.borderLight}`,
  },
  totalRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: "Nunito",
    fontWeight: 600,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 22,
    fontFamily: "Nunito",
    fontWeight: 800,
    color: Colors.text,
  },
  nextBtn: {
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
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: "Nunito",
    fontWeight: 700,
    color: Colors.white,
  },
  createBtn: {
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
  createBtnText: {
    fontSize: 16,
    fontFamily: "Nunito",
    fontWeight: 700,
    color: Colors.white,
  },
};

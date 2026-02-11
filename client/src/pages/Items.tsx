import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoAdd,
  IoFlash,
  IoCloseCircle,
  IoTimeOutline,
  IoLogoWhatsapp,
  IoTrash,
  IoPeople,
  IoSend,
  IoArrowForward,
  IoCheckmark,
  IoStorefrontOutline,
  IoChevronBack,
} from "react-icons/io5";
import Colors from "@/constants/colors";
import {
  getItems,
  deleteItem,
  getSettings,
  getPricingLabel,
  formatCurrencyShort,
  generateWhatsAppMessage,
  getFlashSaleState,
  startFlashSale,
  endFlashSale,
  getFlashSaleRemainingTime,
} from "@/lib/storage";
import type { Item, Settings, WhatsAppGroup, FlashSaleState } from "@/lib/storage";

export default function ItemsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [flashSale, setFlashSale] = useState<FlashSaleState | null>(null);
  const [flashDuration, setFlashDuration] = useState(1);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [remainingTime, setRemainingTime] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [sharedGroups, setSharedGroups] = useState<Set<string>>(new Set());

  const loadData = useCallback(() => {
    setItems(getItems());
    setSettings(getSettings());
    setFlashSale(getFlashSaleState());
    setRemainingTime(getFlashSaleRemainingTime());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!flashSale?.active) return;
    const interval = setInterval(() => {
      const time = getFlashSaleRemainingTime();
      if (!time) {
        setFlashSale(null);
        setRemainingTime(null);
        loadData();
        clearInterval(interval);
        return;
      }
      setRemainingTime(time);
    }, 1000);
    return () => clearInterval(interval);
  }, [flashSale?.active, loadData]);

  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"?`)) {
      deleteItem(id);
      loadData();
    }
  };

  const handleStartFlashSale = () => {
    if (items.length === 0) {
      window.alert("Add items first before starting a flash sale.");
      return;
    }
    startFlashSale(flashDuration);
    setShowDurationPicker(false);
    loadData();
  };

  const handleEndFlashSale = () => {
    if (window.confirm("End the flash sale? Prices will revert to original.")) {
      endFlashSale();
      loadData();
    }
  };

  const handleShare = () => {
    if (items.length === 0) {
      window.alert("Add items first before sharing.");
      return;
    }
    const s = getSettings();
    const fs = getFlashSaleState();
    const message = generateWhatsAppMessage(
      items,
      s.businessName,
      !!fs?.active,
      fs?.duration || 0,
      s.phoneNumber,
      s.shopAddress,
      fs?.originalPrices,
      fs?.startTime,
      fs?.endTime
    );

    if (s.whatsappGroups && s.whatsappGroups.length > 0) {
      setCurrentGroupIndex(0);
      setSharedGroups(new Set());
      setShowShareModal(true);
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    }
  };

  const handleShareToGroup = () => {
    if (!settings) return;
    const groups = settings.whatsappGroups;
    if (currentGroupIndex >= groups.length) return;

    const fs = getFlashSaleState();
    const message = generateWhatsAppMessage(
      items,
      settings.businessName,
      !!fs?.active,
      fs?.duration || 0,
      settings.phoneNumber,
      settings.shopAddress,
      fs?.originalPrices,
      fs?.startTime,
      fs?.endTime
    );

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    setSharedGroups((prev) => new Set(prev).add(groups[currentGroupIndex].id));

    if (currentGroupIndex < groups.length - 1) {
      setCurrentGroupIndex((prev) => prev + 1);
    } else {
      setTimeout(() => setShowShareModal(false), 500);
    }
  };

  const formatTime = (t: { hours: number; minutes: number; seconds: number }) => {
    return `${String(t.hours).padStart(2, "0")}:${String(t.minutes).padStart(2, "0")}:${String(t.seconds).padStart(2, "0")}`;
  };

  const groups = settings?.whatsappGroups || [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <h1 style={styles.title}>Apni Dukan</h1>
            <span style={styles.itemCount}>{items.length} {items.length === 1 ? "item" : "items"}</span>
          </div>
          <button style={styles.addButton} onClick={() => navigate("/add-item")}>
            <IoAdd size={22} color={Colors.white} />
          </button>
        </div>
      </div>

      {!flashSale?.active ? (
        <div style={styles.flashSaleBar}>
          <div style={styles.flashSaleToggle}>
            <IoFlash size={18} color={Colors.flashSale} />
            <span style={styles.flashSaleLabel}>Flash Sale</span>
          </div>
          <div style={styles.flashSaleControls}>
            <button
              style={styles.durationButton}
              onClick={() => setShowDurationPicker(!showDurationPicker)}
            >
              <IoTimeOutline size={14} color={Colors.textSecondary} />
              <span style={styles.durationText}>{flashDuration}h</span>
            </button>
            <button style={styles.startSaleButton} onClick={handleStartFlashSale}>
              Start
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.flashSaleActiveBar}>
          <div style={styles.flashSaleActiveLeft}>
            <IoFlash size={18} color={Colors.white} />
            <span style={styles.flashSaleActiveLabel}>FLASH SALE</span>
            {remainingTime && (
              <span style={styles.flashSaleTimer}>{formatTime(remainingTime)}</span>
            )}
          </div>
          <button style={styles.endSaleButton} onClick={handleEndFlashSale}>
            End
          </button>
        </div>
      )}

      {showDurationPicker && (
        <div style={styles.durationPicker}>
          {[1, 2, 3, 4, 5, 6].map((h) => (
            <button
              key={h}
              style={{
                ...styles.durationOption,
                backgroundColor: flashDuration === h ? Colors.flashSale : Colors.surface,
                color: flashDuration === h ? Colors.white : Colors.text,
              }}
              onClick={() => {
                setFlashDuration(h);
                setShowDurationPicker(false);
              }}
            >
              {h}h
            </button>
          ))}
        </div>
      )}

      <div style={styles.listArea}>
        {items.length === 0 ? (
          <div style={styles.emptyState}>
            <IoStorefrontOutline size={64} color={Colors.border} />
            <p style={styles.emptyTitle}>No items yet</p>
            <p style={styles.emptySubtitle}>Add your first product to get started</p>
            <button style={styles.emptyAddButton} onClick={() => navigate("/add-item")}>
              <IoAdd size={18} color={Colors.white} />
              <span>Add Item</span>
            </button>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              style={styles.itemCard}
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => setHoveredItemId(null)}
              onClick={() => navigate(`/add-item?editId=${item.id}`)}
            >
              <div style={styles.itemInfo}>
                <div style={styles.itemNameRow}>
                  <span style={styles.itemName}>{item.name}</span>
                  {flashSale?.active && flashSale.originalPrices[item.id] !== undefined && flashSale.originalPrices[item.id] !== item.price && (
                    <span style={styles.flashBadge}>
                      <IoFlash size={10} color={Colors.white} />
                    </span>
                  )}
                </div>
                <div style={styles.itemDetails}>
                  <span style={styles.itemPrice}>
                    {formatCurrencyShort(item.price)}
                    <span style={styles.itemPricingType}>{getPricingLabel(item.pricingType)}</span>
                  </span>
                  {flashSale?.active && flashSale.originalPrices[item.id] !== undefined && flashSale.originalPrices[item.id] !== item.price && (
                    <span style={styles.originalPrice}>
                      {formatCurrencyShort(flashSale.originalPrices[item.id])}
                    </span>
                  )}
                  {item.quantity && (
                    <span style={styles.itemQuantity}>Qty: {item.quantity}</span>
                  )}
                </div>
              </div>
              {hoveredItemId === item.id && (
                <button
                  style={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(item.id, item.name);
                  }}
                >
                  <IoTrash size={18} color={Colors.error} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div style={styles.bottomSection}>
        <div style={styles.footer}>
          <span style={styles.poweredBy}>Powered by Codesmotech Consulting Pvt Ltd</span>
        </div>
        <div style={styles.bottomBar}>
          <button style={styles.whatsappButton} onClick={handleShare}>
            <IoLogoWhatsapp size={22} color={Colors.white} />
            <span style={styles.whatsappButtonText}>Share on WhatsApp</span>
          </button>
        </div>
      </div>

      {showShareModal && (
        <div style={styles.modalOverlay} onClick={() => setShowShareModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <IoPeople size={20} color={Colors.primary} />
                <span>Share to Groups</span>
              </h2>
              <button style={styles.modalClose} onClick={() => setShowShareModal(false)}>
                <IoCloseCircle size={24} color={Colors.textLight} />
              </button>
            </div>
            <div style={styles.modalBody}>
              {groups.map((group, index) => {
                const isShared = sharedGroups.has(group.id);
                const isCurrent = index === currentGroupIndex;
                return (
                  <div
                    key={group.id}
                    style={{
                      ...styles.groupItem,
                      backgroundColor: isCurrent ? Colors.surfaceElevated : Colors.surface,
                      opacity: isShared && !isCurrent ? 0.6 : 1,
                    }}
                  >
                    <div style={styles.groupInfo}>
                      <span style={styles.groupName}>{group.name}</span>
                      {isShared && (
                        <span style={styles.sharedBadge}>
                          <IoCheckmark size={12} color={Colors.success} /> Sent
                        </span>
                      )}
                    </div>
                    {isCurrent && !isShared && (
                      <button style={styles.sendButton} onClick={handleShareToGroup}>
                        <IoSend size={16} color={Colors.white} />
                      </button>
                    )}
                    {!isCurrent && !isShared && (
                      <IoArrowForward size={16} color={Colors.textLight} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    maxWidth: 480,
    margin: "0 auto",
    width: "100%",
    backgroundColor: Colors.background,
    fontFamily: "'Nunito', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  header: {
    padding: "16px 16px 12px",
    backgroundColor: Colors.primary,
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: Colors.white,
    margin: 0,
    fontFamily: "'Nunito', sans-serif",
  },
  itemCount: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: 600,
    fontFamily: "'Nunito', sans-serif",
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryDark,
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "transform 0.15s ease",
  },
  flashSaleBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    backgroundColor: Colors.surfaceElevated,
    borderBottom: `1px solid ${Colors.borderLight}`,
  },
  flashSaleToggle: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  flashSaleLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: Colors.flashSale,
    fontFamily: "'Nunito', sans-serif",
  },
  flashSaleControls: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  durationButton: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 10px",
    borderRadius: 12,
    border: `1px solid ${Colors.border}`,
    backgroundColor: Colors.surface,
    cursor: "pointer",
    fontFamily: "'Nunito', sans-serif",
  },
  durationText: {
    fontSize: 13,
    fontWeight: 600,
    color: Colors.textSecondary,
    fontFamily: "'Nunito', sans-serif",
  },
  startSaleButton: {
    padding: "6px 14px",
    borderRadius: 14,
    border: "none",
    backgroundColor: Colors.flashSale,
    color: Colors.white,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Nunito', sans-serif",
    transition: "opacity 0.15s ease",
  },
  flashSaleActiveBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    backgroundColor: Colors.flashSale,
  },
  flashSaleActiveLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  flashSaleActiveLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: Colors.white,
    letterSpacing: 1,
    fontFamily: "'Nunito', sans-serif",
  },
  flashSaleTimer: {
    fontSize: 14,
    fontWeight: 700,
    color: Colors.white,
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: "2px 8px",
    borderRadius: 8,
    fontFamily: "'Nunito', sans-serif",
  },
  endSaleButton: {
    padding: "6px 14px",
    borderRadius: 14,
    border: "2px solid rgba(255,255,255,0.5)",
    backgroundColor: "transparent",
    color: Colors.white,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Nunito', sans-serif",
  },
  durationPicker: {
    display: "flex",
    justifyContent: "center",
    gap: 8,
    padding: "10px 16px",
    backgroundColor: Colors.surface,
    borderBottom: `1px solid ${Colors.borderLight}`,
  },
  durationOption: {
    width: 42,
    height: 34,
    borderRadius: 10,
    border: `1px solid ${Colors.border}`,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Nunito', sans-serif",
    transition: "all 0.15s ease",
  },
  listArea: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "8px 16px",
    WebkitOverflowScrolling: "touch",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: Colors.text,
    margin: 0,
    fontFamily: "'Nunito', sans-serif",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    margin: 0,
    fontFamily: "'Nunito', sans-serif",
  },
  emptyAddButton: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 20px",
    borderRadius: 20,
    border: "none",
    backgroundColor: Colors.primary,
    color: Colors.white,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
    fontFamily: "'Nunito', sans-serif",
  },
  itemCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    cursor: "pointer",
    border: `1px solid ${Colors.borderLight}`,
    transition: "box-shadow 0.15s ease, transform 0.1s ease",
    position: "relative",
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemNameRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: 700,
    color: Colors.text,
    fontFamily: "'Nunito', sans-serif",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  flashBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.flashSale,
    flexShrink: 0,
  },
  itemDetails: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: 800,
    color: Colors.primary,
    fontFamily: "'Nunito', sans-serif",
  },
  itemPricingType: {
    fontSize: 12,
    fontWeight: 600,
    color: Colors.textSecondary,
    fontFamily: "'Nunito', sans-serif",
  },
  originalPrice: {
    fontSize: 13,
    fontWeight: 600,
    color: Colors.textLight,
    textDecoration: "line-through",
    fontFamily: "'Nunito', sans-serif",
  },
  itemQuantity: {
    fontSize: 12,
    fontWeight: 600,
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceElevated,
    padding: "2px 8px",
    borderRadius: 8,
    fontFamily: "'Nunito', sans-serif",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    border: "none",
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background-color 0.15s ease",
  },
  footer: {
    padding: "6px 16px 0",
    textAlign: "center",
  },
  poweredBy: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 400,
  },
  bottomSection: {
    flexShrink: 0,
    backgroundColor: Colors.surface,
    borderTop: `1px solid ${Colors.borderLight}`,
  },
  bottomBar: {
    padding: "8px 16px 12px",
  },
  whatsappButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "12px 0",
    borderRadius: 14,
    border: "none",
    backgroundColor: Colors.whatsapp,
    cursor: "pointer",
    transition: "opacity 0.15s ease",
  },
  whatsappButtonText: {
    fontSize: 15,
    fontWeight: 700,
    color: Colors.white,
    fontFamily: "'Nunito', sans-serif",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 16px 12px",
    borderBottom: `1px solid ${Colors.borderLight}`,
  },
  modalTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 17,
    fontWeight: 700,
    color: Colors.text,
    margin: 0,
    fontFamily: "'Nunito', sans-serif",
  },
  modalClose: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
  },
  modalBody: {
    padding: 16,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  groupItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    borderRadius: 12,
    border: `1px solid ${Colors.borderLight}`,
    transition: "background-color 0.15s ease",
  },
  groupInfo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  groupName: {
    fontSize: 14,
    fontWeight: 600,
    color: Colors.text,
    fontFamily: "'Nunito', sans-serif",
  },
  sharedBadge: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    fontSize: 12,
    fontWeight: 600,
    color: Colors.success,
    fontFamily: "'Nunito', sans-serif",
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    border: "none",
    backgroundColor: Colors.whatsapp,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
};

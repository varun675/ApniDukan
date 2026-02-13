import React, { useState, useEffect, useRef, useCallback } from "react";
import Colors from "@/constants/colors";
import { getSettings, saveSettings, exportAllData, importAllData } from "@/lib/storage";
import type { Settings } from "@/lib/storage";
import {
  IoStorefrontOutline,
  IoWalletOutline,
  IoQrCodeOutline,
  IoCameraOutline,
  IoTrashOutline,
  IoCheckmarkCircle,
  IoPeople,
  IoAdd,
  IoClose,
  IoCloudDownloadOutline,
  IoCloudUploadOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    upiId: "",
    businessName: "",
    phoneNumber: "",
    whatsappGroups: [],
  });
  const [autoSaveMsg, setAutoSaveMsg] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [importMsg, setImportMsg] = useState<{ text: string; success: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const s = getSettings();
    setSettings(s);
  }, []);

  const triggerAutoSave = useCallback((newSettings: Settings) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveSettings(newSettings);
      setAutoSaveMsg("Saved");
      setTimeout(() => setAutoSaveMsg(""), 1500);
    }, 800);
  }, []);

  const updateSettings = (updater: (prev: Settings) => Settings) => {
    setSettings((prev) => {
      const next = updater(prev);
      triggerAutoSave(next);
      return next;
    });
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      updateSettings((prev) => ({ ...prev, qrCodeImage: result }));
    };
    reader.readAsDataURL(file);
  };

  const removeQr = () => {
    updateSettings((prev) => ({ ...prev, qrCodeImage: undefined }));
  };

  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    updateSettings((prev) => ({
      ...prev,
      whatsappGroups: [...prev.whatsappGroups, { id: generateId(), name }],
    }));
    setNewGroupName("");
  };

  const removeGroup = (id: string) => {
    updateSettings((prev) => ({
      ...prev,
      whatsappGroups: prev.whatsappGroups.filter((g) => g.id !== id),
    }));
  };

  const handleExport = () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apnidukan_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importAllData(text);
      setImportMsg({ text: result.message, success: result.success });
      if (result.success) {
        const s = getSettings();
        setSettings(s);
      }
      setTimeout(() => setImportMsg(null), 4000);
    };
    reader.readAsText(file);
    if (importInputRef.current) importInputRef.current.value = "";
  };

  const sectionHeader: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    fontSize: 16,
    fontWeight: 700,
    color: Colors.text,
    fontFamily: "Nunito",
  };

  const card: React.CSSProperties = {
    background: Colors.surface,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    border: `1px solid ${Colors.border}`,
  };

  const label: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: Colors.text,
    marginBottom: 4,
    fontFamily: "Nunito",
    display: "block",
  };

  const hint: React.CSSProperties = {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
    marginBottom: 12,
    fontFamily: "Nunito",
  };

  const input: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: `1px solid ${Colors.border}`,
    fontSize: 14,
    fontFamily: "Nunito",
    color: Colors.text,
    background: Colors.background,
    outline: "none",
    boxSizing: "border-box",
  };

  const textarea: React.CSSProperties = {
    ...input,
    minHeight: 70,
    resize: "vertical" as const,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: Colors.background,
        fontFamily: "Nunito",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "24px 16px 40px",
        }}
      >
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: Colors.text,
                margin: 0,
                fontFamily: "Nunito",
              }}
            >
              Settings
            </h1>
            <p
              style={{
                fontSize: 13,
                color: Colors.textSecondary,
                margin: "4px 0 0",
                fontFamily: "Nunito",
              }}
            >
              Apni Dukan configuration
            </p>
          </div>
          {autoSaveMsg && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "#E8F5E9",
              color: Colors.success,
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "Nunito",
            }}>
              <IoCheckmarkCircle size={14} />
              {autoSaveMsg}
            </div>
          )}
        </div>

        <div style={card}>
          <div style={sectionHeader}>
            <IoStorefrontOutline size={20} color={Colors.primary} />
            <span>Business Details</span>
          </div>

          <label style={label}>Business Name</label>
          <input
            style={input}
            value={settings.businessName}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, businessName: e.target.value }))
            }
            placeholder="Your business name"
            enterKeyHint="next"
            autoComplete="off"
          />
          <div style={hint}>This name appears in your WhatsApp messages</div>

          <label style={label}>Phone Number</label>
          <input
            style={input}
            value={settings.phoneNumber}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, phoneNumber: e.target.value }))
            }
            placeholder="Your phone number"
            inputMode="tel"
            enterKeyHint="next"
            autoComplete="off"
          />
          <div style={{ ...hint, marginBottom: 12 }} />

          <label style={label}>Shop Address</label>
          <textarea
            style={textarea}
            value={settings.shopAddress || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, shopAddress: e.target.value }))
            }
            placeholder="Your shop address"
          />
          <div style={hint}>
            Shown in price lists and bills sent via WhatsApp
          </div>
        </div>

        <div style={card}>
          <div style={sectionHeader}>
            <IoWalletOutline size={20} color={Colors.primary} />
            <span>Payment Settings</span>
          </div>

          <label style={label}>PhonePe UPI ID</label>
          <input
            style={input}
            value={settings.phonepeUpiId || ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                phonepeUpiId: e.target.value,
              }))
            }
            placeholder="yourname@ybl"
          />
          <div style={hint}>
            Customers can pay via PhonePe link using this UPI ID
          </div>

          <label style={label}>Google Pay UPI ID</label>
          <input
            style={input}
            value={settings.gpayUpiId || ""}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, gpayUpiId: e.target.value }))
            }
            placeholder="yourname@okaxis"
          />
          <div style={hint}>
            Customers can pay via GPay link using this UPI ID
          </div>

          <label style={label}>UPI ID (General)</label>
          <input
            style={input}
            value={settings.upiId}
            onChange={(e) =>
              updateSettings((prev) => ({ ...prev, upiId: e.target.value }))
            }
            placeholder="yourname@upi"
          />
          <div style={hint}>Shown in bills for manual payment</div>

          <label style={label}>Payment QR Code</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleQrUpload}
          />
          {settings.qrCodeImage ? (
            <div style={{ marginTop: 8 }}>
              <img
                src={settings.qrCodeImage}
                alt="Payment QR Code"
                style={{
                  width: "100%",
                  maxWidth: 200,
                  borderRadius: 10,
                  border: `1px solid ${Colors.border}`,
                  display: "block",
                  marginBottom: 10,
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: `1px solid ${Colors.border}`,
                    background: Colors.surfaceElevated,
                    color: Colors.text,
                    fontSize: 13,
                    fontFamily: "Nunito",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <IoCameraOutline size={14} />
                  Change
                </button>
                <button
                  onClick={removeQr}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: `1px solid ${Colors.error}`,
                    background: Colors.white,
                    color: Colors.error,
                    fontSize: 13,
                    fontFamily: "Nunito",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <IoTrashOutline size={14} />
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${Colors.border}`,
                borderRadius: 12,
                padding: "28px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                background: Colors.background,
                marginTop: 8,
              }}
            >
              <IoQrCodeOutline size={36} color={Colors.textLight} />
              <span
                style={{
                  fontSize: 13,
                  color: Colors.textLight,
                  marginTop: 8,
                  fontFamily: "Nunito",
                }}
              >
                Tap to upload QR code
              </span>
            </div>
          )}
        </div>

        <div style={card}>
          <div style={sectionHeader}>
            <IoPeople size={20} color={Colors.primary} />
            <span>WhatsApp Groups</span>
          </div>

          {settings.whatsappGroups.map((group) => (
            <div
              key={group.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: Colors.surfaceElevated,
                borderRadius: 10,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  color: Colors.text,
                  fontFamily: "Nunito",
                  fontWeight: 600,
                }}
              >
                {group.name}
              </span>
              <button
                onClick={() => removeGroup(group.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <IoClose size={18} color={Colors.error} />
              </button>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <input
              style={{ ...input, flex: 1 }}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name"
              onKeyDown={(e) => {
                if (e.key === "Enter") addGroup();
              }}
            />
            <button
              onClick={addGroup}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: Colors.primary,
                color: Colors.white,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IoAdd size={20} />
            </button>
          </div>
        </div>

        <div style={card}>
          <div style={sectionHeader}>
            <IoShieldCheckmarkOutline size={20} color={Colors.primary} />
            <span>Data Backup</span>
          </div>

          <p style={{ fontSize: 13, color: Colors.textSecondary, fontFamily: "Nunito", margin: "0 0 16px" }}>
            Export your data to keep a safe backup, or restore from a previous backup file.
          </p>

          {importMsg && (
            <div style={{
              padding: "10px 14px",
              borderRadius: 10,
              marginBottom: 12,
              background: importMsg.success ? "#E8F5E9" : "#FFEBEE",
              color: importMsg.success ? Colors.success : Colors.error,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "Nunito",
            }}>
              {importMsg.text}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleExport}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 10,
                border: `1px solid ${Colors.primary}`,
                background: Colors.white,
                color: Colors.primary,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "Nunito",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <IoCloudDownloadOutline size={18} />
              Export
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleImport}
            />
            <button
              onClick={() => importInputRef.current?.click()}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 10,
                border: "none",
                background: Colors.primary,
                color: Colors.white,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "Nunito",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <IoCloudUploadOutline size={18} />
              Restore
            </button>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: 11,
            color: Colors.textLight,
            fontFamily: "Nunito",
            paddingBottom: 16,
          }}
        >
          Powered by Codesmotech Consulting Pvt Ltd
        </div>
      </div>
    </div>
  );
}

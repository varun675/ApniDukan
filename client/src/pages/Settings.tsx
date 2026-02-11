import React, { useState, useEffect, useRef } from "react";
import Colors from "@/constants/colors";
import { getSettings, saveSettings, Settings } from "@/lib/storage";
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
  const [saved, setSaved] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = getSettings();
    setSettings(s);
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setSettings((prev) => ({ ...prev, qrCodeImage: result }));
    };
    reader.readAsDataURL(file);
  };

  const removeQr = () => {
    setSettings((prev) => ({ ...prev, qrCodeImage: undefined }));
  };

  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    setSettings((prev) => ({
      ...prev,
      whatsappGroups: [...prev.whatsappGroups, { id: generateId(), name }],
    }));
    setNewGroupName("");
  };

  const removeGroup = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      whatsappGroups: prev.whatsappGroups.filter((g) => g.id !== id),
    }));
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
        <div style={{ marginBottom: 24 }}>
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
              setSettings((prev) => ({ ...prev, businessName: e.target.value }))
            }
            placeholder="Your business name"
          />
          <div style={hint}>This name appears in your WhatsApp messages</div>

          <label style={label}>Phone Number</label>
          <input
            style={input}
            value={settings.phoneNumber}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, phoneNumber: e.target.value }))
            }
            placeholder="Your phone number"
          />
          <div style={{ ...hint, marginBottom: 12 }} />

          <label style={label}>Shop Address</label>
          <textarea
            style={textarea}
            value={settings.shopAddress || ""}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, shopAddress: e.target.value }))
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
              setSettings((prev) => ({
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
              setSettings((prev) => ({ ...prev, gpayUpiId: e.target.value }))
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
              setSettings((prev) => ({ ...prev, upiId: e.target.value }))
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

        <button
          onClick={handleSave}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: saved ? Colors.success : Colors.primary,
            color: Colors.white,
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "Nunito",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 32,
            transition: "background 0.3s",
          }}
        >
          {saved ? (
            <>
              <IoCheckmarkCircle size={20} />
              Settings Saved!
            </>
          ) : (
            "Save Settings"
          )}
        </button>

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

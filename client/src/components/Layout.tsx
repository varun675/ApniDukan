import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { IoStorefrontOutline, IoReceiptOutline, IoWalletOutline, IoBarChartOutline, IoSettingsOutline, IoStorefront, IoReceipt, IoWallet, IoBarChart, IoSettings } from "react-icons/io5";
import Colors from "@/constants/colors";

const tabs = [
  { path: "/", label: "Items", icon: IoStorefrontOutline, activeIcon: IoStorefront },
  { path: "/bills", label: "Bills", icon: IoReceiptOutline, activeIcon: IoReceipt },
  { path: "/accounts", label: "Accounts", icon: IoWalletOutline, activeIcon: IoWallet },
  { path: "/summary", label: "Summary", icon: IoBarChartOutline, activeIcon: IoBarChart },
  { path: "/settings", label: "Settings", icon: IoSettingsOutline, activeIcon: IoSettings },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <Outlet />
      </div>
      <div style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path === "/" && location.pathname === "");
          const Icon = isActive ? tab.activeIcon : tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                ...styles.tab,
                color: isActive ? Colors.primary : Colors.textLight,
              }}
            >
              <Icon size={22} />
              <span style={{
                ...styles.tabLabel,
                fontWeight: isActive ? 700 : 600,
                color: isActive ? Colors.primary : Colors.textLight,
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    maxWidth: 480,
    margin: "0 auto",
    position: "relative",
    background: Colors.background,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  tabBar: {
    display: "flex",
    flexDirection: "row",
    borderTop: `1px solid ${Colors.borderLight}`,
    background: Colors.surface,
    paddingBottom: "max(8px, env(safe-area-inset-bottom))" as any,
    paddingTop: 6,
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    border: "none",
    background: "none",
    cursor: "pointer",
    padding: "4px 0",
    WebkitTapHighlightColor: "transparent",
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
};

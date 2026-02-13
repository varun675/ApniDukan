import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ItemsPage from "./pages/Items";
import BillsPage from "./pages/Bills";
import AccountsPage from "./pages/Accounts";
import SummaryPage from "./pages/Summary";
import SettingsPage from "./pages/Settings";
import AddItemPage from "./pages/AddItem";
import CreateBillPage from "./pages/CreateBill";
import BillDetailPage from "./pages/BillDetail";
import PaymentPage from "./pages/PaymentPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ItemsPage />} />
        <Route path="bills" element={<BillsPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="summary" element={<SummaryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="add-item" element={<AddItemPage />} />
      <Route path="create-bill" element={<CreateBillPage />} />
      <Route path="bill-detail" element={<BillDetailPage />} />
      <Route path="pay" element={<PaymentPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

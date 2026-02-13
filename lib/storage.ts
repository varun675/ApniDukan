import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const KEYS = {
  ITEMS: "apnidukan_items",
  BILLS: "apnidukan_bills",
  SETTINGS: "apnidukan_settings",
  DAILY_ACCOUNTS: "apnidukan_daily_accounts",
  FLASH_SALE: "apnidukan_flash_sale",
};

function getLocalStorageSync(key: string): string | null {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return null;
}

export function getItemsSync(): Item[] {
  try {
    const data = getLocalStorageSync(KEYS.ITEMS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getSettingsSync(): Settings {
  try {
    const data = getLocalStorageSync(KEYS.SETTINGS);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        upiId: parsed.upiId || "",
        phonepeUpiId: parsed.phonepeUpiId || undefined,
        gpayUpiId: parsed.gpayUpiId || undefined,
        businessName: parsed.businessName || "",
        phoneNumber: parsed.phoneNumber || "",
        shopAddress: parsed.shopAddress || undefined,
        whatsappGroups: parsed.whatsappGroups || [],
        qrCodeImage: parsed.qrCodeImage || undefined,
        paymentLink: parsed.paymentLink || undefined,
      };
    }
  } catch {}
  return { upiId: "", businessName: "", phoneNumber: "", whatsappGroups: [], qrCodeImage: undefined, paymentLink: undefined };
}

export function getFlashSaleStateSync(): FlashSaleState | null {
  try {
    const data = getLocalStorageSync(KEYS.FLASH_SALE);
    if (!data) return null;
    const state: FlashSaleState = JSON.parse(data);
    if (state.active && new Date(state.endTime).getTime() > Date.now()) {
      return state;
    }
    return null;
  } catch {
    return null;
  }
}

export interface Item {
  id: string;
  name: string;
  price: number;
  pricingType: "per_kg" | "per_unit" | "per_piece" | "per_dozen";
  quantity?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
  itemId: string;
  name: string;
  price: number;
  pricingType: string;
  quantity: number;
  total: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  customerName: string;
  flatNumber: string;
  items: BillItem[];
  totalAmount: number;
  createdAt: string;
  paid: boolean;
}

export interface WhatsAppGroup {
  id: string;
  name: string;
}

export interface Settings {
  upiId: string;
  phonepeUpiId?: string;
  gpayUpiId?: string;
  businessName: string;
  phoneNumber: string;
  shopAddress?: string;
  whatsappGroups: WhatsAppGroup[];
  qrCodeImage?: string;
  paymentLink?: string;
}

export interface DailyAccount {
  id: string;
  date: string;
  expenses: { description: string; amount: number }[];
  totalExpense: number;
  totalSale: number;
  profit: number;
}

export interface FlashSaleState {
  active: boolean;
  startTime: string;
  endTime: string;
  duration: number;
  originalPrices: { [itemId: string]: number };
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export async function getItems(): Promise<Item[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.ITEMS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load items:", e);
    return [];
  }
}

export async function saveItem(item: Omit<Item, "id" | "createdAt" | "updatedAt">): Promise<Item> {
  const items = await getItems();
  const newItem: Item = {
    ...item,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  items.push(newItem);
  await AsyncStorage.setItem(KEYS.ITEMS, JSON.stringify(items));
  return newItem;
}

export async function updateItem(id: string, updates: Partial<Item>): Promise<Item | null> {
  const items = await getItems();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(KEYS.ITEMS, JSON.stringify(items));
  return items[index];
}

export async function deleteItem(id: string): Promise<void> {
  const items = await getItems();
  const filtered = items.filter((i) => i.id !== id);
  await AsyncStorage.setItem(KEYS.ITEMS, JSON.stringify(filtered));
}

export async function reorderItems(newItems: Item[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.ITEMS, JSON.stringify(newItems));
}

export async function getFlashSaleState(): Promise<FlashSaleState | null> {
  const data = await AsyncStorage.getItem(KEYS.FLASH_SALE);
  if (!data) return null;
  const state: FlashSaleState = JSON.parse(data);
  if (state.active && new Date(state.endTime).getTime() <= Date.now()) {
    await endFlashSale();
    return null;
  }
  return state.active ? state : null;
}

export async function startFlashSale(durationHours: number): Promise<FlashSaleState> {
  const items = await getItems();
  const originalPrices: { [itemId: string]: number } = {};
  items.forEach((item) => {
    originalPrices[item.id] = item.price;
  });
  const now = new Date();
  const startTime = now.toISOString();
  const endTime = new Date(now.getTime() + durationHours * 60 * 60 * 1000).toISOString();
  const state: FlashSaleState = {
    active: true,
    startTime,
    endTime,
    duration: durationHours,
    originalPrices,
  };
  await AsyncStorage.setItem(KEYS.FLASH_SALE, JSON.stringify(state));
  return state;
}

export async function endFlashSale(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FLASH_SALE);
    if (!data) return;
    const state: FlashSaleState = JSON.parse(data);
    if (Object.keys(state.originalPrices).length > 0) {
      const items = await getItems();
      const updated = items.map((item) => {
        if (state.originalPrices[item.id] !== undefined) {
          return { ...item, price: state.originalPrices[item.id], updatedAt: new Date().toISOString() };
        }
        return item;
      });
      await AsyncStorage.setItem(KEYS.ITEMS, JSON.stringify(updated));
    }
    await AsyncStorage.removeItem(KEYS.FLASH_SALE);
  } catch (e) {
    console.error("Failed to end flash sale:", e);
    await AsyncStorage.removeItem(KEYS.FLASH_SALE);
  }
}

export async function isFlashSaleActive(): Promise<boolean> {
  const state = await getFlashSaleState();
  return state !== null && state.active;
}

export async function getFlashSaleRemainingTime(): Promise<{ hours: number; minutes: number; seconds: number } | null> {
  const state = await getFlashSaleState();
  if (!state) return null;
  const remaining = new Date(state.endTime).getTime() - Date.now();
  if (remaining <= 0) return null;
  return {
    hours: Math.floor(remaining / (1000 * 60 * 60)),
    minutes: Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((remaining % (1000 * 60)) / 1000),
  };
}

export async function getBills(): Promise<Bill[]> {
  const data = await AsyncStorage.getItem(KEYS.BILLS);
  if (!data) return [];
  const bills: Bill[] = JSON.parse(data);
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const filtered = bills.filter((b) => new Date(b.createdAt).getTime() > oneWeekAgo);
  if (filtered.length !== bills.length) {
    await AsyncStorage.setItem(KEYS.BILLS, JSON.stringify(filtered));
  }
  return filtered;
}

export function groupBillsByDate(bills: Bill[]): { date: string; dateLabel: string; bills: Bill[] }[] {
  const groups = new Map<string, Bill[]>();
  bills.forEach((bill) => {
    const dateKey = new Date(bill.createdAt).toISOString().split("T")[0];
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(bill);
  });
  const sorted = Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  return sorted.map(([date, dateBills]) => {
    let dateLabel: string;
    if (date === today) {
      dateLabel = "Today";
    } else if (date === yesterday) {
      dateLabel = "Yesterday";
    } else {
      const d = new Date(date + "T00:00:00");
      dateLabel = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    }
    return { date, dateLabel, bills: dateBills };
  });
}

function generateBillNumber(existingBills: Bill[]): string {
  const today = new Date();
  const datePrefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const todaysBills = existingBills.filter((b) => b.billNumber && b.billNumber.startsWith(datePrefix));
  const nextNum = todaysBills.length + 1;
  return `${datePrefix}-${String(nextNum).padStart(3, '0')}`;
}

export async function saveBill(bill: Omit<Bill, "id" | "createdAt" | "billNumber">): Promise<Bill> {
  const bills = await getBills();
  const newBill: Bill = {
    ...bill,
    id: generateId(),
    billNumber: generateBillNumber(bills),
    createdAt: new Date().toISOString(),
  };
  bills.unshift(newBill);
  await AsyncStorage.setItem(KEYS.BILLS, JSON.stringify(bills));
  return newBill;
}

export async function updateBill(id: string, updates: Partial<Bill>): Promise<void> {
  const bills = await getBills();
  const index = bills.findIndex((b) => b.id === id);
  if (index !== -1) {
    bills[index] = { ...bills[index], ...updates };
    await AsyncStorage.setItem(KEYS.BILLS, JSON.stringify(bills));
  }
}

export async function deleteBill(id: string): Promise<void> {
  const bills = await getBills();
  const filtered = bills.filter((b) => b.id !== id);
  await AsyncStorage.setItem(KEYS.BILLS, JSON.stringify(filtered));
}

export async function getSettings(): Promise<Settings> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        upiId: parsed.upiId || "",
        phonepeUpiId: parsed.phonepeUpiId || undefined,
        gpayUpiId: parsed.gpayUpiId || undefined,
        businessName: parsed.businessName || "",
        phoneNumber: parsed.phoneNumber || "",
        shopAddress: parsed.shopAddress || undefined,
        whatsappGroups: parsed.whatsappGroups || [],
        qrCodeImage: parsed.qrCodeImage || undefined,
        paymentLink: parsed.paymentLink || undefined,
      };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return { upiId: "", businessName: "", phoneNumber: "", whatsappGroups: [], qrCodeImage: undefined, paymentLink: undefined };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export async function getDailyAccounts(): Promise<DailyAccount[]> {
  const data = await AsyncStorage.getItem(KEYS.DAILY_ACCOUNTS);
  return data ? JSON.parse(data) : [];
}

export async function getDailyAccount(date: string): Promise<DailyAccount | null> {
  const accounts = await getDailyAccounts();
  return accounts.find((a) => a.date === date) || null;
}

export async function saveDailyAccount(account: Omit<DailyAccount, "id">): Promise<DailyAccount> {
  const accounts = await getDailyAccounts();
  const existing = accounts.findIndex((a) => a.date === account.date);
  const newAccount: DailyAccount = {
    ...account,
    id: existing !== -1 ? accounts[existing].id : generateId(),
  };
  if (existing !== -1) {
    accounts[existing] = newAccount;
  } else {
    accounts.unshift(newAccount);
  }
  await AsyncStorage.setItem(KEYS.DAILY_ACCOUNTS, JSON.stringify(accounts));
  return newAccount;
}

export function getPricingLabel(type: string): string {
  switch (type) {
    case "per_kg": return "/kg";
    case "per_unit": return "/unit";
    case "per_piece": return "/pc";
    case "per_dozen": return "/dozen";
    default: return "";
  }
}

export function getPricingEmoji(type: string): string {
  switch (type) {
    case "per_kg": return "\u2696\uFE0F";
    case "per_unit": return "\uD83D\uDCE6";
    case "per_piece": return "\uD83D\uDD39";
    case "per_dozen": return "\uD83D\uDCE6";
    default: return "";
  }
}

export function formatCurrency(amount: number): string {
  return "\u20B9" + amount.toFixed(2);
}

export function formatCurrencyShort(amount: number): string {
  if (amount === Math.floor(amount)) {
    return "\u20B9" + amount.toString();
  }
  return "\u20B9" + amount.toFixed(2);
}

export function generateUPILink(upiId: string, name: string, amount: number, note?: string): string {
  const safeName = name.replace(/[^a-zA-Z0-9]/g, '') || "Shop";
  let link = `upi://pay?pa=${upiId}&pn=${safeName}&am=${amount}`;
  if (note) {
    const safeNote = note.replace(/[^a-zA-Z0-9 ,.\-\/]/g, '').substring(0, 50);
    link += `&tn=${encodeURIComponent(safeNote)}`;
  }
  return link;
}

export function generatePaymentPageUrl(upiId: string, name: string, amount: number, note?: string): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const ghPagesDomain = process.env.EXPO_PUBLIC_PAYMENT_BASE_URL;
  let baseUrl = "";
  if (ghPagesDomain) {
    baseUrl = ghPagesDomain;
  } else if (domain) {
    baseUrl = `https://${domain}`;
  } else {
    return "";
  }
  let url = `${baseUrl}/pay.html?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}`;
  if (note) {
    url += `&tn=${encodeURIComponent(note)}`;
  }
  return url;
}

export function generateWhatsAppMessage(
  items: Item[],
  businessName: string,
  flashSale: boolean,
  flashDuration: number,
  phoneNumber?: string,
  shopAddress?: string,
  originalPrices?: { [itemId: string]: number },
  flashSaleStartTime?: string,
  flashSaleEndTime?: string,
): string {
  const name = businessName || "Apni Dukan";
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  let msg = "";

  if (flashSale) {
    const timeOpts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: true };
    let timeRange = "";
    if (flashSaleStartTime && flashSaleEndTime) {
      const startStr = new Date(flashSaleStartTime).toLocaleTimeString("en-IN", timeOpts);
      const endStr = new Date(flashSaleEndTime).toLocaleTimeString("en-IN", timeOpts);
      timeRange = `${startStr} to ${endStr}`;
    }
    msg += `\u26A1 *${name} - FLASH SALE!* \u26A1\n`;
    if (timeRange) {
      msg += `\u23F0 _${timeRange} only!_\n`;
    } else {
      msg += `\u23F0 _Exclusive prices for next ${flashDuration} ${flashDuration === 1 ? "hour" : "hours"} only!_\n`;
    }
    msg += `\uD83D\uDCC5 ${dateStr}\n`;
    msg += `\n${"━".repeat(28)}\n\n`;
    msg += `\uD83D\uDD25 *TODAY'S SPECIAL PRICES* \uD83D\uDD25\n\n`;
  } else {
    msg += `\uD83D\uDED2 *${name}* \uD83D\uDED2\n`;
    msg += `\uD83D\uDCC5 ${dateStr}\n`;
    msg += `\n${"━".repeat(28)}\n\n`;
    msg += `\uD83C\uDF3F *TODAY'S PRICE LIST* \uD83C\uDF3F\n\n`;
  }

  items.forEach((item, idx) => {
    const priceLabel = getPricingLabel(item.pricingType);
    const price = formatCurrencyShort(item.price);
    const origPrice = originalPrices?.[item.id];
    const hasPriceChanged = flashSale && origPrice !== undefined && origPrice !== item.price;

    msg += `${idx + 1}. *${item.name}*\n`;
    if (hasPriceChanged) {
      msg += `   ~${formatCurrencyShort(origPrice)}${priceLabel}~  \u27A1  \uD83D\uDCB0 *${price}${priceLabel}*`;
    } else {
      msg += `   \uD83D\uDCB0 ${price}${priceLabel}`;
    }
    if (item.quantity) {
      msg += `  |  \uD83D\uDCE6 ${item.quantity} available`;
    }
    msg += `\n\n`;
  });

  msg += `${"━".repeat(28)}\n\n`;

  if (flashSale) {
    const timeOpts2: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: true };
    if (flashSaleStartTime && flashSaleEndTime) {
      const startStr = new Date(flashSaleStartTime).toLocaleTimeString("en-IN", timeOpts2);
      const endStr = new Date(flashSaleEndTime).toLocaleTimeString("en-IN", timeOpts2);
      msg += `\u23F0 *Offer valid: ${startStr} - ${endStr}*\n`;
    } else {
      const endTime = new Date(today.getTime() + flashDuration * 60 * 60 * 1000);
      const endTimeStr = endTime.toLocaleTimeString("en-IN", timeOpts2);
      msg += `\u23F0 *Offer valid till ${endTimeStr}*\n`;
    }
    msg += `\u26A1 _Hurry! Limited time offer!_ \u26A1\n\n`;
  }

  if (shopAddress) {
    msg += `\uD83D\uDCCD *Address:* ${shopAddress}\n`;
  }
  if (phoneNumber) {
    msg += `\uD83D\uDCDE *Contact:* ${phoneNumber}\n`;
  }
  if (shopAddress || phoneNumber) {
    msg += `\n`;
  }

  msg += `\uD83D\uDED2 _Order now! Contact us for delivery_\n`;
  msg += `\n_Sent via ${name}_`;

  return msg;
}

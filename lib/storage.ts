import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  ITEMS: "freshcart_items",
  BILLS: "freshcart_bills",
  SETTINGS: "freshcart_settings",
  DAILY_ACCOUNTS: "freshcart_daily_accounts",
};

export interface Item {
  id: string;
  name: string;
  price: number;
  pricingType: "per_kg" | "per_unit" | "per_piece" | "per_dozen";
  imageUri: string;
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
  imageUri: string;
}

export interface Bill {
  id: string;
  customerName: string;
  flatNumber: string;
  items: BillItem[];
  totalAmount: number;
  createdAt: string;
  paid: boolean;
}

export interface Settings {
  upiId: string;
  businessName: string;
  phoneNumber: string;
}

export interface DailyAccount {
  id: string;
  date: string;
  expenses: { description: string; amount: number }[];
  totalExpense: number;
  totalSale: number;
  profit: number;
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export async function getItems(): Promise<Item[]> {
  const data = await AsyncStorage.getItem(KEYS.ITEMS);
  return data ? JSON.parse(data) : [];
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

export async function getBills(): Promise<Bill[]> {
  const data = await AsyncStorage.getItem(KEYS.BILLS);
  return data ? JSON.parse(data) : [];
}

export async function saveBill(bill: Omit<Bill, "id" | "createdAt">): Promise<Bill> {
  const bills = await getBills();
  const newBill: Bill = {
    ...bill,
    id: generateId(),
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
  const data = await AsyncStorage.getItem(KEYS.SETTINGS);
  return data ? JSON.parse(data) : { upiId: "", businessName: "", phoneNumber: "" };
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

export function formatCurrency(amount: number): string {
  return "\u20B9" + amount.toFixed(2);
}

export function generateUPILink(upiId: string, name: string, amount: number): string {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR`;
}

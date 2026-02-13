const KEYS = {
  ITEMS: "apnidukan_items",
  BILLS: "apnidukan_bills",
  SETTINGS: "apnidukan_settings",
  DAILY_ACCOUNTS: "apnidukan_daily_accounts",
  FLASH_SALE: "apnidukan_flash_sale",
};

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

function getJSON<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setJSON(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getItems(): Item[] {
  return getJSON<Item[]>(KEYS.ITEMS, []);
}

export function saveItem(item: Omit<Item, "id" | "createdAt" | "updatedAt">): Item {
  const items = getItems();
  const newItem: Item = {
    ...item,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  items.push(newItem);
  setJSON(KEYS.ITEMS, items);
  return newItem;
}

export function updateItem(id: string, updates: Partial<Item>): Item | null {
  const items = getItems();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
  setJSON(KEYS.ITEMS, items);
  return items[index];
}

export function deleteItem(id: string): void {
  const items = getItems();
  setJSON(KEYS.ITEMS, items.filter((i) => i.id !== id));
}

export function reorderItems(newItems: Item[]): void {
  setJSON(KEYS.ITEMS, newItems);
}

export function getFlashSaleState(): FlashSaleState | null {
  const data = localStorage.getItem(KEYS.FLASH_SALE);
  if (!data) return null;
  const state: FlashSaleState = JSON.parse(data);
  if (state.active && new Date(state.endTime).getTime() <= Date.now()) {
    endFlashSale();
    return null;
  }
  return state.active ? state : null;
}

export function startFlashSale(durationHours: number): FlashSaleState {
  const items = getItems();
  const originalPrices: { [itemId: string]: number } = {};
  items.forEach((item) => {
    originalPrices[item.id] = item.price;
  });
  const now = new Date();
  const state: FlashSaleState = {
    active: true,
    startTime: now.toISOString(),
    endTime: new Date(now.getTime() + durationHours * 60 * 60 * 1000).toISOString(),
    duration: durationHours,
    originalPrices,
  };
  setJSON(KEYS.FLASH_SALE, state);
  return state;
}

export function endFlashSale(): void {
  const data = localStorage.getItem(KEYS.FLASH_SALE);
  if (!data) return;
  const state: FlashSaleState = JSON.parse(data);
  if (Object.keys(state.originalPrices).length > 0) {
    const items = getItems();
    const updated = items.map((item) => {
      if (state.originalPrices[item.id] !== undefined) {
        return { ...item, price: state.originalPrices[item.id], updatedAt: new Date().toISOString() };
      }
      return item;
    });
    setJSON(KEYS.ITEMS, updated);
  }
  localStorage.removeItem(KEYS.FLASH_SALE);
}

export function getFlashSaleRemainingTime(): { hours: number; minutes: number; seconds: number } | null {
  const state = getFlashSaleState();
  if (!state) return null;
  const remaining = new Date(state.endTime).getTime() - Date.now();
  if (remaining <= 0) return null;
  return {
    hours: Math.floor(remaining / (1000 * 60 * 60)),
    minutes: Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((remaining % (1000 * 60)) / 1000),
  };
}

export function getBills(): Bill[] {
  const data = localStorage.getItem(KEYS.BILLS);
  if (!data) return [];
  const bills: Bill[] = JSON.parse(data);
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const filtered = bills.filter((b) => new Date(b.createdAt).getTime() > oneWeekAgo);
  if (filtered.length !== bills.length) {
    setJSON(KEYS.BILLS, filtered);
  }
  return filtered;
}

export function groupBillsByDate(bills: Bill[]): { date: string; dateLabel: string; bills: Bill[] }[] {
  const groups = new Map<string, Bill[]>();
  bills.forEach((bill) => {
    const dateKey = new Date(bill.createdAt).toISOString().split("T")[0];
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(bill);
  });
  const sorted = Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  return sorted.map(([date, dateBills]) => {
    let dateLabel: string;
    if (date === today) dateLabel = "Today";
    else if (date === yesterday) dateLabel = "Yesterday";
    else {
      const d = new Date(date + "T00:00:00");
      dateLabel = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    }
    return { date, dateLabel, bills: dateBills };
  });
}

function generateBillNumber(existingBills: Bill[]): string {
  const today = new Date();
  const datePrefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const todaysBills = existingBills.filter((b) => b.billNumber && b.billNumber.startsWith(datePrefix));
  return `${datePrefix}-${String(todaysBills.length + 1).padStart(3, "0")}`;
}

export function saveBill(bill: Omit<Bill, "id" | "createdAt" | "billNumber">): Bill {
  const bills = getBills();
  const newBill: Bill = {
    ...bill,
    id: generateId(),
    billNumber: generateBillNumber(bills),
    createdAt: new Date().toISOString(),
  };
  bills.unshift(newBill);
  setJSON(KEYS.BILLS, bills);
  return newBill;
}

export function updateBill(id: string, updates: Partial<Bill>): void {
  const bills = getBills();
  const index = bills.findIndex((b) => b.id === id);
  if (index !== -1) {
    bills[index] = { ...bills[index], ...updates };
    setJSON(KEYS.BILLS, bills);
  }
}

export function deleteBill(id: string): void {
  const bills = getBills();
  setJSON(KEYS.BILLS, bills.filter((b) => b.id !== id));
}

export function getSettings(): Settings {
  const data = localStorage.getItem(KEYS.SETTINGS);
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
  return { upiId: "", businessName: "", phoneNumber: "", whatsappGroups: [], qrCodeImage: undefined };
}

export function saveSettings(settings: Settings): void {
  setJSON(KEYS.SETTINGS, settings);
}

export function getDailyAccounts(): DailyAccount[] {
  return getJSON<DailyAccount[]>(KEYS.DAILY_ACCOUNTS, []);
}

export function getDailyAccount(date: string): DailyAccount | null {
  const accounts = getDailyAccounts();
  return accounts.find((a) => a.date === date) || null;
}

export function saveDailyAccount(account: Omit<DailyAccount, "id">): DailyAccount {
  const accounts = getDailyAccounts();
  const existing = accounts.findIndex((a) => a.date === account.date);
  const newAccount: DailyAccount = {
    ...account,
    id: existing !== -1 ? accounts[existing].id : generateId(),
  };
  if (existing !== -1) accounts[existing] = newAccount;
  else accounts.unshift(newAccount);
  setJSON(KEYS.DAILY_ACCOUNTS, accounts);
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

export function formatCurrencyShort(amount: number): string {
  if (amount === Math.floor(amount)) return "\u20B9" + amount.toString();
  return "\u20B9" + amount.toFixed(2);
}

export function generateUPILink(upiId: string, name: string, amount: number, note?: string): string {
  const safeName = name.replace(/[^a-zA-Z0-9]/g, "") || "Shop";
  let link = `upi://pay?pa=${upiId}&pn=${safeName}&am=${amount}`;
  if (note) {
    const safeNote = note.replace(/[^a-zA-Z0-9 ,.\-\/]/g, "").substring(0, 50);
    link += `&tn=${encodeURIComponent(safeNote)}`;
  }
  return link;
}

export function generatePaymentPageUrl(upiId: string, name: string, amount: number, note?: string): string {
  const baseUrl = window.location.origin;
  let url = `${baseUrl}/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}`;
  if (note) url += `&tn=${encodeURIComponent(note)}`;
  return url;
}

function getItemEmoji(name: string): string {
  const n = name.toLowerCase();
  const map: [string[], string][] = [
    [["mango", "aam"], "🥭"],
    [["apple", "seb"], "🍎"],
    [["banana", "kela"], "🍌"],
    [["orange", "santra", "narangi"], "🍊"],
    [["grape", "angur", "angoor"], "🍇"],
    [["watermelon", "tarbooz", "tarbuz"], "🍉"],
    [["strawberry"], "🍓"],
    [["pineapple", "ananas"], "🍍"],
    [["coconut", "nariyal"], "🥥"],
    [["lemon", "nimbu", "lime", "mosambi"], "🍋"],
    [["cherry"], "🍒"],
    [["peach", "aadu", "aaru"], "🍑"],
    [["pear", "nashpati"], "🍐"],
    [["pomegranate", "anar", "anaar"], "🫐"],
    [["papaya", "papita"], "🍈"],
    [["guava", "amrud", "amrood"], "🍏"],
    [["tomato", "tamatar"], "🍅"],
    [["potato", "aloo", "aaloo"], "🥔"],
    [["onion", "pyaz", "pyaaz", "kanda"], "🧅"],
    [["garlic", "lehsun", "lahsun"], "🧄"],
    [["carrot", "gajar"], "🥕"],
    [["corn", "makka", "makkai", "bhutta"], "🌽"],
    [["brinjal", "baingan", "eggplant"], "🍆"],
    [["chilli", "mirch", "mirchi", "pepper"], "🌶️"],
    [["cucumber", "kheera", "kakdi"], "🥒"],
    [["peas", "matar"], "🫛"],
    [["mushroom", "khumbi"], "🍄"],
    [["ginger", "adrak"], "🫚"],
    [["cabbage", "patta gobhi", "gobhi", "gobi", "cauliflower"], "🥬"],
    [["spinach", "palak"], "🥬"],
    [["radish", "muli", "mooli"], "🫚"],
    [["bean", "sem"], "🫘"],
    [["sweet potato", "shakarkand"], "🍠"],
    [["milk", "doodh", "dudh"], "🥛"],
    [["egg", "anda"], "🥚"],
    [["bread", "roti"], "🍞"],
    [["rice", "chawal", "chaaval"], "🍚"],
    [["cheese", "paneer"], "🧀"],
    [["butter", "makhan"], "🧈"],
    [["honey", "shahad", "shehad"], "🍯"],
    [["oil", "tel"], "🫒"],
    [["sugar", "cheeni"], "🍬"],
    [["tea", "chai", "patti"], "🍵"],
    [["coffee"], "☕"],
    [["curd", "dahi", "yogurt"], "🥛"],
    [["fish", "machhi", "machhli"], "🐟"],
    [["chicken", "murga", "murgi"], "🍗"],
    [["meat", "gosht", "mutton"], "🥩"],
  ];
  for (const [keywords, emoji] of map) {
    if (keywords.some((k) => n.includes(k))) return emoji;
  }
  const fruitWords = ["fruit", "phal", "fal"];
  const vegWords = ["sabzi", "sabji", "vegetable", "bhaji"];
  if (fruitWords.some((w) => n.includes(w))) return "🍎";
  if (vegWords.some((w) => n.includes(w))) return "🥬";
  return "🛒";
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "🌅 Good Morning";
  if (h < 17) return "☀️ Good Afternoon";
  return "🌆 Good Evening";
}

function getDayEmoji(): string {
  const day = new Date().getDay();
  const emojis = ["🌟", "💪", "✨", "🎯", "🔥", "🎉", "💫"];
  return emojis[day];
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
  const dateStr = today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const greeting = getGreeting();
  const dayEmoji = getDayEmoji();

  let msg = "";

  if (flashSale) {
    const timeOpts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: true };
    let timeRange = "";
    if (flashSaleStartTime && flashSaleEndTime) {
      timeRange = `${new Date(flashSaleStartTime).toLocaleTimeString("en-IN", timeOpts)} - ${new Date(flashSaleEndTime).toLocaleTimeString("en-IN", timeOpts)}`;
    }

    msg += `🚨🚨🚨 *FLASH SALE* 🚨🚨🚨\n\n`;
    msg += `⚡⚡ *${name}* ⚡⚡\n`;
    msg += `${"─".repeat(30)}\n\n`;
    msg += `${greeting}! ${dayEmoji}\n\n`;
    msg += `🔥🔥 *MEGA FLASH SALE IS LIVE!* 🔥🔥\n\n`;
    if (timeRange) {
      msg += `⏰ *${timeRange} ONLY!*\n`;
    } else {
      msg += `⏰ *Next ${flashDuration} ${flashDuration === 1 ? "hour" : "hours"} ONLY!*\n`;
    }
    msg += `💨 _Jaldi karo! Prices won't last!_\n\n`;
    msg += `📅 ${dateStr}\n\n`;
    msg += `${"━".repeat(30)}\n`;
    msg += `🏷️ *TODAY'S SPECIAL PRICES* 🏷️\n`;
    msg += `${"━".repeat(30)}\n\n`;
  } else {
    msg += `${greeting}! ${dayEmoji}\n\n`;
    msg += `🏪✨ *${name}* ✨🏪\n`;
    msg += `${"─".repeat(30)}\n\n`;
    msg += `📅 ${dateStr}\n\n`;
    msg += `${"━".repeat(30)}\n`;
    msg += `🌿🍎 *AAJ KI TAZA RATE LIST* 🥬🍅\n`;
    msg += `${"━".repeat(30)}\n\n`;
  }

  items.forEach((item, idx) => {
    const emoji = getItemEmoji(item.name);
    const priceLabel = getPricingLabel(item.pricingType);
    const priceNum = item.price;
    const priceStr = priceNum === Math.floor(priceNum) ? priceNum.toString() : priceNum.toFixed(2);
    const origPrice = originalPrices?.[item.id];
    const hasPriceChanged = flashSale && origPrice !== undefined && origPrice !== item.price;

    msg += `${emoji} *${item.name}*\n`;
    if (hasPriceChanged) {
      const origStr = origPrice === Math.floor(origPrice) ? origPrice.toString() : origPrice.toFixed(2);
      const saved = Math.round(origPrice - priceNum);
      msg += `     ❌ ~₹${origStr}${priceLabel}~\n`;
      msg += `     🔥 *💰 ₹${priceStr}${priceLabel}*  ✅ SAVE 💰₹${saved}!\n`;
    } else {
      msg += `     💰 *₹${priceStr}*${priceLabel}\n`;
    }
    if (item.quantity) {
      msg += `     📦 _${item.quantity} available_\n`;
    }
    if (idx < items.length - 1) msg += `\n`;
  });

  msg += `\n${"━".repeat(30)}\n\n`;

  if (flashSale) {
    const timeOpts2: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: true };
    msg += `🚨 *DON'T MISS OUT!* 🚨\n`;
    if (flashSaleStartTime && flashSaleEndTime) {
      msg += `⏰ Sale ends: *${new Date(flashSaleEndTime).toLocaleTimeString("en-IN", timeOpts2)}*\n`;
    } else {
      const endTime = new Date(today.getTime() + flashDuration * 60 * 60 * 1000);
      msg += `⏰ Sale ends: *${endTime.toLocaleTimeString("en-IN", timeOpts2)}*\n`;
    }
    msg += `⚡ _Pehle aao pehle paao!_ ⚡\n\n`;
  }

  msg += `🛍️ *ORDER KAISE KAREIN?*\n`;
  msg += `${"─".repeat(30)}\n`;
  if (phoneNumber) {
    msg += `📞 Call/WhatsApp: *${phoneNumber}*\n`;
  }
  if (shopAddress) {
    msg += `📍 Visit: _${shopAddress}_\n`;
  }
  msg += `🚚 _Home delivery available!_\n\n`;

  msg += `${"─".repeat(30)}\n`;
  msg += `💚 _Taza maal, sahi daam!_ 💚\n`;
  msg += `🙏 _Aapka bharosa hi hamari taakat hai_\n\n`;
  msg += `_Powered by *${name}*_ 🏪`;
  return msg;
}

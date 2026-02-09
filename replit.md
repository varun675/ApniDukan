# Apni Dukan

## Overview

Apni Dukan is a mobile-first grocery shop management app built with Expo (React Native) and an Express backend. It allows vendors to manage a text-only catalog of items (fruits, vegetables, etc.), share daily price lists via WhatsApp with attractive emoji-rich formatting, create customer bills with UPI payment QR codes, track daily accounts (expenses and sales), view business analytics, and manage business settings including WhatsApp group lists. The app uses a tab-based navigation with five sections: Items, Bills, Accounts, Summary, and Settings.

## Recent Changes (Feb 2026)

- Rebranded from FreshCart to Apni Dukan with new app icon and warm orange/green theme
- Simplified item management to text-only (removed camera/image functionality entirely)
- Implemented Flash Sale feature with 1-6 hour duration selector and special WhatsApp message formatting
- Added WhatsApp group management in Settings with sequential sharing workflow (modal guides user through each group)
- Built attractive emoji-rich WhatsApp message formatting for price lists and bills
- Created Summary tab with bar charts for daily expenses, sales, and profit/loss analytics over 7/14/30 day periods
- AsyncStorage keys changed from `freshcart_*` to `apnidukan_*`
- Added QR code upload in Settings for custom payment QR images
- Built universal /pay endpoint: branded HTML page that auto-detects device and opens customer's preferred UPI app (PhonePe, GPay, Paytm, WhatsApp Pay). Uses upi:// deep link with Android intent:// fallback. Includes manual copy UPI ID option.
- Settings has separate PhonePe UPI ID, Google Pay UPI ID, and General UPI ID fields
- WhatsApp bill messages include a single universal payment link that works across all UPI apps on iOS and Android

## User Preferences

- Preferred communication style: Simple, everyday language
- No images/photos in item management — text-only for simplicity and speed
- WhatsApp messages should be "very attractive and eye-catching" with heavy emoji formatting
- Flash sale with time-limited exclusive pricing is important
- Sequential WhatsApp group sharing (save group names, share one-by-one quickly)
- App name "Apni Dukan" should appear in WhatsApp message headers
- Color scheme: Warm orange (#FF8F00) primary, green accent — local market aesthetic

## System Architecture

### Frontend (Expo / React Native)
- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture (`newArchEnabled: true`)
- **Routing**: expo-router v6 with file-based routing. The app uses a tab layout (`app/(tabs)/`) with five tabs (Items, Bills, Accounts, Summary, Settings) and modal screens for add-item, create-bill, and bill-detail
- **State Management**: Local state with React hooks. Data fetching uses `@tanstack/react-query` with a custom query client configured in `lib/query-client.ts`. Screen-level data loading uses `useFocusEffect` callbacks
- **Data Storage**: Primary data persistence is via `@react-native-async-storage/async-storage` (see `lib/storage.ts`). Items, bills, settings, and daily accounts are stored as JSON in AsyncStorage with keys prefixed `apnidukan_`. This is local-only storage on the device
- **Fonts**: Nunito font family loaded via `@expo-google-fonts/nunito` (Regular, SemiBold, Bold, ExtraBold)
- **UI Components**: Custom components with React Native primitives. Uses `expo-haptics` for tactile feedback, `expo-blur` and `expo-glass-effect` for visual effects, `react-native-qrcode-svg` for QR code generation
- **Platform Support**: iOS, Android, and Web. Platform-specific code handles differences (e.g., haptics only on native, keyboard handling varies by platform)
- **No Image Handling**: Items are text-only (no camera or image picker needed for items)

### Backend (Express)
- **Framework**: Express v5 running on Node.js
- **Location**: `server/` directory with `index.ts` (entry point), `routes.ts` (API route registration), and `storage.ts` (data storage interface)
- **Current State**: The backend is mostly a skeleton. It has CORS setup for Replit domains and localhost, serves static files in production, but has minimal API routes
- **Development**: Uses `tsx` for TypeScript execution in dev mode. Production builds use `esbuild` to bundle to `server_dist/`

### Key Data Models (AsyncStorage-based in `lib/storage.ts`)
- **Item**: Product catalog entry with id, name, price, pricingType (per_kg/per_unit/per_piece/per_dozen), quantity (optional text)
- **Bill**: Customer invoice with customerName, flatNumber, items array, totalAmount, paid status
- **BillItem**: Line item on a bill with quantity and calculated total
- **Settings**: Business config with upiId, businessName, phoneNumber, whatsappGroups (array of {id, name})
- **DailyAccount**: Daily financial tracking with expenses and sales amounts
- **WhatsAppGroup**: Simple {id, name} for saved WhatsApp group references

### Key Features
- **Flash Sale**: Toggle on Items screen enables flash sale mode with 1-6 hour duration picker. Changes WhatsApp message to include urgency indicators and time-limited offer text
- **WhatsApp Sharing**: Generates emoji-rich, attractive price list messages. If WhatsApp groups are saved in settings, a modal guides sequential sharing to each group
- **Bill Generation**: Two-step flow (customer details → item selection). Bills include UPI QR code for payment
- **Daily Accounts**: Track expenses and sales per day
- **Summary Analytics**: Bar charts showing expenses, sales, and profit/loss over 7/14/30 day periods

### Build & Development
- **Dev Mode**: Two processes needed — `expo:dev` for the Expo dev server and `server:dev` for the Express backend
- **Production Build**: `scripts/build.js` handles building the Expo web app for static serving
- **Proxy Setup**: In development, the Expo web client connects to the Express server via `EXPO_PUBLIC_DOMAIN` environment variable

### Navigation Structure
```
app/
├── _layout.tsx          # Root layout with QueryClientProvider, fonts, gesture handler
├── (tabs)/
│   ├── _layout.tsx      # Tab navigator (native tabs on iOS 26+, classic tabs elsewhere)
│   ├── index.tsx        # Items catalog tab (with Flash Sale, WhatsApp share)
│   ├── bills.tsx        # Bills list tab
│   ├── accounts.tsx     # Daily accounts tab
│   ├── summary.tsx      # Business analytics/charts tab
│   └── settings.tsx     # Business settings tab (with WhatsApp groups)
├── add-item.tsx         # Modal: Add/edit item (text-only, no camera)
├── create-bill.tsx      # Modal: Create new bill
└── bill-detail.tsx      # Modal: View bill details with QR code
```

## External Dependencies

- **UPI Payment Integration**: The app generates UPI deep links and QR codes for payment collection. Uses the `upi://pay` URL scheme with merchant's configured UPI ID
- **AsyncStorage**: Primary client-side data persistence (no cloud sync currently)
- **Expo Services**: Uses various Expo SDK modules (haptics, blur, glass-effect, etc.)
- **React Query**: Configured for API communication with the Express backend, though most data currently flows through AsyncStorage
- **Google Fonts**: Nunito font family loaded from `@expo-google-fonts`

# FreshCart

## Overview

FreshCart is a mobile-first grocery/fresh produce billing and inventory management app built with Expo (React Native) and an Express backend. It allows vendors to manage a catalog of items (fruits, vegetables, etc.), create customer bills, track daily accounts (expenses and sales), generate UPI payment QR codes, and manage business settings. The app uses a tab-based navigation with four sections: Items, Bills, Accounts, and Settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)
- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture (`newArchEnabled: true`)
- **Routing**: expo-router v6 with file-based routing. The app uses a tab layout (`app/(tabs)/`) with four tabs (Items, Bills, Accounts, Settings) and modal screens for add-item, create-bill, and bill-detail
- **State Management**: Local state with React hooks. Data fetching uses `@tanstack/react-query` with a custom query client configured in `lib/query-client.ts`. Screen-level data loading uses `useFocusEffect` callbacks
- **Data Storage**: Primary data persistence is via `@react-native-async-storage/async-storage` (see `lib/storage.ts`). Items, bills, settings, and daily accounts are stored as JSON in AsyncStorage with keys prefixed `freshcart_`. This is local-only storage on the device
- **Fonts**: Nunito font family loaded via `@expo-google-fonts/nunito` (Regular, SemiBold, Bold, ExtraBold)
- **UI Components**: Custom components with React Native primitives. Uses `expo-image` for optimized image display, `expo-haptics` for tactile feedback, `expo-blur` and `expo-glass-effect` for visual effects, `react-native-qrcode-svg` for QR code generation
- **Platform Support**: iOS, Android, and Web. Platform-specific code handles differences (e.g., haptics only on native, keyboard handling varies by platform)
- **Image Handling**: `expo-image-picker` for selecting item photos, `expo-camera` for taking photos

### Backend (Express)
- **Framework**: Express v5 running on Node.js
- **Location**: `server/` directory with `index.ts` (entry point), `routes.ts` (API route registration), and `storage.ts` (data storage interface)
- **Current State**: The backend is mostly a skeleton. It has CORS setup for Replit domains and localhost, serves static files in production, but has minimal API routes (just a user CRUD interface using in-memory storage)
- **Storage Layer**: `server/storage.ts` defines an `IStorage` interface with a `MemStorage` implementation (in-memory Map). Currently only handles users. The storage interface pattern allows swapping to database-backed storage later
- **Development**: Uses `tsx` for TypeScript execution in dev mode. Production builds use `esbuild` to bundle to `server_dist/`

### Database Schema (Drizzle ORM)
- **ORM**: Drizzle ORM with PostgreSQL dialect configured in `drizzle.config.ts`
- **Schema**: Defined in `shared/schema.ts`. Currently has only a `users` table with `id` (UUID, auto-generated), `username` (unique text), and `password` (text)
- **Validation**: Uses `drizzle-zod` to generate Zod schemas from Drizzle table definitions
- **Current Usage**: The database schema exists but the app primarily uses AsyncStorage for data. The Drizzle/Postgres setup is scaffolded but not deeply integrated with the app's core features yet. The `DATABASE_URL` environment variable is required for Drizzle config

### Key Data Models (AsyncStorage-based in `lib/storage.ts`)
- **Item**: Product catalog entry with id, name, price, pricingType (per_kg/per_unit/per_piece/per_dozen), imageUri, quantity
- **Bill**: Customer invoice with customerName, flatNumber, items array, totalAmount, paid status
- **BillItem**: Line item on a bill with quantity and calculated total
- **Settings**: Business config with upiId, businessName, phoneNumber
- **DailyAccount**: Daily financial tracking with expenses and sales amounts

### Build & Development
- **Dev Mode**: Two processes needed — `expo:dev` for the Expo dev server and `server:dev` for the Express backend
- **Production Build**: `scripts/build.js` handles building the Expo web app for static serving. The Express server serves the built static files in production
- **Proxy Setup**: In development, the Expo web client connects to the Express server via `EXPO_PUBLIC_DOMAIN` environment variable. CORS is configured to allow Replit domains and localhost origins

### Navigation Structure
```
app/
├── _layout.tsx          # Root layout with QueryClientProvider, fonts, gesture handler
├── (tabs)/
│   ├── _layout.tsx      # Tab navigator (native tabs on iOS 26+, classic tabs elsewhere)
│   ├── index.tsx        # Items catalog tab
│   ├── bills.tsx        # Bills list tab
│   ├── accounts.tsx     # Daily accounts tab
│   └── settings.tsx     # Business settings tab
├── add-item.tsx         # Modal: Add/edit item
├── create-bill.tsx      # Modal: Create new bill
└── bill-detail.tsx      # Modal: View bill details with QR code
```

## External Dependencies

- **PostgreSQL**: Required for Drizzle ORM (needs `DATABASE_URL` environment variable). Currently scaffolded but not the primary data store
- **UPI Payment Integration**: The app generates UPI deep links and QR codes for payment collection. Uses the `upi://pay` URL scheme with merchant's configured UPI ID
- **AsyncStorage**: Primary client-side data persistence (no cloud sync currently)
- **Expo Services**: Uses various Expo SDK modules (camera, image picker, file system, haptics, etc.)
- **React Query**: Configured for API communication with the Express backend, though most data currently flows through AsyncStorage
- **Google Fonts**: Nunito font family loaded from `@expo-google-fonts`
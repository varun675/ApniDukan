# Apni Dukan

## Overview

Apni Dukan is a mobile-first grocery shop management Progressive Web App (PWA) built with React + Vite and an Express backend. It allows vendors to manage a text-only catalog of items (fruits, vegetables, etc.), share daily price lists via WhatsApp with attractive emoji-rich formatting, create customer bills with UPI payment QR codes, track daily accounts (expenses and sales), view business analytics, and manage business settings including WhatsApp group lists. The app uses a tab-based navigation with five sections: Items, Bills, Accounts, Summary, and Settings. Branded as Codesmotech Consulting Pvt Ltd.

## Recent Changes (Feb 2026)

- **Migrated from Expo/React Native to pure React + Vite** for web-only deployment
- Replaced AsyncStorage with localStorage (synchronous API in `client/src/lib/storage.ts`)
- Replaced expo-router with react-router-dom (BrowserRouter with Routes)
- Replaced React Native components with standard HTML/CSS
- Replaced @expo/vector-icons with react-icons/io5
- Replaced react-native-qrcode-svg with qrcode.react (QRCodeSVG)
- Server now uses Vite middleware in development, serves built React app in production
- All app UI served on port 5000 through Express + Vite middleware
- Bill retention extended from 7 days to 90 days
- Settings auto-save on every change (800ms debounce, no manual Save button)
- Data backup/restore: Export all data as JSON file, import from backup file (in Settings > Data Backup)
- Bills search now works by customer name AND bill number
- Accounts page shows auto-calculated daily sales from bills with "Use this" button

## User Preferences

- Preferred communication style: Simple, everyday language
- No images/photos in item management — text-only for simplicity and speed
- WhatsApp messages should be "very attractive and eye-catching" with heavy emoji formatting
- Flash sale with time-limited exclusive pricing is important
- Sequential WhatsApp group sharing (save group names, share one-by-one quickly)
- App name "Apni Dukan" should appear in WhatsApp message headers
- Color scheme: Warm orange (#FF8F00) primary, green accent — local market aesthetic

## System Architecture

### Frontend (React + Vite)
- **Framework**: React 19 with Vite bundler, TypeScript
- **Location**: `client/` directory with `src/` containing all source files
- **Entry**: `client/index.html` → `client/src/main.tsx` → `client/src/App.tsx`
- **Routing**: react-router-dom v7 with BrowserRouter. Tab pages in `client/src/pages/`, layout in `client/src/components/Layout.tsx`
- **State Management**: Local state with React hooks (useState, useEffect)
- **Data Storage**: localStorage via synchronous helper functions in `client/src/lib/storage.ts`. Keys prefixed `apnidukan_`
- **Fonts**: Nunito font family loaded via Google Fonts CDN in index.html
- **Icons**: react-icons/io5 (Ionicons 5)
- **QR Codes**: qrcode.react (QRCodeSVG component)
- **Styling**: Inline React.CSSProperties with max-width 480px centered mobile-first layout
- **CSS**: Global styles in `client/src/index.css`

### Backend (Express)
- **Framework**: Express v5 running on Node.js
- **Location**: `server/` directory with `index.ts` (entry point), `routes.ts` (API routes)
- **Dev Mode**: Uses Vite middleware mode to serve the React app with HMR on port 5000
- **Production**: Serves built React app from `dist/public/` as static files
- **API Routes**: `/pay` and `/pay.html` endpoints for UPI payment page
- **Development**: Uses `tsx` for TypeScript execution (`npm run server:dev`)

### Key Data Models (localStorage-based in `client/src/lib/storage.ts`)
- **Item**: Product catalog entry with id, name, price, pricingType (per_kg/per_unit/per_piece/per_dozen), quantity (optional text)
- **Bill**: Customer invoice with billNumber, customerName, flatNumber, items array, totalAmount, paid status
- **BillItem**: Line item on a bill with quantity and calculated total
- **Settings**: Business config with upiId, phonepeUpiId, gpayUpiId, businessName, phoneNumber, shopAddress, paymentQrImage, whatsappGroups
- **DailyAccount**: Daily financial tracking with expenses array and totalSale
- **WhatsAppGroup**: Simple {id, name} for saved WhatsApp group references
- **FlashSaleState**: active flag, duration, startTime, endTime, originalPrices map

### Key Features
- **Flash Sale**: Toggle on Items screen enables flash sale mode with 1-6 hour duration picker. Changes WhatsApp message to include urgency indicators and time-limited offer text
- **WhatsApp Sharing**: Generates emoji-rich, attractive price list messages. If WhatsApp groups are saved in settings, a modal guides sequential sharing to each group. Opens wa.me links
- **Bill Generation**: Two-step flow (customer details → item selection). Bills include auto-generated bill numbers and UPI QR code for payment
- **Daily Accounts**: Track expenses and sales per day with add/edit functionality
- **Summary Analytics**: Bar charts showing expenses, sales, and profit/loss over 7/14/30 day periods
- **UPI Payment Page**: Server-rendered `/pay` endpoint with branded HTML that opens PhonePe, GPay, or Paytm via deep links

### Build & Development
- **Dev Mode**: Single process — `npm run server:dev` starts Express with Vite middleware on port 5000
- **Production Build**: `npx vite build` builds React app to `dist/public/`, Express serves it statically
- **Path Aliases**: `@/` maps to `client/src/` via Vite config and TypeScript `client/tsconfig.json`

### Navigation Structure
```
client/src/
├── main.tsx              # React entry point with BrowserRouter
├── App.tsx               # Route definitions
├── index.css             # Global styles
├── components/
│   └── Layout.tsx        # Tab layout with bottom navigation bar
├── constants/
│   └── colors.ts         # App color constants
├── lib/
│   └── storage.ts        # localStorage data layer (all synchronous)
└── pages/
    ├── Items.tsx          # Items catalog tab (with Flash Sale, WhatsApp share)
    ├── Bills.tsx          # Bills list tab (grouped by date)
    ├── Accounts.tsx       # Daily accounts tab
    ├── Summary.tsx        # Business analytics/charts tab
    ├── Settings.tsx       # Business settings tab (with WhatsApp groups, QR upload)
    ├── AddItem.tsx        # Add/edit item page
    ├── CreateBill.tsx     # Create new bill (two-step flow)
    └── BillDetail.tsx     # View bill details with QR code
```

## External Dependencies

- **UPI Payment Integration**: The app generates UPI deep links and QR codes for payment collection. Uses the `upi://pay` URL scheme
- **localStorage**: Primary client-side data persistence (no cloud sync)
- **Google Fonts CDN**: Nunito font family
- **WhatsApp Web**: Opens wa.me links for sharing price lists and bills

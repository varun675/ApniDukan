# Apni Dukan - Billing & Shop Management App

A modern, mobile-first Progressive Web App (PWA) for managing a grocery shop with billing, inventory, and payment tracking.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)

## ✨ Features

- 📱 **Mobile-First Design**: Optimized for mobile devices with responsive scaling for tablets and desktops
- 📊 **Billing Management**: Create and track bills with UPI payment integration
- 💰 **Accounts & Summary**: Daily sales tracking and financial summaries
- 🛒 **Inventory Management**: Manage items with multiple pricing types
- 📱 **PWA Ready**: Install as native app on mobile and desktop
- 🔒 **Offline Support**: Full offline functionality with cached data
- 💾 **Local Storage**: All data stored locally with localStorage
- 🎨 **Dark Mode Ready**: Theme-aware design system
- ♿ **Accessible**: WCAG compliant with keyboard navigation
- 🚀 **Fast**: Optimized performance with lazy loading

## 🛠️ Tech Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: CSS-in-JS with responsive utilities
- **Routing**: React Router v7
- **Icons**: React Icons
- **QR Code**: qrcode.react
- **Build**: Vite 7.3.1
- **PWA**: Service Workers + Web Manifest

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/varun675/ApniDukan.git
cd ApniDukan
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Development Server
```bash
npm run dev
```
Open http://localhost:5173 in your browser

### 4. Build for Production
```bash
npm run build
```

### 5. Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
ApniDukan/
├── client/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── lib/                 # Utilities & storage
│   │   ├── constants/           # App constants
│   │   ├── App.tsx              # Main app component
│   │   ├── main.tsx             # Entry point
│   │   ├── index.css            # Base styles
│   │   └── responsive.css       # Responsive utilities
│   ├── public/                  # Static assets
│   │   ├── manifest.json        # PWA manifest
│   │   ├── sw.js                # Service Worker
│   │   └── index.html           # Entry HTML
│   └── index.html
├── public/                      # Static files
├── .github/
│   └── workflows/               # GitHub Actions
├── package.json
├── vite.config.ts              # Vite configuration
└── tsconfig.json               # TypeScript config
```

## 🎯 Mobile Responsiveness

The app is designed with a mobile-first approach:

- **Mobile (320-480px)**: Full optimization with 44px touch targets
- **Tablet (481-768px)**: Scaled layouts with 48px touch targets
- **Desktop (769px+)**: Multi-column layouts with sidebar navigation

## 🛡️ PWA Features

### Service Worker
- Cache-first strategy for static assets
- Network-first strategy for API calls
- Automatic cache invalidation
- Offline fallback pages

### Web Manifest
- App name and description
- StartURL and scope
- Icons for different resolutions
- App shortcuts to key features
- Maskable icons for adaptive display

### Installation
1. Open the app in a modern browser
2. Click "Install" button (or menu > Install)
3. App runs as a native application
4. Offline access to all cached content

## 📊 Data Management

### LocalStorage Keys
- `apnidukan_items`: Inventory items
- `apnidukan_bills`: Bill history
- `apnidukan_settings`: App settings
- `apnidukan_daily_accounts`: Daily records
- `apnidukan_flash_sale`: Flash sale state

### Data Retention
- Bills kept for 90 days
- Today's data always preserved
- Automatic data validation
- Error recovery with fallbacks

## 🔐 Security

- No backend required - all data local
- No authentication needed
- HTTPS ready for deployment
- XSS protection with React
- CSRF tokens if needed for API integration

## 🚀 Deployment

### GitHub Pages
```bash
npm run build
# Deploy dist/ folder to GitHub Pages
```

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Connect repository to Netlify
# Build command: npm run build
# Publish directory: dist
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## 📊 GitHub Actions

Automated workflows included:

1. **CI/CD Pipeline**
   - Lint code
   - Build project
   - Run tests
   - Security audit
   - Upload artifacts

2. **PWA Lighthouse Audit**
   - Weekly performance checks
   - PWA compliance verification
   - Accessibility audit

3. **Notifications**
   - Build status updates
   - Test results
   - Deployment confirms

### Enable Actions
1. Push code to repository
2. Go to Actions tab
3. Workflows automatically trigger on push

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with React and Vite
- Icons from React Icons
- QR generation with qrcode.react
- Mobile-first approach inspired by PWA best practices

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/varun675/ApniDukan/issues
- Email: support@apnidukan.app

## 🎯 Roadmap

- [ ] Backend API integration
- [ ] Cloud sync for multi-device
- [ ] Advanced analytics
- [ ] Receipt printing
- [ ] SMS notifications
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Customer management

---

**Made with ❤️ for small business owners**

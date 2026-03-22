# MTD Master

A secure, privacy-focused Windows Electron application for UK Making Tax Digital (MTD) tax returns.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Windows 10/11
- Visual Studio Build Tools (for native dependencies)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Run in development mode:**
```bash
npm run electron:dev
```

This will:
- Start the Vite dev server
- Launch Electron with hot-reload enabled

### Build for Production

```bash
npm run build
```

This creates a standalone `.exe` installer in the `release/` directory.

## 📁 Project Structure

```
mtd-master/
├── electron/           # Electron main process
│   ├── main.ts        # Main process entry
│   └── preload.ts     # Preload script (IPC bridge)
├── src/               # React frontend
│   ├── components/    # Reusable UI components
│   ├── pages/         # Page components
│   ├── stores/        # Zustand state management
│   ├── types/         # TypeScript type definitions
│   ├── App.tsx        # Root component
│   └── main.tsx       # React entry point
├── public/            # Static assets
└── package.json       # Dependencies and scripts
```

## 🔐 Security Features

- **AES-256 Encryption**: All data encrypted with SQLCipher
- **OS Keychain Integration**: Secure credential storage
- **Auto-lock**: Automatic session timeout
- **Privacy-First**: All data stays local on your device

## 🛠️ Technology Stack

- **Electron 32** - Desktop framework
- **React 18** - UI library
- **TypeScript 5** - Type safety
- **Vite 5** - Build tool
- **Tailwind CSS 3** - Styling
- **SQLCipher** - Encrypted database
- **Drizzle ORM** - Type-safe database queries
- **Zustand** - State management

## 📋 Development Roadmap

See [plan.md](plan.md) for the complete implementation plan.

### Phase 1: Foundation (Current)
- [x] Project setup
- [x] Styled UI
- [x] Transaction management
- [x] Categorization engine
- [x] Electron .exe and .exe setup builds

### Phase 2-4: Coming Soon
- Open Banking integration
- Tax calculations
- Reports & MTD export
- Credit card inputs and processing (digital)

## 🧪 Testing

```bash
# Run type checking
npm run typecheck

# Run linter
npm run lint
```

## 📝 License

Private - All rights reserved

## ⚠️ Disclaimer

This software is a **bookkeeping tool**, not tax advice. Always consult a qualified accountant before submitting tax returns.
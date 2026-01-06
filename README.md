# Splitify 💰

A modern expense splitting app built with React Native and Expo.

## 🗂️ Project Structure

This project follows a well-organized folder structure for better maintainability and scalability:

```
splitify/
├── 📁 src/                          # Main source code
│   ├── 📁 components/               # React components
│   │   ├── 📁 common/              # Shared/reusable components
│   │   ├── 📁 ui/                  # Pure UI components
│   │   ├── 📁 forms/               # Form components
│   │   └── 📄 index.ts             # Component exports
│   ├── 📁 screens/                 # Screen components
│   │   ├── 📁 auth/                # Authentication screens
│   │   ├── 📁 main/                # Main app screens
│   │   └── 📄 index.ts             # Screen exports
│   ├── 📁 services/                # External service integrations
│   │   ├── 📁 firebase/            # Firebase services
│   │   ├── 📁 api/                 # REST API client
│   │   └── 📄 index.ts             # Service exports
│   ├── 📁 navigation/              # Navigation configuration
│   ├── 📁 hooks/                   # Custom React hooks
│   ├── 📁 utils/                   # Utility functions
│   ├── 📁 types/                   # TypeScript definitions
│   ├── 📁 constants/               # App constants
│   └── 📁 store/                   # State management
├── 📁 app/                         # Expo Router (routing only)
├── 📁 assets/                      # Static assets
└── 📁 scripts/                     # Build scripts
```

## 🚀 Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd splitify
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

4. **Run on different platforms**
   ```bash
   npm run android  # Android
   npm run ios      # iOS
   npm run web      # Web
   ```

## 📋 Features

- ✅ User authentication with Firebase
- ✅ Email verification
- ✅ Modern UI with themed components
- ✅ TypeScript support
- ✅ Path mapping for clean imports
- ✅ Organized component structure
- ⏳ Expense tracking (coming soon)
- ⏳ Group management (coming soon)
- ⏳ Bill splitting (coming soon)

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **State Management**: Context API (with plans for Redux/Zustand)
- **Styling**: StyleSheet (React Native)

## 📚 Documentation

For detailed information about the folder structure and development guidelines, see:

- [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) - Complete folder structure guide
- [PROJECT_REPORT.md](PROJECT_REPORT.md) - Project overview, scope, and resources

## 🔧 Development

The project uses path mapping configured in `tsconfig.json` for cleaner imports:

```typescript
// Instead of relative paths
import { Button } from "../../components/ui/button";

// Use clean imports
import { Button } from "@/components/ui";
```

## 🚨 Fixed Issues

✅ **Folder Structure Reorganized**: Moved all files to a proper `src/` structure
✅ **Import Paths Fixed**: Updated all import statements to match new structure
✅ **TypeScript Path Mapping**: Configured for cleaner imports
✅ **Asset Paths Corrected**: Fixed all asset import paths

## 📱 Screenshots

_Coming soon..._

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Happy coding! 🎉**

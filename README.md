# Splitify 💰

A modern expense splitting app built with React Native and Expo. Seamlessly effectively track bills, share expenses, and settle debts with friends.

## 🗂️ Project Structure

This project follows a well-organized folder structure for better maintainability and scalability:

```
splitify/
├── 📁 src/                          # Main source code
│   ├── 📁 components/               # React components
│   │   ├── � ConfirmationModal.tsx # Reusable confirmation dialog
│   │   ├── 📄 SuccessModal.tsx      # Custom success feedback
│   │   ├── � InputModal.tsx        # Text input modal
│   │   └── 📄 AuthProvider.tsx      # Authentication context
│   ├── 📁 screens/                 # Screen components
│   │   ├── � auth/                # Login/Signup flow
│   │   ├── 📁 main/                # Main app screens
│   │   │   ├── 📁 home/            # Dashboard & Group List
│   │   │   ├── 📁 create-group/    # Group creation flow
│   │   │   ├── 📁 group-detail/    # Group expenses & members
│   │   │   ├── 📁 group-summary/   # Settlement & Insight charts
│   │   │   ├── 📁 add-expense/     # Expense entry form
│   │   │   └── 📁 profile/         # User profile settings
│   │   └── 📄 index.ts             # Screen exports
│   ├── 📁 backend/                 # Backend logic (Firebase/Services)
│   │   ├── 📁 services/            # Business logic
│   │   │   ├── 📄 ExpenseService.ts
│   │   │   ├── 📄 GroupService.ts
│   │   │   └── 📄 UserService.ts
│   │   ├── 📁 models/              # Data models (Interfaces)
│   │   ├── 📁 dao/                 # Data Access Objects (Firestore)
│   │   ├── 📁 config/              # Configuration (Firebase init)
│   │   └── 📁 utils/               # Backend utilities
│   ├── 📁 navigation/              # Navigation configuration
│   ├── 📁 store/                   # State management (Context/Reducer)
│   ├── 📁 types/                   # TypeScript definitions
│   └── 📁 constants/               # App constants
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

### Core
- ✅ **User Authentication**: Secure login and signup with Firebase Auth.
- ✅ **Group Management**: Create groups, invite friends via code, and manage members.
- ✅ **Expense Tracking**: Add expenses with categories, descriptions, and custom splits.
- ✅ **Bill Splitting**: Supports Equal, Percentage, and Custom split methods.

### Smart Logic
- ✅ **Seamless Settlements**: Smart algorithms to calculate the most efficient way to settle debts.
- ✅ **Detailed Insights**: View top spenders, expense trends, and category breakdowns.
- ✅ **Admin Controls**: Group creators (hosts) can manage group settings and delete groups.

### UX/UI
- ✅ **Modern Aesthetics**: Premium "Gold & White" theme with glassmorphism and smooth animations.
- ✅ **Visual Feedback**: Custom success modals and confirmation dialogs for critical actions.
- ✅ **Real-time Updates**: Auto-refresh on status changes and settlement confirmations.

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **State Management**: Context API
- **Styling**: StyleSheet (React Native) with Animated (Reanimated)

## 📚 Documentation

For detailed information about the folder structure and development guidelines, see:

- [FOLDER_STRUCTURE.md](Text/FOLDER_STRUCTURE.md) - Complete folder structure guide
- [PROJECT_REPORT.md](Text/PROJECT_REPORT.md) - Project overview, scope, and resources

## 🔧 Development

The project uses path mapping configured in `tsconfig.json` for cleaner imports:

```typescript
// Instead of relative paths
import { Button } from "../../components/ui/button";

// Use clean imports
import { Button } from "@/components/ui";
```

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

# 📁 Splitify Folder Structure

This document explains the current folder structure for the Splitify React Native/Expo application.

## 🏗️ Structure Overview

```
splitify/
├── src/                          # Main source code
│   ├── components/              # React components
│   │   ├── ConfirmationModal.tsx # Reusable confirmation dialog
│   │   ├── SuccessModal.tsx      # Custom success feedback
│   │   ├── InputModal.tsx        # Text input modal
│   │   └── AuthProvider.tsx      # Authentication context
│   ├── screens/                 # Screen components
│   │   ├── auth/               # Login/Signup flow
│   │   └── main/               # Main app screens
│   │       ├── home/           # Dashboard & Group List
│   │       ├── create-group/   # Group creation flow
│   │       ├── group-detail/   # Group expenses & members
│   │       ├── group-summary/  # Settlement & Insight charts
│   │       ├── add-expense/    # Expense entry form
│   │       └── profile/        # User profile settings
│   ├── backend/                 # Backend logic (Firebase/Firestore)
│   │   ├── services/           # Business logic
│   │   │   ├── ExpenseService.ts
│   │   │   ├── GroupService.ts
│   │   │   └── UserService.ts
│   │   ├── models/             # Data models (TypeScript Interfaces)
│   │   ├── dao/                # Data Access Objects (Firestore operations)
│   │   └── config/             # Configuration (Firebase init)
│   ├── navigation/             # Navigation configuration
│   ├── store/                  # State management (Context/Reducer)
│   ├── types/                  # TypeScript definitions
│   └── constants/              # App constants (Colors, etc.)
├── app/                        # Expo Router app directory (routing only)
├── assets/                     # Static assets (images, fonts, etc.)
└── scripts/                    # Build and utility scripts
```

## 📂 Detailed Descriptions

### `src/components/`
Contains reusable UI components. We kept it flat for simplicity as the library is small.
- **Modals**: `ConfirmationModal`, `SuccessModal` for critical user alerts.

### `src/screens/`
Contains the application's pages.
- **`auth/`**: Screens for unauthenticated users (Login, Signup).
- **`main/`**: The core application screens, organized by feature (Home, Groups, etc.).

### `src/backend/`
Handles all business logic and data persistence.
- **`services/`**: High-level operations (e.g., `deleteGroup`, `confirmSettlement`). These functions are called by the UI.
- **`dao/`**: Direct database operations. Services call DAOs; UI does NOT call DAOs directly.
- **`models/`**: TypeScript interfaces defining the shape of our data (e.g., `Group`, `Expense`).

### `src/store/`
Global state management using React Context + useReducer (`AppContext`).
- Manages `user` session and global `groups` data.

### `src/types/`
Shared TypeScript definitions used across frontend and backend.

## 📝 Usage Guidelines

### Imports
We use path mapping for clean imports:
```typescript
import { GroupService } from "@/backend/services";
import { SuccessModal } from "@/components/SuccessModal";
```

### Adding New Features
1.  **Model**: Define data types in `src/backend/models/`.
2.  **DAO**: Implement low-level DB functions in `src/backend/dao/`.
3.  **Service**: Combine DAOs into business logic in `src/backend/services/`.
4.  **UI**: Create the screen in `src/screens/main/` and hook it up to the Service.

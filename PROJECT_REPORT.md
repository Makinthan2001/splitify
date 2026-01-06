# Splitify: Group Expense Sharing Application

## 1. Introduction

### 1.1. Project Title

Splitify: Group Expense Sharing Application

### 1.2. Project Background

Splitting costs fairly across friends, roommates, and teams is a common need in daily life—trips, dinners, subscriptions, utilities, and events all create shared expenses. Traditional approaches rely on manual spreadsheets, chat threads, and gut-feel tracking, which are error-prone and time-consuming. Splitify modernizes this workflow with a mobile-first experience that keeps groups, expenses, balances, and settlements organized and transparent.

Built as a cross-platform mobile application backed by cloud services, Splitify provides a streamlined way to create groups, log expenses, choose flexible split methods, track balances in real time, and settle up with confidence. It’s designed for both casual users and organizers who need reliable oversight and simple tools to maintain fairness.

### 1.3. Problems

Common issues with manual or fragmented solutions include:

- Uncertain Balances: No clear, up-to-date view of who owes whom.
- Complex Settlements: Difficult to compute fair shares and minimize payments.
- Lack of Transparency: Hidden assumptions and inconsistent split methods cause disputes.
- Missing History: Hard to find receipts, past payments, and context for decisions.

For group organizers (admins/hosts), manual management leads to:

- Inefficient Tracking: No single source of truth for expenses, members, and balances.
- Dispute Risk: Ambiguity around splits and records creates friction.
- Member Management Gaps: Invites, permissions, and defaults are inconsistent.
- Poor Insight: Limited visibility into trends, spending categories, and settlement health.

### 1.4. The Solution: Splitify

Splitify is a robust "Expense Sharing System" supporting two primary roles:

1. The User: Signs up, creates or joins groups, adds expenses with flexible split methods (equal, shares, percentage, custom), attaches receipts, views real-time balances, and settles debts. The "Group Summary" provides an at-a-glance view of balances, insights, settlements, and trends.
2. The Organizer (Group Admin): Manages groups and members, configures defaults (currency, split rules), reviews expense activity, monitors settlements, and leverages analytics to reduce payment cycles and friction.

Core capabilities include:

- Group Creation & Membership: Create groups, invite members, and manage roles.
- Expense Logging: Add expenses with metadata (payer, participants, split type).
- Real-Time Balances: Automatic computation of who owes whom, kept up to date as expenses change.
- Settlement Assistance: Suggested settlements to minimize the number of payments.
- Analytics & Insights: Category breakdowns, trends, and summaries for better decision-making.

### 1.5. Project Aim

Design and develop a modern, user-friendly, and efficient mobile platform for transparent group expense management, enabling real-time balances, fair splitting, and frictionless settlements. Empower organizers with controls and insights, while ensuring scalability, reliability, and security via cloud-based technologies.

### 1.6. Project Objectives

- Provide a simple, intuitive experience for logging and splitting group expenses.
- Ensure real-time balance updates and transparent calculations.
- Support multiple split methods (equal, shares, percentage, custom amounts).
- Streamline settlement suggestions and maintain clear rental—i.e., expense—history.
- Offer organizers tools for member management and default configuration.
- Deliver insights and trends for spending patterns and settlement health.
- Implement secure authentication, reliable storage, and scalable cloud data.

## 2. Resources

### 2.1. Front End

- React Native
- Expo Framework
- NativeWind (Tailwind CSS for React Native)
- Expo Router (navigation)

### 2.2. Back End

- Firebase Authentication (secure user sign-in and session management)
- Cloud Firestore (NoSQL database for groups, expenses, and balances)
- No cloud storage is used in this project.
- No push notifications are used in this project.

## 3. Feature Snapshot (Mapped to App Screens)

- Authentication & Onboarding: Sign up, login, verify email, profile management.
- Home: Quick access to groups and recent activity.
- Create Group: Configure group defaults and invite members.
- Add Expense: Flexible split methods with metadata.
- Group Summary: Balances, Insights, Settlements, and Trends views.
- Profile: Account management, help, and about.

## 4. Security & Scalability

- Authentication via Firebase with secure token management.
- Structured data in Firestore with rules to protect group and expense records.
- Cloud-backed architecture designed for growth and reliability.

## 5. Expected Outcomes

- Faster, fairer settlements with minimized payment cycles.
- Clear visibility into group finances and spending behavior.
- Reduced disputes due to transparent, consistent split logic.
- A delightful, mobile-first experience for everyday shared expenses.

## 6. Conclusion

Splitify streamlines shared expense management by delivering transparent splits, real-time balances, and settlement suggestions in a simple, mobile-first experience. By focusing on core workflows—group creation, flexible expense logging, summary insights, and fair settlements—the app reduces friction and builds trust among members. With a secure backend and scalable architecture (without cloud storage or push notifications), Splitify is well-positioned to evolve with future enhancements such as reminders, offline-first capabilities, and expanded integrations, while continuing to prioritize usability, reliability, and fairness.

## 7. Works Completed

- Authentication: User signup, login, logout, and email verification flows.
- Session Management: Global auth state via context providers and `AuthProvider`.
- Navigation: App routing with Expo Router layouts for auth, main, tabs, and nested routes.
- Home: Group overview and quick actions with profile and logout modals.
- Groups: Create Group flow and Group Detail view for members/expenses.
- Group Access Codes: Share and join via group-specific access/invite code.
- Expenses: Add Expense screen with participants and split methods; Firestore integration.
- Group Summary: Balances, Insights, Settlements, and Trends components.
- Profile: User profile view and edit, About Splitify, and Help & Support.
- Backend Services: Firebase Authentication and Firestore operations for users, groups, and expenses; no cloud storage or push notifications.
- Tooling & Scripts: Utilities for setup and user debugging to support development.
- UI & Theming: Consistent styles, constants, and shared UI components.

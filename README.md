# 🛠️ KaamConnect

**KaamConnect** is a premium, real-time service marketplace mobile application built with React Native and Expo. It bridges the gap between home/local service seekers (Customers) and verified skilled specialists (Providers/Partners) like electricians, AC technicians, plumbers, and carpenters.

Through real-time database syncing, responsive maps, and operational dashboards, KaamConnect provides a zero-latency, secure, and professional on-demand service ecosystem.

---

## ✨ Core Features

### 👤 Customer Experience
* **Specialist Discovery**: Explore verified home service partners on interactive maps (`react-native-maps`) or via categorized filters.
* **Streamlined Bookings**: Schedule dates, select precise arrival time slots, and submit task summaries.
* **Notification Hub**: Real-time push-like alerts synchronizing job statuses (`Pending`, `Accepted`, `Completed`, `Cancelled`).
* **Interactive Profile & Settings**:
  * **Edit Personal Info**: Manage your name, contact phone, and email in real-time.
  * **Payment Methods**: Add 16-digit cards, toggle default payment methods, and remove expired cards.
  * **Notification Switches**: Toggle push, email, and SMS alerts.
  * **Security Console**: Configure Biometric login (FaceID/Fingerprint) and Two-Factor Authentication.

### 💼 Service Provider (Partner) Experience
* **Offline/Online Duty Toggle**: Quickly toggle availability to pause or receive new job requests on the go.
* **Operational Dashboard**: View monthly earnings analytics, completed job rates, active schedules, and real-time pending alerts.
* **Comprehensive Job Cards**: View customer names, task descriptions, job rates, addresses, and customer phone numbers.
* **Direct Chat Shortcuts**: Connect instantly with assigned clients via the dedicated chat routing system.
* **Partner Profile Settings**:
  * **Offered Services & Rates**: Manage your hourly rate (updating stats dynamically) and choose active specialties from a skills grid.
  * **Flexible Payouts**: Configure preferred payout channels (Bank Transfer/IBAN, EasyPaisa, JazzCash).
  * **Verification Upload Portal**: Upload and monitor legal documents (CNIC, Police Clearance, Certificates) to maintain verification status.

---

## 🚀 Tech Stack

* **Framework**: React Native with **Expo (v54)** (TypeScript enabled).
* **Navigation**: Expo Router (File-based layout system).
* **Database & Auth**: Google Firebase (Firestore Database, Firebase Auth with AsyncStorage persistence).
* **Assets**: High-fidelity custom vectors and icons via Ionicons.
* **Build tool**: EAS (Expo Application Services).

---

## 🛠️ Installation & Setup

Follow these steps to set up the development environment locally:

### 1. Prerequisites
Ensure you have Node.js (v18+) and Git installed on your system.

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/kaamconnect.git
cd kaamconnect
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Firebase Configuration
Update `firebase.ts` with your web app's Firebase configurations:
```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## 📱 Running the Application

Start the Expo bundler:
```bash
npm run start
```
* Press `a` to open in the Android emulator.
* Press `i` to open in the iOS simulator.
* Scan the QR code with the **Expo Go** app on your physical phone to run it.

To clear the cache and start fresh:
```bash
npm run start-clear
```

---

## 📦 Building Standalone APK

The project is fully configured to compile a standalone Android APK using EAS:

1. **Install EAS CLI Globally**:
   ```bash
   npm install -g eas-cli
   ```
2. **Log into your Expo Account**:
   ```bash
   eas login
   ```
3. **Configure & Build standalone APK**:
   ```bash
   eas build -p android --profile preview
   ```

*(EAS is pre-configured in `eas.json` with a dedicated `"preview"` profile to build `.apk` packages rather than default Google Play Store `.aab` bundles).*

---

## 📂 Project Directory Structure

```text
├── app/
│   ├── (auth)/             # Login, Sign Up, and Role Selection
│   ├── (onboarding)/       # Interactive Onboarding Screens
│   ├── (tabs)/
│   │   ├── customer/       # Home, Bookings, Chat, Profile screens
│   │   └── provider/       # Dashboard, Bookings, Chats, Profile screens
│   ├── bookings/           # Schedule & Review appointment flows
│   ├── screens/            # Secondary sub-views (chats, notification hub)
│   └── _layout.tsx         # App entry and Auth routing wrapper
├── assets/                 # App assets (KaamConnect branding logo)
├── components/             # Reusable custom UI components (Toggles, buttons)
├── context/                # Global Auth & Role contexts
├── services/               # Firestore queries, notifications, API utilities
├── app.json                # Expo build configurations (Google Maps credentials, package)
├── eas.json                # Standalone compilation settings
└── package.json            # Dependencies list
```

---

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.

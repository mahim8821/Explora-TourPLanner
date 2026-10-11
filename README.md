# Explora — Tour Planner

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-black.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB.svg)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-v12-FFCA28.svg)](https://firebase.google.com)

**Explora** is a feature-rich, universal mobile and web travel planning application built with React Native and Expo. It provides interactive destination discovery, rich travel itineraries, booking workflows, a district-level interactive Bangladesh heatmap, user authentication, and an administrative dashboard for tour management.

---

## ✨ Features

- 🗺️ **Interactive Heatmap & District Exploration**: Interactive SVG map of Bangladesh divisions and districts with visual visitor statistics, trip density tracking, and social sharing via `expo-sharing`.
- 🏖️ **Destination Discovery & Filtering**: Search and filter destinations across categories including Beach, Mountain, Cultural, Wildlife, Adventure, Island, and Historical.
- 📸 **Rich Media Galleries & Trip Detail**: Multi-photo carousel viewer, destination highlights, pricing, seasonal advice, and real-time weather indicators.
- 🔐 **Authentication**: Firebase Authentication supporting both Email/Password and Google OAuth Sign-In.
- 📦 **Booking & Itinerary System**: Plan, book, and manage personalized travel itineraries with real-time status updates stored in Cloud Firestore.
- 🌓 **Dynamic Theming**: Seamless Light and Dark mode powered by Redux Toolkit state and persistent settings.
- 🛡️ **Admin Dashboard**: Content administration screen for adding new trips, updating booking statuses, managing content, and hosting media via ImgBB.

---

## 🏗️ Architecture & Project Structure

```
Explora/
├── assets/                    # App icons, splash screens, and public assets
├── src/
│   ├── api/                   # Local dataset fixtures and API typing
│   ├── assets/                # App asset bundles and imagery
│   ├── components/            # Reusable UI components (BangladeshMap, TripCard, etc.)
│   ├── data/                  # GeoJSON / District geometry data
│   ├── firebase/              # Firebase services (auth, firestore, trips, storage)
│   ├── hooks/                 # Custom React hooks
│   ├── navigation/            # Navigation stacks (RootNavigator, AppNavigator)
│   ├── screens/               # Main application screens (Heatmap, Browse, Admin, etc.)
│   ├── store/                 # Redux Toolkit store and slices (auth, bookmarks, settings)
│   ├── theme/                 # Design tokens, typography, and ThemeContext
│   └── utils/                 # Utility functions and formatters
├── .env.example               # Template for environment variables
├── App.tsx                    # Root application entry point
├── app.json                   # Expo configuration manifest
├── firestore.rules            # Firestore security rules
└── storage.rules              # Cloud Storage security rules
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/client) app installed on your physical device (iOS or Android), or an emulator/simulator.

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/Explora.git
cd Explora
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Open `.env` and configure your credentials:

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# ImgBB Image Hosting
EXPO_PUBLIC_IMGBB_API_KEY=your_imgbb_api_key

# Google OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com
```

> **Note**: Variables prefixed with `EXPO_PUBLIC_` are inlined by Expo at bundle time. Never commit the `.env` file containing live secrets.

### 4. Run the Application

Start the Expo development server:

```bash
npx expo start
```

Or run directly on your target platform:

```bash
# Web browser
npx expo start --web

# Android emulator/device
npx expo start --android

# iOS simulator
npx expo start --ios
```

---

## 🔒 Security Best Practices

- **Environment Isolation**: All third-party API keys and configuration identifiers are isolated to local `.env` files and blocked via `.gitignore`.
- **Firestore Security Rules**: Review `firestore.rules` for role-based access control protecting user profiles, bookings, and admin-only mutation capabilities.
- **GitHub Security**: When hosting on GitHub, remember to enable **Secret scanning** and **Dependabot alerts** in your repository's **Settings > Code security and analysis**.

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).

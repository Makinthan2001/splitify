import "react-native-get-random-values";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  initializeAuth, 
  // @ts-ignore
  getReactNativePersistence,
  browserLocalPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Firebase config from environment variables
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
};

// Initialize Firebase App
let app: any;
if (getApps().length > 0) {
  app = getApp();
} else {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    app = { 
      name: "[DEFAULT]", 
      options: {}, 
      automaticDataCollectionEnabled: false 
    } as any;
  }
}

export { app };

// Initialize and Export Auth
let auth: any;
try {
  // Always use initializeAuth with persistence for the first initialization
  auth = initializeAuth(app, {
    persistence: Platform.OS === 'web' 
      ? browserLocalPersistence 
      : getReactNativePersistence(AsyncStorage)
  });
} catch (e) {
  // If already initialized, get the existing instance
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);

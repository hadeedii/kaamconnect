import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqKGB6wAXPWtWIaDLjoJUeGOoWIoGhLKk",
  authDomain: "kaamconnect-34348.firebaseapp.com",
  projectId: "kaamconnect-34348",
  storageBucket: "kaamconnect-34348.firebasestorage.app",
  messagingSenderId: "1078779234176",
  appId: "1:1078779234176:web:e787d8ca5e549bc49ce365",
  measurementId: "G-TW6VP5XBCN"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence for React Native
const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    // If auth is already initialized
    return (global as any).firebaseAuth || initializeAuth(app);
  }
})();

// Save reference to prevent re-initialization errors
if (!(global as any).firebaseAuth) {
  (global as any).firebaseAuth = auth;
}

const db = getFirestore(app);

// Mock flag is no longer active as we use live Firestore database only!
const isMockFirebase = false;

export { app, auth, db, isMockFirebase };
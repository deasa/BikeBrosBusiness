import * as firebaseApp from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: REPLACE THIS WITH YOUR FIREBASE CONFIG
// Go to Firebase Console -> Project Settings -> General -> Your Apps -> Config
const firebaseConfig = {
  apiKey: "AIzaSyAO8JSHc0NaN-TSyOIDZzRMiBkH0kUT8lk",
  authDomain: "gen-lang-client-0526565820.firebaseapp.com",
  projectId: "gen-lang-client-0526565820",
  storageBucket: "gen-lang-client-0526565820.firebasestorage.app",
  messagingSenderId: "524387109102",
  appId: "1:524387109102:web:b158408326b44833be4bff",
  measurementId: "G-R4HCS7KE1R"
};

// Simple check to warn the user if they haven't updated the config
if (firebaseConfig.apiKey === "AIzaSy..." || firebaseConfig.projectId === "your-project-id") {
  console.error("Firebase Configuration Missing! Please update services/firebase.ts with your actual Firebase config keys.");
  alert("Configuration Error: You need to update services/firebase.ts with your real Firebase API keys for the app to work.");
}

// Initialize Firebase
const app = firebaseApp.initializeApp(firebaseConfig);
export const db = getFirestore(app);
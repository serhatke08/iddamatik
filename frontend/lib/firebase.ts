// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPUefxfADi7v65Jw3n8Vmls3DRtnS3Pqc",
  authDomain: "iddamatik.firebaseapp.com",
  projectId: "iddamatik",
  storageBucket: "iddamatik.firebasestorage.app",
  messagingSenderId: "930208748610",
  appId: "1:930208748610:web:3858e6b290a14e2da589db",
  measurementId: "G-ZKLDHQWM6D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (only in browser)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { getDatabase, ref, push, onValue, off, serverTimestamp, set, get } from "firebase/database";
// import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYslQM-rI81QdwWihN1SovCk-sO2oaXF4",
  authDomain: "whisprr-effdd.firebaseapp.com",
  databaseURL: "https://whisprr-effdd-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "whisprr-effdd",
  storageBucket: "whisprr-effdd.firebasestorage.app",
  messagingSenderId: "13054542689",
  appId: "1:13054542689:web:159ebcbe3b98b34b357b20",
  measurementId: "G-0NBZ4WRWFS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// Initialize Auth and Database
export const auth = getAuth(app);
export const database = getDatabase(app);

// Export functions for easier use
export { 
  signInAnonymously, 
  onAuthStateChanged, 
  ref, 
  push, 
  onValue, 
  off, 
  serverTimestamp,
  set,
  get,
  type User 
};
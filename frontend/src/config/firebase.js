import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore"
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDc2ALIAZV3kAZa4_5gt2tEc1c6VFkHxnU",
  authDomain: "nebula-5de0b.firebaseapp.com",
  projectId: "nebula-5de0b",
  storageBucket: "nebula-5de0b.firebasestorage.app",
  messagingSenderId: "989259805330",
  appId: "1:989259805330:web:dc60acf3a81f5c7c896c4b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)
export const storage = getStorage(app); 
export const auth = getAuth(app);
// firebase.js - configuración integrada con tu proyecto
export const ADMIN_CODE = 'erik2025';

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCDI8TKyzuOMSkbzygvxCnGZdSe9hnrGpA",
  authDomain: "fixlink-db.firebaseapp.com",
  projectId: "fixlink-db",
  storageBucket: "fixlink-db.firebasestorage.app",
  messagingSenderId: "248111844721",
  appId: "1:248111844721:web:8c7645a91e7ad492f63ad0",
  measurementId: "G-RNJFL2L3MF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
